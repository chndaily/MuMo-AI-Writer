import { databaseManager } from './index'
import { AIModelRecord } from './aiModelStore'
import { LLMConnectionModel } from '#/llm'
import { apiService } from './apiService'

/**
 * 管理员AI模型服务
 * 用于管理管理员配置的AI模型，并同步给所有用户
 */
class AdminAIModelService {
  /**
   * 保存管理员配置的AI模型到数据库
   * @param models 管理员配置的AI模型列表
   * @param defaultModelId 默认模型ID
   */
  async saveAdminModels(models: LLMConnectionModel[], defaultModelId: string | null): Promise<void> {
    try {
      console.log('开始保存管理员配置的AI模型到数据库')
      
      // 清空现有的AI模型记录
      const existingModels = await databaseManager.aiModels.getAllAIModels()
      for (const model of existingModels) {
        await databaseManager.aiModels.deleteAIModel(model.id)
      }
      
      // 保存新的模型配置
      for (const model of models) {
        const isDefault = model.connectionId === defaultModelId
        const modelRecord: Omit<AIModelRecord, 'id' | 'createdAt' | 'updatedAt'> = {
          name: model.name,
          provider: this.getProviderFromModel(model),
          connectionId: model.connectionId,
          description: `管理员配置的模型: ${model.name}`,
          isDefault: isDefault,
          raw: model.raw || {}
        }
        
        await databaseManager.aiModels.addAIModel(modelRecord)
        console.log(`已保存模型: ${model.name}, 是否默认: ${isDefault}`)
      }
      
      console.log('管理员配置的AI模型保存完成')
    } catch (error) {
      console.error('保存管理员配置的AI模型失败:', error)
      throw error
    }
  }
  
  /**
   * 从模型信息中提取提供商
   * @param model 模型信息
   */
  private getProviderFromModel(model: LLMConnectionModel): string {
    // 从模型名称或原始数据中提取提供商信息
    if (model.name.includes('OpenAI') || model.name.includes('GPT')) {
      return 'OpenAI'
    } else if (model.name.includes('Anthropic') || model.name.includes('Claude')) {
      return 'Anthropic'
    } else if (model.name.includes('Google') || model.name.includes('Gemini')) {
      return 'Google'
    } else if (model.name.includes('Moonshot')) {
      return 'Moonshot'
    } else {
      // 从原始数据中尝试提取提供商
      if (model.raw && typeof model.raw === 'object') {
        if ('provider' in model.raw) {
          return model.raw.provider as string
        }
      }
      return 'Unknown'
    }
  }
  
  /**
   * 获取所有管理员配置的AI模型
   */
  async getAdminModels(): Promise<AIModelRecord[]> {
    try {
      return await databaseManager.aiModels.getAllAIModels()
    } catch (error) {
      console.error('获取管理员配置的AI模型失败:', error)
      return []
    }
  }
  
  /**
   * 获取默认的AI模型
   */
  async getDefaultModels(): Promise<AIModelRecord[]> {
    try {
      return await databaseManager.aiModels.getDefaultAIModels()
    } catch (error) {
      console.error('获取默认AI模型失败:', error)
      return []
    }
  }
  
  /**
   * 设置模型为默认模型
   * @param modelId 模型ID
   */
  async setDefaultModel(modelId: string): Promise<void> {
    try {
      // 使用后端API设置默认模型，确保默认模型的唯一性
      await apiService.aiModels.setDefaultAIModel(modelId);
      console.log(`已设置模型 ${modelId} 为默认模型`);
    } catch (error) {
      console.error('设置默认模型失败:', error)
      throw error
    }
  }
}

// 导出管理员AI模型服务实例
export const adminAIModelService = new AdminAIModelService()