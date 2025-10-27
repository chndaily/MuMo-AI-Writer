// src/ai/AIProviderFactory.ts
import { IAIProvider, AIConfig, AIServiceType, AIProviderCallbacks, BaseAIProvider } from './IAIProvider'
import { DeepSeekProvider } from './providers/DeepSeekProvider'
import { OpenAIProvider } from './providers/OpenAIProvider'
import { OllamaProvider } from './providers/OllamaProvider'
import { OpenRouterProvider } from './providers/OpenRouterProvider'

export class AIProviderFactory {
  private static instance: AIProviderFactory
  private globalCallbacks: AIProviderCallbacks = {}

  private constructor() { }

  static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory()
    }
    return AIProviderFactory.instance
  }

  // 设置全局回调
  setGlobalCallbacks(callbacks: AIProviderCallbacks) {
    this.globalCallbacks = callbacks
  }

  // 创建AI提供者实例
  createProvider(config: AIConfig): IAIProvider {
    let provider: IAIProvider

    // 添加调试信息
    console.log('AIProviderFactory createProvider:', {
      config: config,
      aiServiceType: config.aiServiceType,
      baseUrl: config.baseUrl
    })

    switch (config.aiServiceType) {
      case AIServiceType.DeepSeek:
        console.log('AIProviderFactory: Creating DeepSeekProvider')
        provider = new DeepSeekProvider(config, this.globalCallbacks)
        break
      case AIServiceType.OpenAI:
        console.log('AIProviderFactory: Creating OpenAIProvider')
        provider = new OpenAIProvider(config, this.globalCallbacks)
        break
      case AIServiceType.Ollama:
        console.log('AIProviderFactory: Creating OllamaProvider')
        provider = new OllamaProvider(config, this.globalCallbacks)
        break
      case AIServiceType.OpenRouter:
        console.log('AIProviderFactory: Creating OpenRouterProvider')
        provider = new OpenRouterProvider(config, this.globalCallbacks)
        break
      case AIServiceType.ModelScope:
        console.log('AIProviderFactory: Creating OpenAIProvider for ModelScope')
        // 对于ModelScope，直接使用OpenAIProvider，因为API兼容
        provider = new OpenAIProvider(config, this.globalCallbacks)
        break
      default:
        console.log('AIProviderFactory: Unsupported AI service type', config.aiServiceType)
        throw new Error(`Unsupported AI service type: ${config.aiServiceType}`)
    }

    return provider
  }

  // 获取可用的服务类型
  getAvailableServiceTypes(): AIServiceType[] {
    return Object.values(AIServiceType)
  }

  // 验证配置是否有效
  validateConfig(config: AIConfig): boolean {
    if (!config.aiServiceType || !config.baseUrl) {
      return false
    }

    // 检查服务类型是否支持
    if (!Object.values(AIServiceType).includes(config.aiServiceType)) {
      return false
    }

    return true
  }

  cancelRequest(requestId: string): boolean {
    return BaseAIProvider.cancelRequest(requestId)
  }

  // 创建配置的工厂方法
  createConfig(
    serviceType: AIServiceType,
    baseUrl: string,
    apiKey?: string,
    accountId?: string
  ): AIConfig {
    return {
      aiServiceType: serviceType,
      baseUrl,
      apiKey,
      accountId
    }
  }
}

// 导出单例实例
export const aiProviderFactory = AIProviderFactory.getInstance()