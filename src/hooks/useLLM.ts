import { useState, useCallback, useRef, useEffect } from 'react'
import { useAIServiceStore } from '../stores/aiServiceStore'
import { LLMProvider, LLMConfig, GenerateRequest, StreamCallback } from '#/llm'
import { aiProviderFactory, AIServiceType, AIRequestPayload, BaseAIProvider } from '@/ai'
import { mapLLMProviderToAIServiceType } from '@/utils/aiProviderUtils'
import { databaseManager } from '@/services/index'
import { AIModelRecord } from '@/services/aiModelStore'

export interface UseLLMReturn {
  // 状态
  loading: boolean
  streaming: boolean
  error: string | null
  response: string | null

  // 配置管理
  configs: LLMConfig[]
  defaultConfig: LLMConfig | undefined
  defaultConfigId: string | null

  // 方法
  generateText: (request: GenerateRequest, configId?: string) => Promise<string | null>
  generateTextStream: (request: GenerateRequest, configId?: string) => Promise<void>
  addConfig: (config: Omit<LLMConfig, 'id'>) => void
  removeConfig: (configId: string) => boolean
  setDefaultConfig: (configId: string) => void
  validateConfig: (configId: string) => Promise<{ success: boolean; responseTime?: number; error?: string }>
  clearError: () => void
  clearResponse: () => void
  stopStream: () => void
}

