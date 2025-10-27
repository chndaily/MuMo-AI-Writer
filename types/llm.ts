import { AIServiceType, AIProviderModel } from "@/ai"

// LLM 提供商枚举
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  AZURE = 'azure',
  DEEPSEEK = 'deepseek',
  MODELSCOPE = 'modelScope',
  LOCAL = 'local',
}

// LLM 配置接口
export interface LLMConfig {
  id: string  // 唯一标识符
  name: string  // 配置名称（用户自定义）
  provider: LLMProvider
  apiKey: string
  baseURL?: string
  model: string
  temperature?: number
  maxTokens?: number
  timeout?: number
}

// 模型连接
export interface LLMConnection {
  name: string
  id: string,
  disabled: boolean,
  apiKey?: string,
  baseUrl: string,
  organizationId?: string,
  projectId?: string,
  provider: AIServiceType
}

// 扩展AIProviderModel
export interface LLMConnectionModel extends AIProviderModel {
  connectionId: string
}

// 流式响应回调
export interface StreamCallback {
  onData?: (chunk: string) => void
  onComplete?: (fullResponse: string) => void
  onError?: (error: Error) => void
}

// 生成请求参数
export interface GenerateRequest {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  stop?: string[]
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

// 生成响应
export interface GenerateResponse {
  success: boolean
  data?: string
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  metadata?: {
    model: string
    provider: string
    responseTime: number
  }
}