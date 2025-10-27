import { ExecutionContext } from '../types';

/**
 * 表达式执行器
 * 负责执行模板中的表达式和函数调用
 */
export class ExpressionExecutor {
  private context: ExecutionContext;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  // 计算 Levenshtein 距离
  private static levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // 删除
          dp[i][j - 1] + 1,      // 插入
          dp[i - 1][j - 1] + cost // 替换
        );
      }
    }

    return dp[m][n];
  }

  // 从候选集合中找出相近名称
  private getSimilarNames(input: string, candidates: string[], maxSuggestions: number = 5): string[] {
    const lowerInput = input.toLowerCase();
    const scored = candidates.map(name => {
      const score = ExpressionExecutor.levenshtein(lowerInput, name.toLowerCase());
      return { name, score };
    });

    // 动态阈值：长度较短时更严格
    const threshold = Math.max(1, Math.floor(input.length / 3));
    const filtered = scored
      .filter(s => s.score <= threshold + 1)
      .sort((a, b) => a.score - b.score)
      .slice(0, maxSuggestions)
      .map(s => s.name);

    return filtered;
  }

  /**
   * 执行表达式
   * @param expression 要执行的表达式
   * @returns 执行结果
   */
  execute(expression: string): any {
    expression = expression.trim();

    if (expression.includes('(')) {
      return this.executeFunctionCall(expression);
    }

    return this.executeVariable(expression);
  }

  /**
   * 执行函数调用
   * @param expression 函数调用表达式
   * @returns 函数执行结果
   */
  private executeFunctionCall(expression: string): any {
    const match = expression.match(/^(\w+)\((.*)\)$/);
    if (!match) {
      throw new Error(`Invalid function call: ${expression}`);
    }

    const [, funcName, argsString] = match;
    const func = this.context.functions[funcName];

    if (!func) {
      const functionNames = Object.keys(this.context.functions);
      const suggestions = this.getSimilarNames(funcName, functionNames);
      const suffix = suggestions.length > 0 ? `\nDid you mean:\n  - ${suggestions.join('\n  - ')}` : '';
      throw new Error(`Unknown function: ${funcName}${suffix}`);
    }

    const args = this.parseArguments(argsString);
    return func.execute(this.context, ...args);
  }

  /**
   * 执行变量引用
   * @param name 变量名
   * @returns 变量值
   */
  private executeVariable(name: string): any {
    if (this.context.variables.hasOwnProperty(name)) {
      return this.context.variables[name];
    }

    if (this.context.globalContext.hasOwnProperty(name)) {
      return this.context.globalContext[name];
    }

    const func = this.context.functions[name];
    if (func) {
      return func.execute(this.context);
    }

    // 未匹配到：提供相近名称建议（综合变量/全局/函数）
    const variableNames = Object.keys(this.context.variables || {});
    const globalNames = Object.keys(this.context.globalContext || {});
    const functionNames = Object.keys(this.context.functions || {});
    const pool = Array.from(new Set([...variableNames, ...globalNames, ...functionNames]));
    const suggestions = this.getSimilarNames(name, pool);
    const suffix = suggestions.length > 0 ? `\nDid you mean:\n  - ${suggestions.join('\n  - ')}` : '';

    throw new Error(`Unknown variable or function: ${name}${suffix}`);
  }

  /**
   * 解析函数参数
   * @param argsString 参数字符串
   * @returns 解析后的参数数组
   */
  private parseArguments(argsString: string): any[] {
    if (!argsString.trim()) return [];

    const args: any[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let parenCount = 0;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        continue;
      }

      if (inQuotes && char === quoteChar) {
        inQuotes = false;
        args.push(current);
        current = '';
        continue;
      }

      if (!inQuotes) {
        if (char === '(') parenCount++;
        else if (char === ')') parenCount--;
        else if (char === ',' && parenCount === 0) {
          args.push(this.parseArgument(current.trim()));
          current = '';
          continue;
        }
      }

      current += char;
    }

    if (current.trim()) {
      args.push(this.parseArgument(current.trim()));
    }

    return args;
  }

  /**
   * 解析单个参数
   * @param arg 参数字符串
   * @returns 解析后的参数值
   */
  private parseArgument(arg: string): any {
    // 数字与布尔
    if (/^\d+$/.test(arg)) return parseInt(arg, 10);
    if (/^\d+\.\d+$/.test(arg)) return parseFloat(arg);
    if (arg === 'true') return true;
    if (arg === 'false') return false;

    // 嵌套调用/表达式
    if (arg.includes('(')) {
      return this.execute(arg);
    }

    // 标识符：按照 executeVariable 逻辑解析；未找到则抛出错误
    if (/^[A-Za-z_]\w*$/.test(arg)) {
      if (this.context.variables.hasOwnProperty(arg)) {
        return this.context.variables[arg];
      }
      if (this.context.globalContext.hasOwnProperty(arg)) {
        return this.context.globalContext[arg];
      }
      const func = this.context.functions[arg];
      if (func) {
        return func.execute(this.context);
      }

      const variableNames = Object.keys(this.context.variables || {});
      const globalNames = Object.keys(this.context.globalContext || {});
      const functionNames = Object.keys(this.context.functions || {});
      const pool = Array.from(new Set([...variableNames, ...globalNames, ...functionNames]));
      const suggestions = this.getSimilarNames(arg, pool);
      const suffix = suggestions.length > 0 ? `\nDid you mean:\n  - ${suggestions.join('\n  - ')}` : '';
      throw new Error(`Unknown variable or function: ${arg}${suffix}`);
    }

    // 其他情况：按原样返回（例如包含点号/操作符的自由文本参数）
    return arg;
  }
} 