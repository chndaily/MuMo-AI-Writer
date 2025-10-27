import axios from 'axios'
import { BaseAIProvider, AIRequestPayload, AIResponse, AIConfig, AIProviderModel } from '../IAIProvider'

export class OpenRouterProvider extends BaseAIProvider {
  constructor(config: AIConfig, callbacks?: any) {
    super(config, callbacks)
  }

  async getAvailableModels(): Promise<AIProviderModel[]> {
    try {
      const res = await axios.get(`${this.config.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      })
      // 假设返回 { data: [{ id: 'gpt-3.5-turbo' }, ...] }
      return res.data.data.map((m: any) => ({
        name: m.id,
        raw: m
      }))
    } catch (error) {
      console.error('Failed to get OpenRouter models:', error)
      // 抛出错误而不是返回空数组，这样验证逻辑可以正确检测到连接问题
      throw new Error(`Failed to get models: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sendRequest(payload: AIRequestPayload, customRequestId?: string): Promise<AIResponse> {
    const requestId = this.getOrGenerateRequestId(customRequestId)
    try {
      const controller = this.recordRequestStart(requestId, payload)
      if (!controller) {
        throw new Error('Failed to create abort controller')
      }
      const res = await axios.post(`${this.config.baseUrl}/v1/chat/completions`, payload, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        signal: controller.signal
      })
      // 假设返回 { choices: [{ message: { content: 'xxx' } }] }
      const response: AIResponse = {
        text: res.data.choices[0].message.content,
        requestId,
        usage: res.data.usage
      }

      this.recordRequestComplete(requestId, response)
      return response
    } catch (error) {
      if (error instanceof Error) {
        this.recordRequestError(requestId, error)
      }
      throw error
    }
  }

  // 添加延迟函数
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 添加带重试机制的请求函数
  private async fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 2): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        
        // 如果不是速率限制错误，直接返回响应
        if (response.status !== 429) {
          return response;
        }
        
        // 如果是最后一次重试，直接返回响应
        if (i === maxRetries) {
          return response;
        }
        
        // 计算延迟时间（指数退避，但缩短延迟时间）
        const delayTime = Math.pow(1.5, i) * 500 + Math.random() * 500;
        console.log(`Rate limited. Retrying in ${delayTime}ms... (attempt ${i + 1}/${maxRetries + 1})`);
        await this.delay(delayTime);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 如果是最后一次重试，抛出错误
        if (i === maxRetries) {
          throw lastError;
        }
        
        // 等待后重试（缩短等待时间）
        await this.delay(500);
      }
    }
    
    throw lastError || new Error('Unknown error');
  }

  async sendStreamingRequest(payload: AIRequestPayload, onData: (data: AIResponse) => void, customRequestId?: string): Promise<void> {
    const requestId = this.getOrGenerateRequestId(customRequestId)
    try {
      const controller = this.recordRequestStart(requestId, payload)
      if (!controller) {
        throw new Error('Failed to create abort controller')
      }
      const response = await this.fetchWithRetry(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, stream: true }),
        signal: controller.signal
      }, 2) // 缩短重试次数为2次

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      let decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        if (chunk.trim()) {
          accumulatedText += chunk
          onData({ text: chunk, requestId })
        }
      }

      // 流式请求完成
      const finalResponse: AIResponse = {
        text: accumulatedText,
        requestId
      }

      this.recordRequestComplete(requestId, finalResponse)
    } catch (error) {
      if (error instanceof Error) {
        this.recordRequestError(requestId, error)
      }
      throw error
    }
  }
} 