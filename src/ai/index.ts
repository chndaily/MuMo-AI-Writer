// 导出所有AI相关接口和类
export * from './IAIProvider'
export * from './AIProviderFactory'
export * from './providers/DeepSeekProvider'

// 导出工厂实例
export { aiProviderFactory } from './AIProviderFactory'

// 导出示例函数
export { setupAIGlobalCallbacks, exampleUsage, useAIProvider } from './example'