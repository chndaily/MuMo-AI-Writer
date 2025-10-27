import { LLMProvider } from '#/llm'
import { AIServiceType } from '@/ai'

/**
 * 将 LLMProvider 映射到对应的 AIServiceType
 * @param provider LLMProvider 枚举值
 * @returns 对应的 AIServiceType 枚举值或 undefined
 */
export function mapLLMProviderToAIServiceType(provider: LLMProvider): AIServiceType | undefined {
  switch(provider) {
    case LLMProvider.OPENAI:
      return AIServiceType.OpenAI
    case LLMProvider.ANTHROPIC:
      return AIServiceType.OpenRouter // Anthropic 通过 OpenRouter 访问
    case LLMProvider.GOOGLE:
      return AIServiceType.OpenRouter // Google 通过 OpenRouter 访问
    case LLMProvider.AZURE:
      return AIServiceType.OpenAI // Azure OpenAI 兼容 OpenAI API
    case LLMProvider.DEEPSEEK:
      return AIServiceType.DeepSeek
    case LLMProvider.MODELSCOPE:
      return AIServiceType.ModelScope // ModelScope API
    case LLMProvider.LOCAL:
      return AIServiceType.Ollama // 本地模型使用 Ollama
    default:
      return undefined
  }
}

/**
 * 将 AIServiceType 映射到对应的 LLMProvider
 * @param serviceType AIServiceType 枚举值
 * @returns 对应的 LLMProvider 枚举值或 undefined
 */
export function mapAIServiceTypeToLLMProvider(serviceType: AIServiceType): LLMProvider | undefined {
  switch(serviceType) {
    case AIServiceType.OpenAI:
      return LLMProvider.OPENAI
    case AIServiceType.DeepSeek:
      return LLMProvider.DEEPSEEK
    case AIServiceType.ModelScope:
      return LLMProvider.MODELSCOPE
    case AIServiceType.Ollama:
      return LLMProvider.LOCAL
    case AIServiceType.OpenRouter:
      return LLMProvider.OPENAI // OpenRouter 可以访问多种模型，这里默认映射为 OPENAI
    default:
      return undefined
  }
}