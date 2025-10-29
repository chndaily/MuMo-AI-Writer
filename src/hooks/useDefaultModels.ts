// 自定义hook用于处理默认模型
import { useEffect, useState } from 'react'
import { useAIServiceStore } from '@/stores/aiServiceStore'
import { defaultModelService, DefaultModel } from '@/services/defaultModelService'
import { databaseManager } from '@/services/index'
import { LLMConfig, LLMProvider } from '#/llm'

// 用于UI显示的模型接口
interface DisplayModel {
  id: string
  name: string
  model?: string
  isDefault?: boolean
  provider?: LLMProvider | string
}

export const useDefaultModels = () => {
  const { configs } = useAIServiceStore()
  const [defaultModels, setDefaultModels] = useState<DefaultModel[]>([])
  const [modelsLoaded, setModelsLoaded] = useState(false) // 添加状态跟踪模型是否已加载
  
  // 获取所有可用模型（用户配置+默认模型）
  const getAllAvailableModels = async (): Promise<DisplayModel[]> => {
    // 如果模型已经加载过且有缓存，直接返回缓存的结果
    if (modelsLoaded && defaultModels.length > 0) {
      // 转换默认模型为显示格式
      const defaultConfigs: DisplayModel[] = defaultModels.map(model => ({
        id: model.id,
        name: `${model.name} (默认)`,
        provider: model.provider as LLMProvider,
        model: model.name,
        isDefault: true
      }))
      return defaultConfigs;
    }
    
    console.log('getAllAvailableModels: Starting...');
    
    // 获取默认模型列表
    const defaultModelList = await defaultModelService.getDefaultModelList()
    console.log('getAllAvailableModels: defaultModelList=', defaultModelList);
    
    // 转换默认模型为显示格式
    let defaultConfigs: DisplayModel[] = defaultModelList.map(model => ({
      id: model.id,
      name: `${model.name} (默认)`,
      provider: model.provider as LLMProvider,
      model: model.name,
      isDefault: true
    }))
    
    console.log('getAllAvailableModels: defaultConfigs after mapping=', defaultConfigs);
    
    // 如果通过defaultModelService没有获取到默认模型，尝试从数据库直接获取
    if (defaultConfigs.length === 0) {
      console.log('getAllAvailableModels: No default configs, trying direct DB query');
      try {
        const dbDefaultModels = await databaseManager.aiModels.getDefaultAIModels()
        console.log('getAllAvailableModels: dbDefaultModels=', dbDefaultModels);
        defaultConfigs = dbDefaultModels.map(model => ({
          id: model.id, // 使用数据库ID
          name: `${model.name} (默认)`,
          provider: model.provider as LLMProvider,
          model: model.name,
          isDefault: true
        }))
        console.log('getAllAvailableModels: defaultConfigs after DB query=', defaultConfigs);
      } catch (error) {
        console.error('getAllAvailableModels: Error getting default models from database:', error)
      }
    }
    
    // 只返回默认模型，不包含用户自定义模型
    console.log('getAllAvailableModels: Final result (only default models)=', defaultConfigs);
    return defaultConfigs;
  }
  
  // 检查模型是否为默认模型
  const isDefaultModel = async (modelId: string): Promise<boolean> => {
    return await defaultModelService.isDefaultModel(modelId)
  }
  
  // 获取模型详情
  const getModelDetails = async (modelId: string) => {
    console.log('getModelDetails: modelId=', modelId);
    
    // 先检查是否为用户配置的模型
    const userConfig = configs.find(config => config.id === modelId)
    if (userConfig) {
      console.log('getModelDetails: Found user config', userConfig);
      return {
        ...userConfig,
        isDefault: false
      }
    }
    
    // 再检查是否为默认模型
    // 首先通过defaultModelService获取默认模型列表
    const defaultModelList = await defaultModelService.getDefaultModelList()
    console.log('getModelDetails: defaultModelList=', defaultModelList);
    let defaultModel = defaultModelList.find(model => model.id === modelId)
    
    // 如果没找到，尝试通过数据库直接获取模型
    if (!defaultModel) {
      console.log('getModelDetails: Not found in defaultModelList, trying DB query');
      try {
        const dbModel = await databaseManager.aiModels.getAIModel(modelId)
        console.log('getModelDetails: dbModel=', dbModel);
        if (dbModel && dbModel.isDefault) {
          // 从数据库模型转换为显示格式
          defaultModel = {
            id: dbModel.id, // 使用数据库ID而不是connectionId
            name: dbModel.name,
            provider: dbModel.provider,
            description: dbModel.description,
            isDefault: dbModel.isDefault
          }
        }
      } catch (error) {
        console.error('getModelDetails: Error getting model from database:', error)
      }
    }
    
    // 如果仍然没找到，尝试通过name字段查找
    if (!defaultModel) {
      console.log('getModelDetails: Not found by ID, trying name search');
      try {
        const allModels = await databaseManager.aiModels.getAllAIModels();
        console.log('getModelDetails: allModels=', allModels);
        const modelByName = allModels.find(model => model.name === modelId);
        console.log('getModelDetails: modelByName=', modelByName);
        
        if (modelByName) {
          defaultModel = {
            id: modelByName.id,
            name: modelByName.name,
            provider: modelByName.provider,
            description: modelByName.description,
            isDefault: modelByName.isDefault
          };
        }
      } catch (error) {
        console.error('getModelDetails: Error getting all models:', error);
      }
    }
    
    if (defaultModel) {
      console.log('getModelDetails: Found default model', defaultModel);
      return {
        id: defaultModel.id,
        name: defaultModel.name,
        provider: defaultModel.provider as LLMProvider,
        model: defaultModel.name,
        isDefault: true
      }
    }
    
    console.log('getModelDetails: No model found');
    return null
  }
  
  // 初始化默认模型
  useEffect(() => {
    // 只在组件首次加载时获取一次默认模型
    if (!modelsLoaded) {
      const fetchDefaultModels = async () => {
        try {
          const models = await defaultModelService.getDefaultModelList()
          setDefaultModels(models)
          setModelsLoaded(true) // 标记模型已加载
        } catch (error) {
          console.error('获取默认模型失败:', error)
          setModelsLoaded(true) // 即使失败也标记为已加载，避免无限重试
        }
      }
      
      fetchDefaultModels()
    }
  }, [modelsLoaded]) // 依赖modelsLoaded状态
  
  return {
    getAllAvailableModels,
    isDefaultModel,
    getModelDetails,
    defaultModels
  }
}