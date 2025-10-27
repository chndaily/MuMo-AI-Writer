import { ParseNode } from '../types';
import { ParseError } from './ParseError';

/**
 * 提示词模板解析器
 * 负责将模板字符串解析为语法树
 */
export class PromptParser {
  private pos: number = 0;
  private input: string = '';
  private knownFunctionNames: Set<string> = new Set();

  constructor(knownFunctions?: string[]) {
    if (knownFunctions && Array.isArray(knownFunctions)) {
      this.knownFunctionNames = new Set(knownFunctions);
    }
  }

  setKnownFunctions(knownFunctions: string[]) {
    this.knownFunctionNames = new Set(knownFunctions);
  }

  parse(input: string): ParseNode[] {
    this.input = input;
    this.pos = 0;
    return this.parseNodes();
  }

  private computeLineCol(index: number): { line: number; column: number } {
    let line = 1;
    let col = 1;
    for (let i = 0; i < index && i < this.input.length; i++) {
      if (this.input[i] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
    return { line, column: col };
  }

  private parseNodes(): ParseNode[] {
    const nodes: ParseNode[] = [];
    while (this.pos < this.input.length) {
      const node = this.parseNode();
      if (node) nodes.push(node);
    }
    return nodes;
  }

  private parseNode(): ParseNode | null {
    const char = this.input[this.pos];
    if (char === '{') {
      return this.parseExpression();
    } else {
      return this.parseText();
    }
  }

  private parseText(): ParseNode {
    let content = '';
    while (this.pos < this.input.length && this.input[this.pos] !== '{') {
      content += this.input[this.pos];
      this.pos++;
    }
    return { type: 'text', content };
  }

  private parseExpression(): ParseNode | null {
    if (this.input[this.pos] !== '{') return null;

    const startIndex = this.pos; // 记录起始位置用于报错
    this.pos++; // 跳过 '{'
    // 注释语法：{! ... !} 支持多行，直到遇到 !}
    if (this.input[this.pos] === '!') {
      this.pos++; // 跳过 '!'
      while (this.pos < this.input.length) {
        if (this.input[this.pos] === '!' && this.input[this.pos + 1] === '}') {
          this.pos += 2; // 消费 '!}'
          return { type: 'text', content: '' };
        }
        this.pos++;
      }
      const { line, column } = this.computeLineCol(startIndex);
      throw new ParseError('Unterminated comment, expected !}', line, column);
    }
    let content = '';
    let braceCount = 1;

    while (this.pos < this.input.length && braceCount > 0) {
      const char = this.input[this.pos];
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;

      if (braceCount > 0) content += char;
      this.pos++;
    }

    // 未闭合：抛出错误
    if (braceCount !== 0) {
      const { line, column } = this.computeLineCol(startIndex);
      throw new ParseError('Expected comment, end of input, expression, logic block, or regular text but "{" found.', line, column);
    }

    const inner = content.trim();
    // 空表达式报错（与用户期望一致）
    if (inner.length === 0) {
      const { line, column } = this.computeLineCol(startIndex);
      throw new ParseError('Expected comment, end of input, expression, logic block, or regular text but "{" found.', line, column);
    }

    if (inner.startsWith('#if ')) {
      const condition = inner.substring(4).trim();
      // 在条件表达式中校验函数名
      this.validateFunctionCalls(condition, startIndex + 1);
      return this.parseConditionBlock(condition, startIndex);
    } else if (inner === '#else' || inner === '#endif') {
      // 让上层处理这些控制标记：包装为表达式节点传回去供条件块消费
      return { type: 'expression', content: inner };
    } else if (inner.startsWith('include(')) {
      return { type: 'include', content: inner.substring(8, inner.length - 1) };
    } else {
      // 普通表达式中校验函数名
      this.validateFunctionCalls(inner, startIndex + 1);
      return { type: 'expression', content: inner };
    }
  }

  private parseConditionBlock(condition: string, ifStartIndex: number): ParseNode {
    const node: ParseNode = {
      type: 'condition',
      content: `#if ${condition}`,
      condition,
      children: [],
      elseChildren: []
    };

    let parsingElse = false;

    while (this.pos < this.input.length) {
      const nextNode = this.parseNode();
      if (!nextNode) break;

      if (nextNode.type === 'expression') {
        const ctrl = nextNode.content.trim();
        if (ctrl === '#else') {
          if (parsingElse) {
            const { line, column } = this.computeLineCol(this.pos);
            throw new ParseError('Unexpected #else', line, column);
          }
          parsingElse = true;
          continue;
        }
        if (ctrl === '#endif') {
          return node;
        }
      }

      if (parsingElse) node.elseChildren!.push(nextNode);
      else node.children!.push(nextNode);
    }

    // 未遇到 #endif
    const { line, column } = this.computeLineCol(ifStartIndex);
    throw new ParseError('Unterminated #if block, missing #endif', line, column);
  }

  private validateFunctionCalls(segment: string, segmentGlobalStartIndex: number) {
    if (!this.knownFunctionNames || this.knownFunctionNames.size === 0) return;

    // 预计算字符串区间，避免误判
    const stringSpans: Array<{ from: number; to: number }> = [];
    {
      let i = 0;
      while (i < segment.length) {
        const ch = segment[i];
        if (ch === '"' || ch === '\'') {
          const quote = ch;
          const start = i;
          i++;
          while (i < segment.length) {
            if (segment[i] === '\\') { i += 2; continue; }
            if (segment[i] === quote) { i++; break; }
            i++;
          }
          const end = i;
          stringSpans.push({ from: start, to: end });
          continue;
        }
        i++;
      }
    }

    const isInsideString = (idx: number) => stringSpans.some(s => idx >= s.from && idx < s.to);

    // 识别标识符（含点路径），对 head 段进行函数校验
    const identifierRegex = /\b([A-Za-z_][\w.]*?)\b/g;
    let match: RegExpExecArray | null;
    while ((match = identifierRegex.exec(segment)) !== null) {
      const fullIdent = match[1];
      const head = fullIdent.split('.')[0];
      const startIdx = match.index;
      const endIdx = startIdx + match[0].length;

      if (isInsideString(startIdx)) continue; // 跳过字符串内
      if (head === 'include' || head === 'if' || head === 'else' || head === 'endif') continue;
      // 检查是否是调用形式：标识符后跟可选空白再跟左括号
      let j = endIdx;
      while (j < segment.length && /\s/.test(segment[j])) j++;
      const isCall = segment[j] === '(';
      console.log(1111, segment, isCall)
      if (!this.knownFunctionNames.has(head)) {
        const absoluteIndex = segmentGlobalStartIndex + startIdx;
        const { line, column } = this.computeLineCol(absoluteIndex);
        throw new ParseError(`Unknown function: ${head}`, line, column);
      }
    }
  }
} 