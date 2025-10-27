// 示例：如何在App.tsx中设置全局AI回调
import { aiProviderFactory } from './AIProviderFactory'
import { AIServiceType, AIResponse, IAIProvider } from './IAIProvider'

// 在App.tsx或类似的根组件中设置全局回调
export function setupAIGlobalCallbacks() {
  const callbacks = {
    onRequestStart: (requestId: string, payload: any) => {
      console.log(`🚀 AI请求开始: ${requestId}`, payload)
      // 可以在这里显示加载状态、记录日志等
    },

    onRequestComplete: (requestId: string, response: any, duration: number) => {
      console.log(`✅ AI请求完成: ${requestId}`, {
        duration: `${duration}ms`,
        tokens: response.usage?.total_tokens || 'unknown'
      })
      // 可以在这里隐藏加载状态、记录成功日志、更新统计等
    },

    onRequestError: (requestId: string, error: Error, duration: number) => {
      console.error(`❌ AI请求失败: ${requestId}`, {
        error: error.message,
        duration: `${duration}ms`
      })
      // 可以在这里显示错误提示、记录错误日志等
    },

    onTokenUsage: (requestId: string, usage: any) => {
      console.log(`💾 Token使用情况: ${requestId}`, {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      })
      // 可以在这里更新token统计、计算成本等
    }
  }

  // 设置全局回调
  aiProviderFactory.setGlobalCallbacks(callbacks)
}

// 示例：如何使用AI提供者（用户自己管理实例）
export async function exampleUsage() {
  // 1. 创建配置
  const config1 = aiProviderFactory.createConfig(
    AIServiceType.DeepSeek,
    'https://api.deepseek.com',
    'account1-api-key',
    'account1'
  )

  const config2 = aiProviderFactory.createConfig(
    AIServiceType.DeepSeek,
    'https://api.deepseek.com',
    'account2-api-key',
    'account2'
  )

  // 2. 创建provider实例（用户自己管理）
  const provider1 = aiProviderFactory.createProvider(config1)
  const provider2 = aiProviderFactory.createProvider(config2)

  // 3. 使用不同的provider实例
  try {
    // 使用账号1的provider
    const response1 = await provider1.sendRequest({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello from account1' }]
    }, 'user-chat-001')

    console.log('账号1响应:', response1.text)
    console.log('请求ID:', response1.requestId)

    // 使用账号2的provider
    const response2 = await provider2.sendRequest({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello from account2' }]
    }, 'user-chat-002')

    console.log('账号2响应:', response2.text)
    console.log('请求ID:', response2.requestId)

  } catch (error) {
    console.error('请求失败:', error)
  }

  // 4. 用户自己管理provider的生命周期
  // 不需要时，provider会自动被垃圾回收
  // 如果需要取消请求，直接调用provider的方法
  // await provider1.cancelAllRequests()
  // await provider2.cancelAllRequests()
}

// 示例：在组件中使用（用户自己管理实例）
export function useAIProvider() {
  const sendMessage = async (message: string, accountId: string, customRequestId?: string) => {
    // 每次调用都创建新的配置和provider实例
    const config = aiProviderFactory.createConfig(
      AIServiceType.DeepSeek,
      'https://api.deepseek.com',
      process.env[`REACT_APP_DEEPSEEK_API_KEY_${accountId.toUpperCase()}`],
      accountId
    )

    const provider = aiProviderFactory.createProvider(config)

    try {
      const response = await provider.sendRequest({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: message }]
      }, customRequestId)

      return response
    } catch (error) {
      console.error(`账号${accountId}的AI请求失败:`, error)
      throw error
    }
    // provider实例在这里结束生命周期，会被垃圾回收
  }

  const sendStreamingMessage = async (message: string, onData: (data: AIResponse) => void, accountId: string, customRequestId?: string) => {
    const config = aiProviderFactory.createConfig(
      AIServiceType.DeepSeek,
      'https://api.deepseek.com',
      process.env[`REACT_APP_DEEPSEEK_API_KEY_${accountId.toUpperCase()}`],
      accountId
    )

    const provider = aiProviderFactory.createProvider(config)

    try {
      await provider.sendStreamingRequest({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: message }]
      }, onData, customRequestId)
    } catch (error) {
      console.error(`账号${accountId}的AI流式请求失败:`, error)
      throw error
    }
    // provider实例在这里结束生命周期，会被垃圾回收
  }

  return { sendMessage, sendStreamingMessage }
}

// 示例：长期使用的provider（用户自己存储和管理）
export class AIProviderManager {
  private providers: Map<string, IAIProvider> = new Map()

  // 获取或创建provider
  getProvider(accountId: string, serviceType: AIServiceType = AIServiceType.DeepSeek): IAIProvider {
    const key = `${serviceType}-${accountId}`

    if (!this.providers.has(key)) {
      const config = aiProviderFactory.createConfig(
        serviceType,
        'https://api.deepseek.com',
        process.env[`REACT_APP_${serviceType.toUpperCase()}_API_KEY_${accountId.toUpperCase()}`],
        accountId
      )

      const provider = aiProviderFactory.createProvider(config)
      this.providers.set(key, provider)
    }

    return this.providers.get(key)!
  }

  // 清理特定provider
  clearProvider(accountId: string, serviceType: AIServiceType = AIServiceType.DeepSeek): boolean {
    const key = `${serviceType}-${accountId}`
    return this.providers.delete(key)
  }

  // 清理所有provider
  clearAllProviders(): void {
    this.providers.clear()
  }

  // 获取统计信息
  getStats() {
    return {
      totalProviders: this.providers.size,
      providers: Array.from(this.providers.keys())
    }
  }
}