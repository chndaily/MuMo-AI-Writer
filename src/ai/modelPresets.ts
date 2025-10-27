import { LLMProvider } from '#/llm'

// 模型预设配置
export const MODEL_PRESETS: Record<LLMProvider, Record<string, any>> = {
  [LLMProvider.OPENAI]: {
    'gpt-4': {
      description: 'OpenAI最新旗舰模型，适用于复杂任务',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'gpt-4-turbo': {
      description: 'OpenAI高性能模型，速度快且功能强大',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'gpt-3.5-turbo': {
      description: 'OpenAI平衡性能和成本的模型',
      temperature: 0.7,
      maxTokens: 16385,
    },
    'gpt-4o': {
      description: 'OpenAI多模态模型，支持文本和图像输入',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'gpt-4o-mini': {
      description: 'OpenAI小型高效模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
  },
  [LLMProvider.ANTHROPIC]: {
    'claude-3-5-sonnet-20240620': {
      description: 'Anthropic最新旗舰模型，智能和安全的平衡',
      temperature: 0.7,
      maxTokens: 200000,
    },
    'claude-3-opus-20240229': {
      description: 'Anthropic最高智能模型，适用于复杂推理',
      temperature: 0.7,
      maxTokens: 200000,
    },
    'claude-3-sonnet-20240229': {
      description: 'Anthropic平衡智能和速度的模型',
      temperature: 0.7,
      maxTokens: 200000,
    },
    'claude-3-haiku-20240307': {
      description: 'Anthropic最快且最紧凑的模型',
      temperature: 0.7,
      maxTokens: 200000,
    },
  },
  [LLMProvider.GOOGLE]: {
    'gemini-1.5-pro': {
      description: 'Google最新多模态模型，支持长上下文',
      temperature: 0.7,
      maxTokens: 2097152,
    },
    'gemini-1.5-flash': {
      description: 'Google快速且高效的多模态模型',
      temperature: 0.7,
      maxTokens: 1048576,
    },
    'gemini-1.0-pro': {
      description: 'Google上一代旗舰模型',
      temperature: 0.7,
      maxTokens: 32768,
    },
  },
  [LLMProvider.AZURE]: {
    'gpt-4': {
      description: 'Azure OpenAI服务的GPT-4模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'gpt-35-turbo': {
      description: 'Azure OpenAI服务的GPT-3.5 Turbo模型',
      temperature: 0.7,
      maxTokens: 16385,
    },
    'gpt-4o': {
      description: 'Azure OpenAI服务的GPT-4o模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
  },
  [LLMProvider.DEEPSEEK]: {
    'deepseek-chat': {
      description: 'DeepSeek对话模型，适用于通用对话',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'deepseek-coder': {
      description: 'DeepSeek代码模型，适用于编程任务',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'deepseek-ai/DeepSeek-V3': {
      description: 'DeepSeek最新旗舰模型，适用于复杂任务',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'deepseek-ai/DeepSeek-V3.1': {
      description: 'DeepSeek V3.1模型，适用于复杂任务',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'deepseek-ai/DeepSeek-V2.5': {
      description: 'DeepSeek V2.5模型，适用于复杂任务',
      temperature: 0.7,
      maxTokens: 128000,
    },
  },
  [LLMProvider.MODELSCOPE]: {
    'LLM-Research/Llama-4-Maverick-17B-128E-Instruct': {
      description: '高性能大语言模型',
      temperature: 0.8,
      maxTokens: 32768,
    },
    'deepseek-ai/DeepSeek-V3.1': {
      description: 'DeepSeek最新旗舰模型，适用于复杂任务',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'Qwen/Qwen3-72B-Instruct': {
      description: '通义千问Qwen3系列的72B参数大语言模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'Qwen/Qwen3-7B-Instruct': {
      description: '通义千问Qwen3系列的7B参数大语言模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'Qwen/Qwen2-72B-Instruct': {
      description: '通义千问Qwen2系列的72B参数大语言模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'Qwen/Qwen2-7B-Instruct': {
      description: '通义千问Qwen2系列的7B参数大语言模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'Qwen/Qwen2-1.5B-Instruct': {
      description: '通义千问Qwen2系列的1.5B参数大语言模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'Qwen/Qwen2-0.5B-Instruct': {
      description: '通义千问Qwen2系列的0.5B参数大语言模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'Qwen/Qwen1.5-110B-Chat': {
      description: '通义千问Qwen1.5系列的110B参数大语言模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'baichuan-inc/Baichuan3-7B-Chat': {
      description: '百川智能Baichuan3系列的7B参数大语言模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'baichuan-inc/Baichuan3-13B-Chat': {
      description: '百川智能Baichuan3系列的13B参数大语言模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
  },
  [LLMProvider.LOCAL]: {
    'llama3': {
      description: '本地运行的Llama3模型',
      temperature: 0.7,
      maxTokens: 8192,
    },
    'llama3.1': {
      description: '本地运行的Llama3.1模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'mistral': {
      description: '本地运行的Mistral模型',
      temperature: 0.7,
      maxTokens: 32768,
    },
    'phi-3': {
      description: '本地运行的Phi-3模型',
      temperature: 0.7,
      maxTokens: 128000,
    },
    'gemma2': {
      description: '本地运行的Gemma2模型',
      temperature: 0.7,
      maxTokens: 8192,
    },
  }
}

// 缓存的动态模型列表
let dynamicModels: Record<LLMProvider, Record<string, any>> = {
  [LLMProvider.OPENAI]: {},
  [LLMProvider.ANTHROPIC]: {},
  [LLMProvider.GOOGLE]: {},
  [LLMProvider.AZURE]: {},
  [LLMProvider.DEEPSEEK]: {},
  [LLMProvider.MODELSCOPE]: {},
  [LLMProvider.LOCAL]: {},
}

// 获取所有模型（包括预设和动态获取的模型）
export function getAllModels(): Record<LLMProvider, Record<string, any>> {
  const allModels: Record<LLMProvider, Record<string, any>> = { ...MODEL_PRESETS }
  
  // 合并动态获取的模型
  for (const provider in dynamicModels) {
    const providerKey = provider as LLMProvider
    if (allModels[providerKey]) {
      allModels[providerKey] = { ...allModels[providerKey], ...dynamicModels[providerKey] }
    } else {
      allModels[providerKey] = { ...dynamicModels[providerKey] }
    }
  }
  
  return allModels
}

// 更新动态模型列表
export function updateDynamicModels(provider: LLMProvider, models: Record<string, any>): void {
  dynamicModels[provider] = { ...models }
}

// 获取特定提供商的模型列表
export function getModelsByProvider(provider: LLMProvider): Record<string, any> {
  const allModels = getAllModels()
  return allModels[provider] || {}
}

// 检查模型是否存在
export function isModelExists(provider: LLMProvider, modelName: string): boolean {
  const models = getModelsByProvider(provider)
  return !!models[modelName]
}

// 获取模型信息
export function getModelInfo(provider: LLMProvider, modelName: string): any {
  const models = getModelsByProvider(provider)
  return models[modelName] || null
}