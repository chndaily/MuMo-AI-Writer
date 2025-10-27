import { BaseStore } from './baseStore'
import { LLMConnectionModel } from '#/llm'
import { MongodbStorageService } from './mongodbStorageService'

/**
 * AI模型存储模块
 * 用于存储管理员配置的默认AI模型
 */
export interface AIModelRecord {
  id: string
  name: string
  provider: string
  connectionId: string
  description: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
  raw: any
}

export class AIModelStore extends BaseStore<AIModelRecord> {
  private mongodbStorageService: MongodbStorageService

  constructor(db: IDBDatabase | null) {
    super(db, 'aiModels')
    this.mongodbStorageService = new MongodbStorageService()
  }

  /**
   * 添加AI模型
   */
  async addModel(model: Omit<AIModelRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModelRecord> {
    const modelRecord: AIModelRecord = {
      ...model,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await this.add(modelRecord)
    
    // 同步到MongoDB
    try {
      console.log('正在同步AI模型到MongoDB:', modelRecord.name);
      await this.mongodbStorageService.addAIModel(model)
      console.log('AI模型同步到MongoDB成功:', modelRecord.name);
    } catch (error) {
      console.error('同步AI模型到MongoDB失败:', error)
      throw new Error(`同步AI模型到MongoDB失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
    
    return modelRecord
  }

  /**
   * 更新AI模型
   */
  async updateModel(model: AIModelRecord): Promise<void> {
    const updatedModel = {
      ...model,
      updatedAt: new Date().toISOString()
    }
    
    await this.update(updatedModel)
    
    // 同步到MongoDB
    try {
      console.log('正在同步AI模型更新到MongoDB:', model.name);
      await this.mongodbStorageService.updateAIModel(updatedModel)
      console.log('AI模型更新同步到MongoDB成功:', model.name);
    } catch (error) {
      console.warn('同步AI模型更新到MongoDB失败:', error)
    }
  }

  /**
   * 删除AI模型
   */
  async deleteModel(id: string): Promise<void> {
    await this.delete(id)
    
    // 同步到MongoDB
    try {
      console.log('正在同步AI模型删除到MongoDB:', id);
      await this.mongodbStorageService.deleteAIModel(id)
      console.log('AI模型删除同步到MongoDB成功:', id);
    } catch (error) {
      console.warn('同步AI模型删除到MongoDB失败:', error)
    }
  }

  /**
   * 根据ID获取AI模型
   */
  async getModelById(id: string): Promise<AIModelRecord | undefined> {
    return await this.get(id)
  }

  /**
   * 获取所有AI模型
   */
  async getAllModels(): Promise<AIModelRecord[]> {
    return await this.getAll()
  }

  /**
   * 获取默认AI模型
   */
  async getDefaultModels(): Promise<AIModelRecord[]> {
    return await this.getByIndex('isDefault', true)
  }

  /**
   * 设置模型为默认模型
   */
  async setDefaultModel(id: string): Promise<void> {
    const model = await this.getModelById(id)
    if (model) {
      await this.updateModel({
        ...model,
        isDefault: true
      })
    }
  }

  /**
   * 取消模型的默认设置
   */
  async unsetDefaultModel(id: string): Promise<void> {
    const model = await this.getModelById(id)
    if (model) {
      await this.updateModel({
        ...model,
        isDefault: false
      })
    }
  }

  /**
   * 从LLMConnectionModel转换为AIModelRecord
   */
  convertFromLLMModel(llmModel: LLMConnectionModel, provider: string, isDefault: boolean = false): Omit<AIModelRecord, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: llmModel.name,
      provider: provider,
      connectionId: llmModel.connectionId,
      description: `默认模型: ${llmModel.name}`,
      isDefault: isDefault,
      raw: llmModel.raw || {}
    }
  }

  /**
   * 从AIModelRecord转换为LLMConnectionModel
   */
  convertToLLMModel(modelRecord: AIModelRecord): LLMConnectionModel {
    return {
      name: modelRecord.name,
      connectionId: modelRecord.connectionId,
      raw: modelRecord.raw
    }
  }
}