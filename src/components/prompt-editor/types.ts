// CodeMirror 相关类型定义
export interface EditorView {
  state: EditorState;
  dispatch: (transaction: any) => void;
  dom: HTMLElement;
}

export interface EditorState {
  doc: { toString(): string; length: number };
  selection: { main: { from: number; to: number; head: number } };
}

export interface CompletionContext {
  state: EditorState;
  pos: number;
  explicit: boolean;
}

export interface Completion {
  label: string;
  type?: string;
  info?: string;
  apply?: string | ((view: EditorView, completion: Completion, from: number, to: number) => void);
  detail?: string;
}

export interface CompletionResult {
  from: number;
  to: number;
  options: Completion[];
  validFor?: RegExp;
}

// 核心类型定义
export interface PromptFunction {
  name: string;
  type: 'single' | 'multi' | 'condition' | 'utility';
  description: string;
  params?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    required?: boolean;
    default?: any;
  }>;
  returnType?: 'string' | 'boolean' | 'number' | 'void';
  execute: (context: ExecutionContext, ...args: any[]) => any;
}

export interface ExecutionContext {
  variables: Record<string, any>;
  functions: Record<string, PromptFunction>;
  globalContext: GlobalContext;
}

export interface GlobalContext {
  message?: string;
  pov?: string;
  textBefore?: string;
  textAfter?: string;
  scene?: any;
  story?: any;
  [key: string]: any;
}

export interface ParseNode {
  type: 'text' | 'expression' | 'condition' | 'include';
  content: string;
  children?: ParseNode[];
  condition?: string;
  elseChildren?: ParseNode[];
}

// 组件属性接口
export interface PromptEditorProps {
  initialTemplate?: string;
  customFunctions?: Record<string, PromptFunction>;
  onTemplateChange?: (template: string) => void;
  height?: string | number;
  theme?: 'light' | 'dark';
}


// 全局上下文管理器接口
export interface IGlobalContextManager {
  setContext(key: string, value: any): void;
  getContext(key?: string): any;
  updateContext(updates: Partial<GlobalContext>): void;
  subscribe(callback: () => void): () => void;
} 