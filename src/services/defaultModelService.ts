// 默认模型服务
// 管理所有用户都可以使用的默认AI模型

import { LLMConnectionModel } from '#/llm'
import { useAIServiceStore } from '@/stores/aiServiceStore'
import { databaseManager } from './index'
import { AIModelRecord } from './aiModelStore'
import { generateUUID } from '@/utils'

// 默认模型接口
export interface DefaultModel {
  id: string
  name: string
  provider: string
  description: string
  isDefault: boolean
}

// 默认模型服务类
class DefaultModelService {
  // 缓存管理员配置的默认模型
  private cachedAdminModels: LLMConnectionModel[] | null = null
  // 缓存时间戳
  private cacheTimestamp: number = 0
  // 缓存有效期（30秒，进一步缩短缓存时间以确保及时更新）
  private readonly CACHE_TTL = 30 * 1000
  // 添加一个标志来跟踪是否正在加载
  private isLoading: boolean = false

  // 检查缓存是否有效
  private isCacheValid(): boolean {
    return this.cachedAdminModels !== null && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_TTL
  }

  // 清除缓存
  private clearCache(): void {
    this.cachedAdminModels = null
    this.cacheTimestamp = 0
  }

  // 获取管理员配置的默认模型
  // 这些模型是管理员专门设置的，供所有用户使用的默认模型
  async getAdminConfiguredDefaultModels(): Promise<LLMConnectionModel[]> {
    // 检查缓存
    if (this.isCacheValid()) {
      return this.cachedAdminModels!
    }

    // 防止并发请求
    if (this.isLoading) {
      // 如果正在加载，返回空数组而不是等待
      return []
    }

    this.isLoading = true
    try {
      // 从数据库获取管理员配置的模型
      const adminModels = await databaseManager.aiModels.getAllAIModels()
      
      // 过滤出默认模型
      const defaultModels = adminModels.filter(model => model.isDefault)
      
      // 转换为LLMConnectionModel格式
      const result = defaultModels.map(model => ({
        name: model.name,
        connectionId: model.connectionId,
        raw: model.raw
      }))

      // 更新缓存
      this.cachedAdminModels = result
      this.cacheTimestamp = Date.now()

      return result
    } catch (error) {
      console.warn('从数据库获取管理员配置的默认模型失败，使用本地存储的模型:', error)
      const { adminDefaultModels } = useAIServiceStore.getState()
      return adminDefaultModels
    } finally {
      this.isLoading = false
    }
  }
  
  // 获取默认模型列表（用于UI显示）
  async getDefaultModelList(): Promise<DefaultModel[]> {
    console.log('getDefaultModelList: Starting...');
    
    // 首先尝试通过defaultModelService获取默认模型
    const defaultModels = await this.getAdminConfiguredDefaultModels();
    console.log('getDefaultModelList: defaultModels from admin config=', defaultModels);
    
    // 转换为默认模型列表格式
    let result = [];
    
    // 如果有管理员配置的默认模型，使用这些模型
    if (defaultModels.length > 0) {
      // 获取数据库中的完整模型信息，以便获取正确的ID
      try {
        const allDBModels = await databaseManager.aiModels.getAllAIModels();
        console.log('getDefaultModelList: allDBModels=', allDBModels);
        
        // 匹配管理员配置的模型与数据库中的模型
        result = defaultModels.map((model, index) => {
          // 在数据库中查找匹配的模型
          const dbModel = allDBModels.find(dbModel => 
            dbModel.connectionId === model.connectionId || 
            dbModel.name === model.name ||
            dbModel.id === model.connectionId // 也尝试通过ID匹配
          );
          
          console.log(`getDefaultModelList: Matching model for ${model.name}:`, dbModel);
          
          return {
            id: dbModel?.id || model.connectionId || `${model.name}_${index}`,
            name: model.name,
            provider: this.getProviderFromModel(model),
            description: `默认模型: ${model.name}`,
            isDefault: true
          };
        });
      } catch (error) {
        console.error('getDefaultModelList: Error getting all DB models:', error);
        
        // 如果获取所有模型失败，回退到原来的方法
        result = defaultModels.map((model, index) => ({
          id: model.connectionId || `${model.name}_${index}`,
          name: model.name,
          provider: this.getProviderFromModel(model),
          description: `默认模型: ${model.name}`,
          isDefault: true
        }));
      }
    }
    
    console.log('getDefaultModelList: result after mapping=', result);
    
    // 如果通过defaultModelService没有获取到默认模型，尝试从数据库直接获取
    if (result.length === 0) {
      console.log('getDefaultModelList: No models from admin config, trying direct DB query');
      try {
        const dbDefaultModels = await databaseManager.aiModels.getDefaultAIModels();
        console.log('getDefaultModelList: dbDefaultModels=', dbDefaultModels);
        result = dbDefaultModels.map(model => ({
          id: model.id, // 使用数据库ID
          name: model.name,
          provider: model.provider,
          description: model.description,
          isDefault: model.isDefault
        }));
        console.log('getDefaultModelList: result after DB query=', result);
      } catch (error) {
        console.error('getDefaultModelList: Error getting default models from database:', error);
      }
    }
    
    console.log('getDefaultModelList: Final result=', result);
    return result;
  }
  
