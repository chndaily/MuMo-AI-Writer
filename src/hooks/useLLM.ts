import { useState, useCallback, useRef } from 'react'
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

  // 获取AI提供者
  const getProvider = useCallback(async (configId?: string): Promise<BaseAIProvider | null> => {
    console.log('getProvider: configId=', configId)
    
    // 如果有configId，首先尝试获取对应的配置
    if (configId) {
      // 1. 尝试在用户配置中查找
      const userConfig = configs.find(c => c.id === configId)
      if (userConfig) {
        console.log('getProvider: Found user config', userConfig)
        return createProviderFromUserConfig(userConfig, connections)
      }
      
      // 2. 如果在用户配置中找不到，尝试获取默认模型
      // 首先尝试通过connectionId查找
      try {
        const defaultModelByConnectionId = await databaseManager.aiModels.getAIModel(configId)
        console.log('getProvider: defaultModelByConnectionId=', defaultModelByConnectionId)
        
        if (defaultModelByConnectionId) {
          console.log('getProvider: Using default model by connectionId')
          return createProviderFromDefaultModel(defaultModelByConnectionId)
        }
      } catch (error) {
        console.error('getProvider: Error getting default model by connectionId:', error)
      }
      
      // 如果通过connectionId找不到，尝试通过数据库ID查找
      try {
        // 获取所有默认模型，然后查找匹配的ID
        const allModels = await databaseManager.aiModels.getAllAIModels()
        console.log('getProvider: allModels=', allModels)
        const defaultModelById = allModels.find(model => model.id === configId)
        console.log('getProvider: defaultModelById=', defaultModelById)
        
        if (defaultModelById) {
          console.log('getProvider: Using default model by database ID')
          return createProviderFromDefaultModel(defaultModelById)
        }
      } catch (error) {
        console.error('getProvider: Error getting default model by database ID:', error)
      }
      
      // 添加额外的调试信息：检查是否为默认模型
      try {
        console.log('getProvider: Checking if configId is a default model')
        const defaultModels = await databaseManager.aiModels.getDefaultAIModels()
        console.log('getProvider: defaultModels from DB=', defaultModels)
        const isDefaultModel = defaultModels.some(model => model.id === configId)
        console.log('getProvider: isDefaultModel=', isDefaultModel)
        
        if (isDefaultModel) {
          const defaultModel = defaultModels.find(model => model.id === configId)
          console.log('getProvider: Found default model by ID', defaultModel)
          return createProviderFromDefaultModel(defaultModel!)
        }
      } catch (error) {
        console.error('getProvider: Error checking default models:', error)
      }
      
      // 如果以上方法都失败了，尝试通过name字段查找
      try {
        console.log('getProvider: Trying to find model by name');
        const allModels = await databaseManager.aiModels.getAllAIModels();
        console.log('getProvider: allModels for name search=', allModels);
        const defaultModelByName = allModels.find(model => model.name === configId);
        console.log('getProvider: defaultModelByName=', defaultModelByName);
        
        if (defaultModelByName) {
          console.log('getProvider: Using default model by name');
          return createProviderFromDefaultModel(defaultModelByName);
        }
      } catch (error) {
        console.error('getProvider: Error getting default model by name:', error);
      }
      
      // 尝试通过模糊匹配查找模型
      try {
        console.log('getProvider: Trying fuzzy matching');
        const allModels = await databaseManager.aiModels.getAllAIModels();
        console.log('getProvider: allModels for fuzzy matching=', allModels);
        
        // 尝试通过部分匹配查找
        const fuzzyMatch = allModels.find(model => 
          model.connectionId?.includes(configId) || 
          model.id?.includes(configId) ||
          model.name?.includes(configId)
        );
        
        console.log('getProvider: fuzzyMatch=', fuzzyMatch);
        
        if (fuzzyMatch) {
          console.log('getProvider: Using default model by fuzzy matching');
          return createProviderFromDefaultModel(fuzzyMatch);
        }
      } catch (error) {
        console.error('getProvider: Error getting default model by fuzzy matching:', error);
      }
    }
    
    // 如果没有指定configId，使用默认配置
    if (defaultConfig) {
      console.log('getProvider: Using default config', defaultConfig)
      return createProviderFromUserConfig(defaultConfig, connections)
    }

    // 最后的备用方案：尝试获取第一个可用的默认模型
    try {
      console.log('getProvider: Trying to get first available default model');
      const defaultModels = await databaseManager.aiModels.getDefaultAIModels();
      if (defaultModels.length > 0) {
        console.log('getProvider: Using first default model', defaultModels[0]);
        return createProviderFromDefaultModel(defaultModels[0]);
      }
    } catch (error) {
      console.error('getProvider: Error getting first default model:', error);
    }

    console.log('getProvider: No config found, returning null')
    return null
  }, [configs, defaultConfig, connections])

  // 从用户配置创建提供者
  const createProviderFromUserConfig = (config: LLMConfig, connections: any[]): BaseAIProvider | null => {
    console.log('createProviderFromUserConfig: config=', config)
    
    // 检查config.provider是否有效
    console.log('createProviderFromUserConfig: config.provider=', config.provider)
    
    // 检查mapLLMProviderToAIServiceType是否能正确映射
    const expectedServiceType = mapLLMProviderToAIServiceType(config.provider)
    console.log('createProviderFromUserConfig: expectedServiceType=', expectedServiceType)
    
    if (!expectedServiceType) {
      console.log('createProviderFromUserConfig: No expectedServiceType found for provider', config.provider)
      return null
    }

    console.log('createProviderFromUserConfig: all connections=', connections)

    // 首先尝试通过configId精确匹配连接
    const connection = connections.find(c => c.id === config.id)
    console.log('createProviderFromUserConfig: exact match connection=', connection)

    if (connection && connection.provider === expectedServiceType) {
      // 精确匹配成功
      console.log('createProviderFromUserConfig: Using exact match connection')
      const providerConfig = {
        aiServiceType: connection.provider,
        apiKey: connection.apiKey,
        baseUrl: connection.baseUrl,
      }
      console.log('createProviderFromUserConfig: providerConfig=', providerConfig)
      return aiProviderFactory.createProvider(providerConfig) as BaseAIProvider
    }

    // 如果没有精确匹配，查找相同服务类型的连接
    const fallbackConnection = connections.find(c => c.provider === expectedServiceType)
    console.log('createProviderFromUserConfig: fallback connection=', fallbackConnection)
    
    if (fallbackConnection) {
      console.log('createProviderFromUserConfig: Using fallback connection')
      const providerConfig = {
        aiServiceType: fallbackConnection.provider,
        apiKey: fallbackConnection.apiKey,
        baseUrl: fallbackConnection.baseUrl,
      }
      console.log('createProviderFromUserConfig: fallback providerConfig=', providerConfig)
      return aiProviderFactory.createProvider(providerConfig) as BaseAIProvider
    }

    // 如果仍然没有找到连接，尝试直接使用配置中的信息
    console.log('createProviderFromUserConfig: No connection found, trying to use config directly')
    if (config.apiKey && config.baseURL) {
      const providerConfig = {
        aiServiceType: expectedServiceType,
        apiKey: config.apiKey,
        baseUrl: config.baseURL || '',
      }
      console.log('createProviderFromUserConfig: direct config providerConfig=', providerConfig)
      return aiProviderFactory.createProvider(providerConfig) as BaseAIProvider
    }

    console.log('createProviderFromUserConfig: No connection found for user config, returning null')
    return null
  }

  // 从默认模型创建提供者
  const createProviderFromDefaultModel = (defaultModel: AIModelRecord): BaseAIProvider | null => {
    console.log('createProviderFromDefaultModel: defaultModel=', defaultModel)
    
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
    
    console.log('createProviderFromDefaultModel: serviceType=', serviceType)
    
    // ModelScope可能不需要API密钥
    if (serviceType && (apiKey || defaultModel.provider === 'ModelScope' || defaultModel.provider === 'modelScope') && baseUrl) {
      const providerConfig = {
        aiServiceType: serviceType,
        apiKey: apiKey,
        baseUrl: baseUrl,
      }
      console.log('createProviderFromDefaultModel: providerConfig=', providerConfig)
      
      // 检查模型信息
      const modelName = raw.model || defaultModel.name;
      console.log('createProviderFromDefaultModel: modelName=', modelName);
      
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
      // 修复：应该使用config.model而不是config.name作为模型名称，但如果model为空则回退到name
      // 对于AIModelRecord，模型名称存储在raw.model中
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
      
      console.log('generateText: modelName=', modelName);
      console.log('generateText: config details=', config);
      
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
        max_tokens: request.maxTokens ?? (config as any).maxTokens ?? 2048,
      }
      
      console.log('generateText: payload=', payload);

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
    setStreaming(true)
    setError(null)
    setResponse('')

    const streamCallback: StreamCallback = {
      onData: (chunk: string) => {
        setResponse(prev => prev + chunk)
      },
      onComplete: (fullResponse: string) => {
        setResponse(fullResponse)
        setStreaming(false)
      },
      onError: (error: Error) => {
        setError(error.message)
        setStreaming(false)
      },
    }

    try {
      console.log('generateTextStream: configId=', configId)
      const provider = await getProvider(configId)
      console.log('generateTextStream: provider=', provider)
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
      
      console.log('generateTextStream: config=', config)
      if (!config) {
        throw new Error('未找到配置')
      }

      // 添加调试信息
      console.log('useLLM generateTextStream:', {
        configId: configId,
        config: config,
        request: request
      })

      // 处理LLMConfig和AIModelRecord的不同字段名
      // 修复：应该使用config.model而不是config.name作为模型名称，但如果model为空则回退到name
      // 对于AIModelRecord，模型名称存储在raw.model中
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
      
      console.log('generateTextStream: modelName=', modelName);
      console.log('generateTextStream: config details=', config);
      
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
        max_tokens: request.maxTokens ?? (config as any).maxTokens ?? 2048,
      }
      
      console.log('generateTextStream: payload=', payload);

      // 生成请求ID
      const requestId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      console.log('generateTextStream: requestId=', requestId)
      
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
        streamCallback.onData?.(data.text)
      }, requestId)
    } catch (err) {
      console.error('generateTextStream error:', err)
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