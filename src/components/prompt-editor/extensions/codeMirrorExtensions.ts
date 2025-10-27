import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { PromptFunction } from '../types';
import { EditorView, Decoration, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

/**
 * 通过正则实现的简单语法高亮插件
 */
function promptHighlightPlugin() {
  // 大括号表达式匹配
  const braceRegex = /\{[^{}]*\}/g;

  // 装饰器定义
  const braceMark = Decoration.mark({ class: 'cm-prompt-brace' });
  const funcMark = Decoration.mark({ class: 'cm-prompt-function' });
  const keywordMark = Decoration.mark({ class: 'cm-prompt-keyword' });
  const stringMark = Decoration.mark({ class: 'cm-prompt-string' });

  const buildDecorations = (view: EditorView) => {
    const builder = new RangeSetBuilder<Decoration>();
    const text = view.state.doc.toString();

    // 只处理大括号内的内容
    for (const braceMatch of text.matchAll(braceRegex) as any) {
      const braceStart = braceMatch.index as number;
      const braceEnd = braceStart + braceMatch[0].length;
      const braceContent = braceMatch[0];

      // 先添加大括号装饰器
      builder.add(braceStart, braceEnd, braceMark);

      // 提取大括号内的内容（去掉 { 和 }）
      const innerContent = braceContent.slice(1, -1);
      const innerStart = braceStart + 1;

      // 如果内容为空，跳过
      if (innerContent.trim().length === 0) continue;

      // 处理大括号内的语法高亮
      let pos = 0;
      const tokens: Array<{ type: string; start: number; end: number; content: string }> = [];

      // 简单的词法分析器
      while (pos < innerContent.length) {
        const char = innerContent[pos];

        // 跳过空白字符
        if (/\s/.test(char)) {
          pos++;
          continue;
        }

        // 处理字符串
        if (char === '"' || char === "'") {
          const quote = char;
          const start = pos;
          pos++; // 跳过引号

          while (pos < innerContent.length && innerContent[pos] !== quote) {
            if (innerContent[pos] === '\\') pos += 2; // 跳过转义字符
            else pos++;
          }

          if (pos < innerContent.length) {
            pos++; // 跳过结束引号
            tokens.push({
              type: 'string',
              start: start,
              end: pos,
              content: innerContent.slice(start, pos)
            });
          }
          continue;
        }

        // 处理关键字 (#if, #else, #endif)
        if (char === '#') {
          const start = pos;
          pos++;

          // 读取关键字
          while (pos < innerContent.length && /[a-zA-Z]/.test(innerContent[pos])) {
            pos++;
          }

          const keyword = innerContent.slice(start, pos);
          if (['#if', '#else', '#endif'].includes(keyword)) {
            tokens.push({
              type: 'keyword',
              start: start,
              end: pos,
              content: keyword
            });
            continue;
          }
          // 如果不是关键字，回退位置
          pos = start;
        }

        // 处理标识符（函数名、变量名等）
        if (/[a-zA-Z_]/.test(char)) {
          const start = pos;
          pos++;

          while (pos < innerContent.length && /[a-zA-Z0-9_.]/.test(innerContent[pos])) {
            pos++;
          }

          const identifier = innerContent.slice(start, pos);

          // 跳过关键字（不带#的）
          if (!['if', 'else', 'endif'].includes(identifier)) {
            tokens.push({
              type: 'function',
              start: start,
              end: pos,
              content: identifier
            });
          }
          continue;
        }

        // 跳过其他字符（如括号、逗号等）
        pos++;
      }

      // 应用装饰器
      for (const token of tokens) {
        const from = innerStart + token.start;
        const to = innerStart + token.end;

        switch (token.type) {
          case 'string':
            builder.add(from, to, stringMark);
            break;
          case 'keyword':
            builder.add(from, to, keywordMark);
            break;
          case 'function':
            builder.add(from, to, funcMark);
            break;
        }
      }
    }

    return builder.finish();
  };

  class PromptHighlighter {
    decorations: any;
    constructor(public view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  }

  return ViewPlugin.fromClass(PromptHighlighter, {
    decorations: (v: PromptHighlighter) => v.decorations
  });
}

/**
 * 创建自定义语言模式（返回可直接使用的 CodeMirror 扩展）
 */
export const createPromptLanguage = (functions: Record<string, PromptFunction>) => {
  // 样式主题
  const theme = EditorView.theme({
    '.cm-prompt-brace': { fontWeight: 'bold' },
    '.cm-prompt-function': { color: '#ff9f6e', fontWeight: 'bold' },
    '.cm-prompt-keyword': { color: '#875a85', fontWeight: 'bold' },
    '.cm-prompt-variable': { color: '#116329' },
    '.cm-prompt-string': { color: '#65b791' },
    '.cm-prompt-comment': { color: '#656d76', fontStyle: 'italic' },
    '.cm-matchingBracket': { color: '#0969da' },
    '.cm-scroller': { lineHeight: '2', fontSize: '15px' }
  });

  return [promptHighlightPlugin(), theme];
};

/**
 * 创建自动补全源
 * @param functions 可用函数列表
 * @returns 自动补全函数
 */
export const createCompletionSource = (functions: Record<string, PromptFunction>) => {
  return (context: CompletionContext): CompletionResult | null => {
    const { state, pos } = context;
    const doc = state.doc.toString();

    // 检查是否在大括号内
    let braceStart = -1;
    for (let i = pos - 1; i >= 0; i--) {
      if (doc[i] === '{') {
        braceStart = i;
        break;
      } else if (doc[i] === '}') {
        return null; // 不在大括号内
      }
    }

    if (braceStart === -1) return null;

    // 获取大括号内的内容
    const braceContent = doc.slice(braceStart + 1, pos);
    // 支持点号路径：匹配末尾的 [A-Za-z0-9_.#]
    const fullWord = braceContent.match(/[\w.#]*$/)?.[0] || '';

    // 生成补全选项
    const options: Completion[] = [];

    const lowerPrefix = fullWord.toLowerCase();

    // 添加函数（使用前缀匹配，支持包含点号的名称，如 pov.character）
    Object.values(functions).forEach(func => {
      if (func.name.toLowerCase().startsWith(lowerPrefix)) {
        const hasParams = func.params && func.params.length > 0;
        const paramStr = hasParams
          ? `(${func.params?.map(p => p.required !== false ? p.name : `[${p.name}]`).join(', ')})`
          : ['message', 'pov', 'storySoFar', 'hasTextAfter', 'hasTextBefore'].includes(func.name)
            ? ''
            : '()';

        options.push({
          label: func.name,
          type: 'function',
          info: func.description,
          apply: func.name + paramStr,
          detail: `${func.type} function`
        });
      }
    });

    // 添加关键字
    const keywords = ['#if', '#endif', '#else'];
    keywords.forEach(keyword => {
      if (keyword.toLowerCase().startsWith(lowerPrefix)) {
        options.push({
          label: keyword,
          type: 'keyword',
          info: `Control structure: ${keyword}`,
          apply: keyword
        });
      }
    });

    if (options.length === 0) return null;

    return {
      from: pos - fullWord.length,
      to: pos,
      options,
      // 放宽匹配，允许在自动补全期间继续输入字母/数字/下划线/点号/#
      validFor: /^[\w.#]*$/
    } as CompletionResult;
  };
};

/**
 * 获取CodeMirror基础配置
 */
export const getCodeMirrorBasicSetup = () => ({
  lineNumbers: true,
  highlightActiveLineGutter: true,
  highlightActiveLine: true,
  bracketMatching: true,
  autocompletion: true,
  searchKeymap: true,
  foldGutter: true,
  dropCursor: true,
  allowMultipleSelections: true,
  indentOnInput: true,
  syntaxHighlighting: true,
  tabSize: 2,
  closeBrackets: true,
  highlightSelectionMatches: true,
  search: true,
  lint: true
});

/**
 * 获取主题配置
 */
export const getThemeConfig = (theme: 'light' | 'dark') => {
  const themes = {
    light: {
      background: '#ffffff',
      foreground: '#24292f',
      selection: '#0969da',
      selectionMatch: '#f6f8fa',
      cursor: '#24292f',
      lineNumbers: '#656d76',
      activeLineGutter: '#0969da',
      gutterBackground: '#f6f8fa',
      matchingBracket: '#0969da'
    },
    dark: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      selection: '#1f6feb',
      selectionMatch: '#21262d',
      cursor: '#c9d1d9',
      lineNumbers: '#8b949e',
      activeLineGutter: '#1f6feb',
      gutterBackground: '#161b22',
      matchingBracket: '#1f6feb'
    }
  };

  return themes[theme] || themes.light;
}; 