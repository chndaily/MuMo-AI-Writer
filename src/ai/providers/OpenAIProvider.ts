// src/ai/providers/OpenAIProvider.ts
import axios from 'axios'
import { BaseAIProvider, AIRequestPayload, AIResponse, AIConfig, AIProviderModel } from '../IAIProvider'
import { MODEL_PRESETS } from '../modelPresets'
import { LLMProvider } from '#/llm'

export class OpenAIProvider extends BaseAIProvider {
  private currentModel: string | undefined;

  constructor(config: AIConfig, callbacks?: any) {
    super(config, callbacks)
  }

  async getAvailableModels(): Promise<AIProviderModel[]> {
    try {
      // 检查是否为火山引擎API（不支持/models端点）
      if (this.config.baseUrl && this.config.baseUrl.includes('volcengine')) {
        // 返回火山引擎支持的模型列表
        return [
          { name: 'Doubao-lite-4k', raw: {} },
          { name: 'Doubao-lite-32k', raw: {} },
          { name: 'Doubao-lite-128k', raw: {} },
          { name: 'Doubao-pro-4k', raw: {} },
          { name: 'Doubao-pro-32k', raw: {} },
          { name: 'Doubao-pro-128k', raw: {} },
        ]
      }
      
      const res = await axios.get(`${this.config.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      })
      // 假设返回 { data: [{ id: 'gpt-3.5-turbo' }, ...] }
      return res.data?.data?.map((m: any) => ({
        name: m.id,
        raw: m
      })) || []
    } catch (error) {
      console.error('Failed to get OpenAI models:', error)
      // 抛出错误而不是返回默认模型列表，这样验证逻辑可以正确检测到连接问题
      throw new Error(`Failed to get models: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  // 验证并修正max_tokens参数
  private validateMaxTokens(maxTokens: number | undefined): number | undefined {
    if (maxTokens === undefined) {
      return undefined;
    }
    
    // 获取模型对应的最大token数
    let modelMaxTokens = 512000; // 默认最大值
    
    if (this.currentModel) {
      // 查找模型预设中的maxTokens配置
      for (const [provider, models] of Object.entries(MODEL_PRESETS)) {
        if (models[this.currentModel]) {
          modelMaxTokens = models[this.currentModel].maxTokens || modelMaxTokens;
          break;
        }
      }
    }
    
    // 确保maxTokens在有效范围内 [1, modelMaxTokens]
    if (maxTokens < 1) {
      return 1;
    }
    
    // 增加最大token限制以支持更长的内容生成
    if (maxTokens > modelMaxTokens) {
      return modelMaxTokens;
    }
    
    return maxTokens;
  }

  async sendRequest(payload: AIRequestPayload, customRequestId?: string): Promise<AIResponse> {
    // 保存当前模型名称
    this.currentModel = payload.model;
    
    console.log('OpenAIProvider.sendRequest: payload=', payload);
    
    // 检查ModelScope的模型ID
    if (this.config.baseUrl.includes('modelscope.cn') && payload.model) {
      // ModelScope可能需要特殊的模型ID处理
      console.log('OpenAIProvider.sendRequest: ModelScope model detected');
      
      // 检查是否是无效的模型ID
      const invalidModelIds = ['MSQwen3-Next-80B', 'MSDeepSeek-V3.2'];
      if (invalidModelIds.includes(payload.model)) {
        console.warn(`OpenAIProvider.sendRequest: Invalid model ID detected: ${payload.model}`);
        
        // 根据模型ID选择合适的替换模型
        let validModelId = 'Qwen/Qwen2-72B-Instruct'; // 默认使用Qwen模型
        if (payload.model.includes('DeepSeek')) {
          validModelId = 'deepseek-ai/DeepSeek-V3'; // DeepSeek模型使用对应的模型
        }
        
        console.log(`OpenAIProvider.sendRequest: Replacing with valid model ID: ${validModelId}`);
        payload = {
          ...payload,
          model: validModelId
        };
      }
    }
    
    const requestId = this.getOrGenerateRequestId(customRequestId)

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
      
      console.log('OpenAIProvider.sendRequest: validatedPayload=', validatedPayload);

      // 添加超时控制
      const res = await axios.post(`${this.config.baseUrl}/chat/completions`, validatedPayload, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
        signal: controller.signal,
        timeout: 30000 // 30秒超时
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

  async sendStreamingRequest(payload: AIRequestPayload, onData: (data: AIResponse) => void, customRequestId?: string): Promise<void> {
    // 保存当前模型名称
    this.currentModel = payload.model;
    
    console.log('OpenAIProvider.sendStreamingRequest: payload=', payload);
    
    // 检查ModelScope的模型ID
    if (this.config.baseUrl.includes('modelscope.cn') && payload.model) {
      // ModelScope可能需要特殊的模型ID处理
      console.log('OpenAIProvider.sendStreamingRequest: ModelScope model detected');
      
      // 检查是否是无效的模型ID
      const invalidModelIds = ['MSQwen3-Next-80B', 'MSDeepSeek-V3.2'];
      if (invalidModelIds.includes(payload.model)) {
        console.warn(`OpenAIProvider.sendStreamingRequest: Invalid model ID detected: ${payload.model}`);
        
        // 根据模型ID选择合适的替换模型
        let validModelId = 'Qwen/Qwen2-72B-Instruct'; // 默认使用Qwen模型
        if (payload.model.includes('DeepSeek')) {
          validModelId = 'deepseek-ai/DeepSeek-V3'; // DeepSeek模型使用对应的模型
        }
        
        console.log(`OpenAIProvider.sendStreamingRequest: Replacing with valid model ID: ${validModelId}`);
        payload = {
          ...payload,
          model: validModelId
        };
      }
    }
    
    const requestId = this.getOrGenerateRequestId(customRequestId)
    const controller = this.recordRequestStart(requestId, payload)
    if (!controller) {
      throw new Error('Failed to create abort controller')
    }
    
    try {
      // 验证并修正max_tokens参数
      const validatedMaxTokens = this.validateMaxTokens(payload.max_tokens);
      
      // 确保max_tokens参数正确传递，设置更高的默认值以支持长内容生成
      const openaiPayload = {
        ...payload,
        stream: true,
        max_tokens: validatedMaxTokens || 128000  // 默认设置为128000 tokens
      }
      
      console.log('OpenAIProvider.sendStreamingRequest: openaiPayload=', openaiPayload);
      
      const response = await this.fetchWithRetry(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiPayload),
        signal: controller.signal
      }, 1) // 最多重试1次

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (errorText) {
          errorMessage += `, message: ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      let decoder = new TextDecoder()
      let accumulatedText = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim()
              if (data === '[DONE]') {
                break
              }
              
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  accumulatedText += content
                  onData({ text: content, requestId, usage: parsed.usage })
                }
              } catch (e) {
                // 忽略解析错误，继续处理下一行
                console.warn('Failed to parse SSE data:', data)
              }
            }
          }
        }

        // 流式请求完成，调用完成回调
        this.recordRequestComplete(requestId, { text: accumulatedText, requestId, usage: undefined })
      } catch (error) {
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
          // 请求被中止，记录完成状态，但使用特殊标记表示是被中止的
          this.recordRequestComplete(requestId, { text: '[AbortError] Request aborted', requestId, usage: undefined })
        } else {
          throw error
        }
      } finally {
        reader.releaseLock()
        // 确保在finally块中清理activeRequests
        BaseAIProvider.activeRequests.delete(requestId);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.recordRequestError(requestId, error)
      }
      // 提供更详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('OpenAIProvider.sendStreamingRequest: Error:', errorMessage);
      throw new Error(`AI请求失败: ${errorMessage}`);
    }
  }
}