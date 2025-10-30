// src/ai/providers/DeepSeekProvider.ts
import axios from 'axios'
import { BaseAIProvider, AIRequestPayload, AIResponse, AIConfig, AIProviderModel, AIProviderCallbacks } from '../IAIProvider'

interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  system_fingerprint: string
  choices: {
    index: number
    delta: {
      content: string
    }
    finish_reason: string
    logprobs: null
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_tokens_details: {
      cached_tokens: number
    }
    prompt_cache_hit_tokens: number
    prompt_cache_miss_tokens: number
  }
}

export class DeepSeekProvider extends BaseAIProvider {
  constructor(config: AIConfig, callbacks?: AIProviderCallbacks) {
    super(config, callbacks)
  }

  // 验证并修正max_tokens参数
  private validateMaxTokens(maxTokens: number | undefined): number | undefined {
    if (maxTokens === undefined) {
      return undefined;
    }
    
    // DeepSeek API对max_tokens的限制是[1, 65536]
    const minTokens = 1;
    const maxTokensLimit = 65536;
    
    // 确保maxTokens在有效范围内 [1, 65536]
    if (maxTokens < minTokens) {
      return minTokens;
    }
    
    if (maxTokens > maxTokensLimit) {
      return maxTokensLimit;
    }
    
    return maxTokens;
  }