  // 检查模型是否为默认模型
  async isDefaultModel(modelId: string): Promise<boolean> {
    // 首先尝试通过管理员配置的默认模型检查
    try {
      const defaultModels = await this.getAdminConfiguredDefaultModels();
      const isAdminDefault = defaultModels.some(model => 
        model.connectionId === modelId || model.name === modelId
      );
      if (isAdminDefault) {
        return true;
      }
    } catch (error) {
      console.warn('检查管理员配置的默认模型失败:', error);
    }
    
    // 回退到数据库检查
    try {
      const dbModels = await databaseManager.aiModels.getAllAIModels();
      const dbModel = dbModels.find(model => 
        (model.id === modelId || model.connectionId === modelId || model.name === modelId) && 
        model.isDefault
      );
      return !!dbModel;
    } catch (error) {
      console.warn('检查数据库中的默认模型失败:', error);
      return false;
    }
  }
  
  // 检查是否有默认模型
  async hasDefaultModel(): Promise<boolean> {
    const defaultModels = await this.getAdminConfiguredDefaultModels()
    return defaultModels.length > 0
  }
  
  // 从模型信息中提取提供商
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
    } else if (model.name.includes('DeepSeek')) {
      return 'DeepSeek'
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
  
  // 设置管理员默认模型
  async setAdminDefaultModels(models: LLMConnectionModel[], defaultModelId?: string): Promise<void> {
    useAIServiceStore.getState().setAdminDefaultModels(models)
    
    // 只有当有模型时才执行数据库操作
    if (models.length === 0) {
      console.log('没有模型需要保存到数据库');
      return;
    }
    
    // 同时保存到数据库
    try {
      console.log('开始保存管理员默认模型到数据库...');
      console.log('接收到的模型数据:', models);
      console.log('默认模型ID:', defaultModelId);
      
      // 保存新的模型配置（不删除现有模型，而是添加或更新）
      console.log(`准备保存/更新 ${models.length} 个模型...`);
      for (const model of models) {
        const isDefault = defaultModelId ? model.connectionId === defaultModelId : false
        const modelRecord: Omit<AIModelRecord, 'id' | 'createdAt' | 'updatedAt'> = {
          name: model.name,
          provider: this.getProviderFromModel(model),
          connectionId: model.connectionId || generateUUID(), // 确保有connectionId
          description: `管理员配置的模型: ${model.name}`,
          isDefault: isDefault,
          raw: model.raw || {}
        }
        
        console.log(`正在保存/更新模型: ${model.name}`, modelRecord);
        try {
          // 检查模型是否已存在
          const existingModels = await databaseManager.aiModels.getAllAIModels()
          const existingModel = existingModels.find(m => m.connectionId === model.connectionId)
          
          if (existingModel) {
            // 更新现有模型
            const updatedModel = { ...existingModel, ...modelRecord, updatedAt: new Date().toISOString() }
            await databaseManager.aiModels.updateAIModel(updatedModel)
            console.log(`模型更新成功:`, updatedModel);
          } else {
            // 添加新模型
            const savedModel = await databaseManager.aiModels.addAIModel(modelRecord)
            console.log(`模型添加成功:`, savedModel);
          }
        } catch (saveError) {
          console.error(`保存/更新模型 ${model.name} 失败:`, saveError);
        }
      }

      // 清除缓存以强制重新加载
      this.clearCache()
      console.log('管理员默认模型保存完成');
    } catch (error) {
      console.error('保存管理员默认模型到数据库失败:', error)
      throw new Error(`保存管理员默认模型到数据库失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 添加管理员默认模型（仅保存到数据库）
  async addAdminDefaultModel(model: LLMConnectionModel): Promise<void> {
    // 仅保存到数据库
    try {
      const modelRecord: Omit<AIModelRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        name: model.name,
        provider: this.getProviderFromModel(model),
        connectionId: model.connectionId || generateUUID(), // 确保有connectionId
        description: `管理员配置的模型: ${model.name}`,
        isDefault: false, // 新添加的模型默认不是默认模型
        raw: model.raw || {}
      }
      
      console.log(`正在添加模型到数据库: ${model.name}`, modelRecord);
      
      // 检查模型是否已存在
      const existingModels = await databaseManager.aiModels.getAllAIModels()
      const existingModel = existingModels.find(m => m.connectionId === model.connectionId)
      
      if (existingModel) {
        // 更新现有模型
        const updatedModel = { ...existingModel, ...modelRecord, updatedAt: new Date().toISOString() }
        await databaseManager.aiModels.updateAIModel(updatedModel)
        console.log(`模型更新成功:`, updatedModel);
      } else {
        // 添加新模型
        const savedModel = await databaseManager.aiModels.addAIModel(modelRecord)
        console.log(`模型添加成功:`, savedModel);
      }
    } catch (error) {
      console.error(`添加模型到数据库失败:`, error);
      throw error; // 重新抛出错误
    }
    
    // 清除缓存以强制重新加载
    this.clearCache()
  }
  
  // 移除管理员默认模型
  async removeAdminDefaultModel(modelId: string): Promise<boolean> {
    const result = useAIServiceStore.getState().removeAdminDefaultModel(modelId)
    // 清除缓存以强制重新加载
    this.clearCache()
    return result
  }
  
  // 初始化管理员默认模型
  async initializeAdminDefaultModels(): Promise<void> {
    try {
      console.log('开始初始化管理员配置的默认模型...')
      
      // 从数据库获取管理员配置的模型
      const adminModels = await databaseManager.aiModels.getAllAIModels()
      
      if (adminModels.length > 0) {
        console.log(`从数据库加载了 ${adminModels.length} 个管理员配置的模型`)
        
        // 转换为LLMConnectionModel格式
        const llmModels = adminModels.map(model => ({
          name: model.name,
          connectionId: model.connectionId,
          raw: model.raw
        }))
        
        // 设置管理员默认模型到store中
        useAIServiceStore.getState().setAdminDefaultModels(llmModels)
        console.log('已将管理员配置的模型设置为默认模型')
      } else {
        console.log('数据库中没有管理员配置的模型')
      }
    } catch (error) {
      console.error('初始化管理员配置的默认模型失败:', error)
      // 即使数据库初始化失败，也要确保store中有默认模型
      const { adminDefaultModels } = useAIServiceStore.getState();
      if (adminDefaultModels.length > 0) {
        console.log('使用store中的默认模型');
      } else {
        console.log('没有可用的默认模型');
      }
    }
  }
}

// 导出默认模型服务实例
export const defaultModelService = new DefaultModelService()