export function useLLM(): UseLLMReturn {
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<string | null>(null)

  const {
    configs,
    connections,
    defaultConfigId,
    addConfig,
    removeConfig,
    setDefaultConfig,
    getDefaultConfig,
    getConnection,
  } = useAIServiceStore()

  const defaultConfig = getDefaultConfig()

  const abortControllerRef = useRef<AbortController | null>(null)
  // 监听流式状态变化
  useEffect(() => {
    // 流式状态变化时的处理逻辑可以在这里添加
  }, [streaming]);

  // 获取AI提供者
  const getProvider = useCallback(async (configId?: string): Promise<BaseAIProvider | null> => {
    // 如果没有configId，使用默认配置
    if (!configId) {
      if (defaultConfig) {
        return createProviderFromUserConfig(defaultConfig, connections)
      }
      return null
    }

    // 1. 首先尝试在用户配置中查找
    const userConfig = configs.find(c => c.id === configId)
    if (userConfig) {
      return createProviderFromUserConfig(userConfig, connections)
    }
    
    // 2. 尝试通过数据库ID查找默认模型
    try {
      const defaultModelById = await databaseManager.aiModels.getAIModel(configId)
      if (defaultModelById) {
        return createProviderFromDefaultModel(defaultModelById)
      }
    } catch (error) {
      console.error('getProvider: Error getting default model by database ID:', error)
    }
    
    // 3. 尝试通过connectionId查找默认模型
    try {
      const allModels = await databaseManager.aiModels.getAllAIModels()
      const defaultModelByConnectionId = allModels.find(model => model.connectionId === configId)
      if (defaultModelByConnectionId) {
        return createProviderFromDefaultModel(defaultModelByConnectionId)
      }
    } catch (error) {
      console.error('getProvider: Error getting default model by connectionId:', error)
    }
    
    // 4. 尝试通过name字段查找默认模型
    try {
      const allModels = await databaseManager.aiModels.getAllAIModels();
      const defaultModelByName = allModels.find(model => model.name === configId);
      if (defaultModelByName) {
        return createProviderFromDefaultModel(defaultModelByName);
      }
    } catch (error) {
      console.error('getProvider: Error getting default model by name:', error);
    }
    
    // 5. 添加额外的调试信息：检查是否为默认模型
    try {
      const defaultModels = await databaseManager.aiModels.getDefaultAIModels()
      const isDefaultModel = defaultModels.some(model => 
        model.id === configId || 
        model.connectionId === configId || 
        model.name === configId
      )
      
      if (isDefaultModel) {
        const defaultModel = defaultModels.find(model => 
          model.id === configId || 
          model.connectionId === configId || 
          model.name === configId
        )
        if (defaultModel) {
          return createProviderFromDefaultModel(defaultModel)
        }
      }
    } catch (error) {
      console.error('getProvider: Error checking default models:', error)
    }
    
    // 6. 尝试通过模糊匹配查找模型
    try {
      const allModels = await databaseManager.aiModels.getAllAIModels();
      
      // 尝试通过部分匹配查找
      const fuzzyMatch = allModels.find(model => 
        model.connectionId?.includes(configId) || 
        model.id?.includes(configId) ||
        model.name?.includes(configId)
      );
      
      if (fuzzyMatch) {
        return createProviderFromDefaultModel(fuzzyMatch);
      }
    } catch (error) {
      console.error('getProvider: Error getting default model by fuzzy matching:', error);
    }

    return null
  }, [configs, defaultConfig, connections])

  // 从用户配置创建提供者
  const createProviderFromUserConfig = (config: LLMConfig, connections: any[]): BaseAIProvider | null => {
    // 检查config.provider是否有效
    const expectedServiceType = mapLLMProviderToAIServiceType(config.provider)
    
    if (!expectedServiceType) {
      return null
    }

    // 首先尝试通过configId精确匹配连接
    const connection = connections.find(c => c.id === config.id)

    if (connection && connection.provider === expectedServiceType) {
      // 精确匹配成功
      const providerConfig = {
        aiServiceType: connection.provider,
        apiKey: connection.apiKey,
        baseUrl: connection.baseUrl,
      }
      return aiProviderFactory.createProvider(providerConfig) as BaseAIProvider
    }

    // 如果没有精确匹配，查找相同服务类型的连接
    const fallbackConnection = connections.find(c => c.provider === expectedServiceType)
    
    if (fallbackConnection) {
      const providerConfig = {
        aiServiceType: fallbackConnection.provider,
        apiKey: fallbackConnection.apiKey,
        baseUrl: fallbackConnection.baseUrl,
      }
      return aiProviderFactory.createProvider(providerConfig) as BaseAIProvider
    }

    // 如果仍然没有找到连接，尝试直接使用配置中的信息
    if (config.apiKey && config.baseURL) {
      const providerConfig = {
        aiServiceType: expectedServiceType,
        apiKey: config.apiKey,
        baseUrl: config.baseURL || '',
      }
      return aiProviderFactory.createProvider(providerConfig) as BaseAIProvider
    }

    return null
  }

  // 从默认模型创建提供者
  const createProviderFromDefaultModel = (defaultModel: AIModelRecord): BaseAIProvider | null => {
    // 从raw数据中提取API密钥和基础URL
    const raw = defaultModel.raw || {}
    const apiKey = raw.apiKey || ''
    let baseUrl = raw.baseURL || raw.baseUrl || ''  // 兼容不同的字段名
    
    // 根据提供商设置默认的baseUrl
    if (!baseUrl) {
      switch (defaultModel.provider) {
        case 'OpenAI':
          baseUrl = 'https://api.openai.com/v1'
          break
        case 'Anthropic':
          baseUrl = 'https://api.anthropic.com/v1'
          break
        case 'Google':
          baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
          break
        case 'DeepSeek':
          baseUrl = 'https://api.deepseek.com/v1'
          break
        case 'ModelScope':
        case 'modelScope': // 兼容不同的大小写
          baseUrl = 'https://modelscope.cn/api/v1'
          break
        default:
          baseUrl = ''
      }
    }
    
    // 将提供商映射到AIServiceType
    let serviceType: AIServiceType | undefined
    switch (defaultModel.provider) {
      case 'OpenAI':
        serviceType = AIServiceType.OpenAI
        break
      case 'Anthropic':
        serviceType = AIServiceType.OpenRouter // Anthropic 通过 OpenRouter 访问
        break
      case 'Google':
        serviceType = AIServiceType.OpenRouter // Google 通过 OpenRouter 访问
        break
      case 'DeepSeek':
        serviceType = AIServiceType.DeepSeek
        break
      case 'ModelScope':
      case 'modelScope': // 兼容不同的大小写
        serviceType = AIServiceType.ModelScope
        break
      default:
        serviceType = undefined
    }
    
    // ModelScope可能不需要API密钥
    if (serviceType && (apiKey || defaultModel.provider === 'ModelScope' || defaultModel.provider === 'modelScope') && baseUrl) {
      const providerConfig = {
        aiServiceType: serviceType,
        apiKey: apiKey,
        baseUrl: baseUrl,
      }
      
      // 检查模型信息
      const modelName = raw.model || defaultModel.name;
      
      // 验证API密钥
      if (!apiKey && (defaultModel.provider === 'ModelScope' || defaultModel.provider === 'modelScope')) {
        console.warn('createProviderFromDefaultModel: WARNING - No API key provided for ModelScope model');
      }
      
      // 添加额外的验证
      if (apiKey && apiKey.length < 10) {
        console.warn('createProviderFromDefaultModel: WARNING - API key might be invalid (too short)');
      }
      
      return aiProviderFactory.createProvider(providerConfig) as BaseAIProvider
    }
    
    return null
  }

  // 生成文本（非流式）
  const generateText = useCallback(async (request: GenerateRequest, configId?: string): Promise<string | null> => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const provider = await getProvider(configId)
      if (!provider) {
        throw new Error('无法获取AI提供者')
      }

      // 获取配置信息（用于获取模型名称）
      let config: LLMConfig | AIModelRecord | undefined = configId ? configs.find(c => c.id === configId) : defaultConfig
      if (!config && configId) {
        // 如果在用户配置中找不到，尝试从数据库获取默认模型
        try {
          config = await databaseManager.aiModels.getAIModel(configId)
        } catch (error) {
          console.error('generateText: Error getting default model:', error)
        }
      }
      
      if (!config) {
        throw new Error('未找到配置')
      }

      // 处理LLMConfig和AIModelRecord的不同字段名
      let modelName = '';
      if ((config as any).model !== undefined) {
        // LLMConfig类型
        modelName = (config as any).model;
      } else if ((config as any).raw !== undefined && (config as any).raw.model !== undefined) {
        // AIModelRecord类型
        modelName = (config as any).raw.model;
      } else {
        // 回退到name字段
        modelName = (config as any).name;
      }
      
      // 确保模型名称不为空
      if (!modelName) {
        throw new Error('模型名称不能为空');
      }
      
      const payload: AIRequestPayload = {
        model: modelName,
        messages: [
          { role: 'user' as const, content: request.prompt }
        ],
        temperature: request.temperature ?? (config as any).temperature ?? 0.7,
        max_tokens: request.maxTokens ?? (config as any).maxTokens ?? 128000, // 默认max_tokens设置为128000
      }

      const result = await provider.sendRequest(payload)

      if (result.text) {
        setResponse(result.text)
        return result.text
      } else {
        setError('生成失败')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [configs, defaultConfig, getProvider])

  // 生成文本（流式）
  const generateTextStream = useCallback(async (request: GenerateRequest, configId?: string): Promise<void> => {
    setStreaming(true);
    setError(null);
    setResponse('');

    const streamCallback: StreamCallback = {
      onData: (chunk: string) => {
        setResponse(prev => {
          const newResponse = prev + chunk;
          return newResponse;
        });
      },
      onComplete: (fullResponse: string) => {
        setResponse(fullResponse);
        setStreaming(false);
      },
      onError: (error: Error) => {
        setError(error.message);
        setStreaming(false);
      },
    };

    try {
      const provider = await getProvider(configId)
      if (!provider) {
        throw new Error('无法获取AI提供者')
      }

      // 获取配置信息（用于获取模型名称）
      let config: LLMConfig | AIModelRecord | undefined = configId ? configs.find(c => c.id === configId) : defaultConfig
      if (!config && configId) {
        // 如果在用户配置中找不到，尝试从数据库获取默认模型
        try {
          config = await databaseManager.aiModels.getAIModel(configId)
        } catch (error) {
          console.error('generateTextStream: Error getting default model:', error)
        }
      }
      
      if (!config) {
        throw new Error('未找到配置')
      }

      // 处理LLMConfig和AIModelRecord的不同字段名
      let modelName = '';
      if ((config as any).model !== undefined) {
        // LLMConfig类型
        modelName = (config as any).model;
      } else if ((config as any).raw !== undefined && (config as any).raw.model !== undefined) {
        // AIModelRecord类型
        modelName = (config as any).raw.model;
      } else {
        // 回退到name字段
        modelName = (config as any).name;
      }
      
      // 确保模型名称不为空
      if (!modelName) {
        throw new Error('模型名称不能为空');
      }
      
      const payload: AIRequestPayload = {
        model: modelName,
        messages: [
          { role: 'user' as const, content: request.prompt }
        ],
        temperature: request.temperature ?? (config as any).temperature ?? 0.7,
        max_tokens: request.maxTokens ?? (config as any).maxTokens ?? 128000, // 默认max_tokens设置为128000
      }

      // 生成请求ID
      const requestId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // 创建AbortController并存储到ref中，以便stopStream可以使用
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      
      // 设置提供者的回调，以便在请求开始时关联abortController
      provider.setCallbacks({
        onRequestStart: (reqId, reqPayload) => {
          // 请求开始时，将abortController与请求ID关联
          if (reqId === requestId) {
            BaseAIProvider.activeRequests.set(reqId, [abortController, Date.now()])
          }
        },
        onRequestComplete: (reqId, response, duration) => {
          // 请求完成时，清除abortController
          if (reqId === requestId) {
            BaseAIProvider.activeRequests.delete(reqId)
            abortControllerRef.current = null
            setStreaming(false)
            // 检查是否是中止的请求，如果是则不调用onComplete
            if (!response.text.includes('[AbortError]')) {
              // 调用流完成回调
              streamCallback.onComplete?.(response.text)
            }
          }
        },
        onRequestError: (reqId, error, duration) => {
          // 请求出错时，清除abortController
          if (reqId === requestId) {
            BaseAIProvider.activeRequests.delete(reqId)
            abortControllerRef.current = null
            setStreaming(false)
            // 如果不是中止错误，则调用错误回调
            if (!(error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted')))) {
              streamCallback.onError?.(error)
            }
          }
        }
      })
      
      await provider.sendStreamingRequest(payload, (data) => {
        setResponse(prev => {
          const newResponse = prev + data.text;
          streamCallback.onData?.(data.text);
          return newResponse;
        });
      }, requestId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      if (errorMessage.includes('aborted') || errorMessage.includes('AbortError')) {
        setStreaming(false) // 流被中止时只需设置状态
      } else {
        streamCallback.onError?.(new Error(errorMessage))
      }
    }
  }, [configs, defaultConfig, getProvider])

  // 验证配置
  const validateConfig = useCallback(async (configId: string): Promise<{ success: boolean; responseTime?: number; error?: string }> => {
    try {
      const provider = await getProvider(configId)
      if (!provider) {
        return { success: false, error: '无法获取AI提供者' }
      }

      const startTime = Date.now()
      const models = await provider.getAvailableModels()
      const responseTime = Date.now() - startTime

      return { 
        success: models.length > 0, 
        responseTime 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '验证失败' 
      }
    }
  }, [getProvider])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 清除响应
  const clearResponse = useCallback(() => {
    setResponse(null)
  }, [])

  // 停止流式生成
  const stopStream = useCallback(() => {
    // 中止所有活动请求
    BaseAIProvider.activeRequests.forEach(([controller]) => {
      controller.abort();
    });
    // 清除所有活动请求
    BaseAIProvider.activeRequests.clear();
    
    // 清除abortController引用
    if (abortControllerRef.current) {
      abortControllerRef.current = null;
    }
    
    // 设置流状态为false
    setStreaming(false);
    // 清除可能的错误状态
    setError(null);
    // 清除响应状态，防止内容被重复插入
    setResponse(null);
  }, [])

  return {
    loading,
    streaming,
    error,
    response,
    configs,
    defaultConfig,
    defaultConfigId,
    generateText,
    generateTextStream,
    addConfig,
    removeConfig,
    setDefaultConfig,
    validateConfig,
    clearError,
    clearResponse,
    stopStream,
  }
}