  async getAvailableModels(): Promise<AIProviderModel[]> {
    try {
      const res = await axios.get(`${this.config.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      })
      return res.data?.data?.map((item: any) => ({
        name: item.id,
        raw: item
      })) || []
    } catch (error) {
      console.error('Failed to get DeepSeek models:', error)
      // 抛出错误而不是返回空数组，这样验证逻辑可以正确检测到连接问题
      throw new Error(`Failed to get models: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sendRequest(payload: AIRequestPayload, customRequestId?: string): Promise<AIResponse> {
    const requestId = this.getOrGenerateRequestId(customRequestId)
    
    // 检查ModelScope的模型ID
    if (this.config.baseUrl.includes('modelscope.cn') && payload.model) {
      // ModelScope可能需要特殊的模型ID处理
      console.log('DeepSeekProvider.sendRequest: ModelScope model detected');
      
      // 检查是否是无效的模型ID
      const invalidModelIds = ['MSDeepSeek-V3.2'];
      if (invalidModelIds.includes(payload.model)) {
        console.warn(`DeepSeekProvider.sendRequest: Invalid model ID detected: ${payload.model}`);
        // 尝试使用默认的DeepSeek模型
        const validModelId = 'deepseek-ai/DeepSeek-V3';
        console.log(`DeepSeekProvider.sendRequest: Replacing with valid model ID: ${validModelId}`);
        payload = {
          ...payload,
          model: validModelId
        };
      }
    }
    
    // 添加调试信息
    console.log('DeepSeekProvider.sendRequest: config=', this.config);
    console.log('DeepSeekProvider.sendRequest: API Key present=', !!this.config.apiKey);
    if (this.config.apiKey) {
      console.log('DeepSeekProvider.sendRequest: API Key length=', this.config.apiKey.length);
    }
    
    try {
      const controller = this.recordRequestStart(requestId, payload)
      if (!controller) {
        throw new Error('Failed to create abort controller')
      }
      
      // 验证并修正max_tokens参数
      const validatedPayload = {
        ...payload,
        max_tokens: this.validateMaxTokens(payload.max_tokens)
      };

      // 检查API密钥
      if (!this.config.apiKey) {
        console.error('DeepSeekProvider.sendRequest: No API key provided');
        throw new Error('No API key provided for ModelScope model');
      }
      
      // 检查API密钥格式
      if (this.config.apiKey.length < 10) {
        console.warn('DeepSeekProvider.sendRequest: API key might be invalid (too short)');
      }
      
      const res = await axios.post(`${this.config.baseUrl}/chat/completions`, validatedPayload, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        signal: controller.signal
      })

      const response: AIResponse = {
        text: res.data.choices[0].message?.content || res.data.choices[0].text || '',
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
  private async fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 1): Promise<Response> {
    let lastError: Error | null = null;
    
    // 添加超时控制
    const timeout = 30000; // 30秒超时
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        // 创建超时Promise
        const timeoutPromise = new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );
        
        // 创建实际请求Promise
        const fetchPromise = fetch(url, {
          ...options,
          signal: options.signal
        });
        
        // 等待最先完成的Promise
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // 如果不是速率限制错误，直接返回响应
        if (response.status !== 429) {
          return response;
        }
        
        // 如果是最后一次重试，直接返回响应
        if (i === maxRetries) {
          return response;
        }
        
        // 计算延迟时间（减少重试延迟）
        const delayTime = Math.min(1000 + i * 500, 2000); // 最大2秒延迟
        console.log(`Rate limited. Retrying in ${delayTime}ms... (attempt ${i + 1}/${maxRetries + 1})`);
        await this.delay(delayTime);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 如果是最后一次重试，抛出错误
        if (i === maxRetries) {
          throw lastError;
        }
        
        // 等待后重试（减少等待时间）
        await this.delay(300);
      }
    }
    
    throw lastError || new Error('Unknown error');
  }

  async sendStreamingRequest(payload: AIRequestPayload, onData: (data: AIResponse) => void, customRequestId?: string): Promise<void> {
    const requestId = this.getOrGenerateRequestId(customRequestId)
    
    // 检查ModelScope的模型ID
    if (this.config.baseUrl.includes('modelscope.cn') && payload.model) {
      // ModelScope可能需要特殊的模型ID处理
      console.log('DeepSeekProvider.sendStreamingRequest: ModelScope model detected');
      
      // 检查是否是无效的模型ID
      const invalidModelIds = ['MSDeepSeek-V3.2'];
      if (invalidModelIds.includes(payload.model)) {
        console.warn(`DeepSeekProvider.sendStreamingRequest: Invalid model ID detected: ${payload.model}`);
        // 尝试使用默认的DeepSeek模型
        const validModelId = 'deepseek-ai/DeepSeek-V3';
        console.log(`DeepSeekProvider.sendStreamingRequest: Replacing with valid model ID: ${validModelId}`);
        payload = {
          ...payload,
          model: validModelId
        };
      }
    }
    
    // 添加调试信息
    console.log('DeepSeekProvider.sendStreamingRequest: config=', this.config);
    console.log('DeepSeekProvider.sendStreamingRequest: API Key present=', !!this.config.apiKey);
    if (this.config.apiKey) {
      console.log('DeepSeekProvider.sendStreamingRequest: API Key length=', this.config.apiKey.length);
    }
    
    try {
      const controller = this.recordRequestStart(requestId, payload)
      if (!controller) {
        throw new Error('Failed to create abort controller')
      }
      
      // 验证并修正max_tokens参数
      const validatedMaxTokens = this.validateMaxTokens(payload.max_tokens);
      
      // 添加调试信息
      console.log('DeepSeekProvider sendStreamingRequest:', {
        baseUrl: this.config.baseUrl,
        model: payload.model,
        payloadLength: JSON.stringify(payload).length
      })
      
      // 检查API密钥
      if (!this.config.apiKey) {
        console.error('DeepSeekProvider.sendStreamingRequest: No API key provided');
        throw new Error('No API key provided for ModelScope model');
      }
      
      // 检查API密钥格式
      if (this.config.apiKey.length < 10) {
        console.warn('DeepSeekProvider.sendStreamingRequest: API key might be invalid (too short)');
      }
      
      const response = await this.fetchWithRetry(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          stream: true,
          max_tokens: validatedMaxTokens
        }),
        signal: controller.signal
      }, 1) // 减少重试次数为1次

      if (!response.ok) {
        const errorText = await response.text()
        console.error('HTTP error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        })
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
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
        let chunk = decoder.decode(value).replace(/\n+$/, '').replace(/^data: /, '').split(/\n\ndata:/g)
        chunk.forEach(item => {
          if (/\[DONE\]$/.test(item)) return

          if (item.trim()) {
            try {
              const chunkData: DeepSeekResponse | null = JSON.parse(item)
              const content = chunkData?.choices[0]?.delta?.content || ''

              if (content) {
                accumulatedText += content
                onData({
                  text: content,
                  requestId,
                  usage: chunkData?.usage
                })
              }
            } catch (parseError) {
              console.warn('Failed to parse chunk:', item, parseError)
            }
          }
        })
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