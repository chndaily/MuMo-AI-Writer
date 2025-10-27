import { ExecutionContext, ParseNode, GlobalContext } from '../types';
import { PromptParser } from './PromptParser';
import { ExpressionExecutor } from './ExpressionExecutor';
import { promptAllFunctions } from '../functions';


const knownFunctionNames = Object.keys(promptAllFunctions);

/**
 * 提示词模板渲染器
 * 负责将解析后的语法树渲染为最终文本
 */
export class PromptRenderer {
  private parser: PromptParser;
  private executor: ExpressionExecutor;
  private context: ExecutionContext;

  constructor(context: ExecutionContext) {
    this.context = context;
    this.parser = new PromptParser(knownFunctionNames);
    this.executor = new ExpressionExecutor(context);
  }

  /**
   * 对外提供的静态方法：渲染模板（只需要传入上下文和函数）
   * @param template 模板字符串
   * @param globalContext 全局上下文
   * @param customFunctions 自定义函数（可选）
   * @returns 渲染后的文本
   */
  static renderTemplate(
    template: string,
    globalContext: GlobalContext,
  ): string {
    const context: ExecutionContext = {
      variables: {},
      functions: promptAllFunctions,
      globalContext
    };

    const renderer = new PromptRenderer(context);
    return renderer.render(template);
  }

  /**
   * 对外提供的静态方法：检查模板语法是否正确
   * @param template 模板字符串
   * @param knownFunctions 可选的已知函数名数组，用于在解析期校验未知函数
   * @returns 语法检查结果，包含是否有效和错误信息
   */
  static checkSyntax(template: string): { isValid: boolean; error?: unknown } {
    try {
      const parser = new PromptParser(knownFunctionNames);
      parser.parse(template);
      return { isValid: true };
    } catch (error: any) {
      return {
        isValid: false,
        error: error,
      };
    }
  }

  /**
   * 渲染模板
   * @param template 模板字符串
   * @returns 渲染后的文本
   */
  render(template: string): string {
    const nodes = this.parser.parse(template);
    return this.renderNodes(nodes);
  }

  parse(template: string) {
    return this.parser.parse(template)
  }

  /**
   * 渲染节点数组
   * @param nodes 节点数组
   * @returns 渲染后的文本
   */
  private renderNodes(nodes: ParseNode[]): string {
    return nodes.map(node => this.renderNode(node)).join('');
  }

  /**
   * 渲染单个节点
   * @param node 要渲染的节点
   * @returns 渲染后的文本
   */
  private renderNode(node: ParseNode): string {
    switch (node.type) {
      case 'text':
        return node.content;

      case 'expression':
        return String(this.executor.execute(node.content));

      case 'condition':
        return this.renderCondition(node);

      case 'include':
        const includeResult = this.executor.execute(`include("${node.content}")`);
        return String(includeResult);

      default:
        return '';
    }
  }

  /**
   * 渲染条件节点
   * @param node 条件节点
   * @returns 渲染后的文本
   */
  private renderCondition(node: ParseNode): string {
    const result = this.executor.execute(node.condition!);
    if (result) {
      return this.renderNodes(node.children || []);
    } else {
      return this.renderNodes(node.elseChildren || []);
    }
  }
} 