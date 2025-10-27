export interface IAIProvider {
  getAvailableModels(): Promise<AIProviderModel[]>
  sendRequest(payload: AIRequestPayload, requestId?: string): Promise<AIResponse>
  sendStreamingRequest(payload: AIRequestPayload, onData: (data: AIResponse) => void, requestId?: string): Promise<void>
  cancelRequest(requestId: string): Promise<boolean>
}

export interface AIRequestPayload {
  model: string
  messages: {
    role: 'user' | 'assistant' | 'system'
    content: string,
    name?: string
  }[],
  [key: string]: any
}

export interface AIResponse {
  text: string
  requestId: string // 改为必需字段
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  [key: string]: any
}

export enum AIServiceType {
  OpenAI = 'openai',
  DeepSeek = 'deepseek',
  Ollama = 'ollama',
  OpenRouter = 'openrouter',
  OpenPipe = 'openpipe',
  ModelScope = 'modelScope',
}

export interface AIConfig {
  aiServiceType: AIServiceType
  apiKey?: string
  baseUrl: string
  // 新增：账号标识，用于区分同一服务的多个账号
  accountId?: string
}

export interface AIProviderModel {
  name: string
  raw: any
}

// 新增：AI回调接口
export interface AIProviderCallbacks {
  onRequestStart?: (requestId: string, payload: AIRequestPayload) => void
  onRequestComplete?: (requestId: string, response: AIResponse, duration: number) => void
  onRequestError?: (requestId: string, error: Error, duration: number) => void
  onTokenUsage?: (requestId: string, usage: AIResponse['usage']) => void
}

// 新增：AI提供者基类
export abstract class BaseAIProvider implements IAIProvider {
  static activeRequests: Map<string, [AbortController, number]> = new Map()

  static cancelRequest(requestId: string): boolean {
    const request = BaseAIProvider.activeRequests.get(requestId)
    if (request) {
      request[0].abort()
      BaseAIProvider.activeRequests.delete(requestId)
      return true
    }
    return false
  }

  protected callbacks: AIProviderCallbacks

  constructor(protected config: AIConfig, callbacks: AIProviderCallbacks = {}) {
    this.callbacks = callbacks
  }

  // 设置回调（允许运行时更新）
  setCallbacks(callbacks: AIProviderCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  // 生成请求ID
  protected generateRequestId(): string {
    return `${this.config.aiServiceType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取或生成请求ID
  protected getOrGenerateRequestId(customRequestId?: string): string {
    return customRequestId || this.generateRequestId()
  }

  // 验证请求ID格式
  protected validateRequestId(requestId: string): boolean {
    // 基本验证：不能为空，长度合理
    return Boolean(requestId && requestId.length > 0 && requestId.length < 100)
  }

  // 记录请求开始
  protected recordRequestStart(requestId: string, payload: AIRequestPayload) {
    if (!this.validateRequestId(requestId)) {
      console.warn('Invalid requestId:', requestId)
      return
    }
    const controller = new AbortController()
    this.callbacks.onRequestStart?.(requestId, payload)
    BaseAIProvider.activeRequests.set(requestId, [controller, Date.now()])
    return controller
  }

  // 记录请求完成
  protected recordRequestComplete(requestId: string, response: AIResponse) {
    const startTime = BaseAIProvider.activeRequests.get(requestId)?.[1]
    const duration = startTime ? Date.now() - startTime : 0

    BaseAIProvider.activeRequests.delete(requestId)

    this.callbacks.onRequestComplete?.(requestId, response, duration)

    if (response.usage) {
      this.callbacks.onTokenUsage?.(requestId, response.usage)
    }
  }

  // 记录请求错误
  protected recordRequestError(requestId: string, error: Error) {
    const startTime = BaseAIProvider.activeRequests.get(requestId)?.[1]
    const duration = startTime ? Date.now() - startTime : 0

    // 确保在记录错误前清理activeRequests
    BaseAIProvider.activeRequests.delete(requestId)

    this.callbacks.onRequestError?.(requestId, error, duration)
  }

  // 取消请求
  async cancelRequest(requestId: string): Promise<boolean> {
    return BaseAIProvider.cancelRequest(requestId)
  }

  // 取消所有请求
  async cancelAllRequests(): Promise<void> {
    for (const [requestId] of BaseAIProvider.activeRequests) {
      await this.cancelRequest(requestId)
    }
  }

  // 抽象方法，子类必须实现
  abstract getAvailableModels(): Promise<AIProviderModel[]>
  abstract sendRequest(payload: AIRequestPayload, requestId?: string): Promise<AIResponse>
  abstract sendStreamingRequest(payload: AIRequestPayload, onData: (data: AIResponse) => void, requestId?: string): Promise<void>
}