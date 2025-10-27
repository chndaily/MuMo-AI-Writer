// 自定义hook用于处理模型选择逻辑，包括默认模型和会员权限控制
import { useState, useEffect, useCallback } from 'react'
import { useAIServiceStore } from '@/stores/aiServiceStore'
import { defaultModelService } from '@/services/defaultModelService'
import { useMembership } from '@/hooks/useMembership'
import { LLMConfig, LLMProvider } from '#/llm'

// 用于UI显示的模型接口
interface DisplayModel {
  id: string
  name: string
  model?: string
  isDefault?: boolean
  provider?: LLMProvider | string
}

export const useModelSelection = () => {
  const { configs } = useAIServiceStore()
  const { membershipInfo } = useMembership()
  const [availableModels, setAvailableModels] = useState<DisplayModel[]>([])
  const [loading, setLoading] = useState(false)
  
  // 获取所有可用模型（根据会员等级过滤）
  const getAllAvailableModels = useCallback(async (): Promise<DisplayModel[]> => {
    console.log('getAllAvailableModels: Starting...');
    
    // 获取默认模型列表（仅管理员配置的默认模型）
    const defaultModelList = await defaultModelService.getDefaultModelList()
    console.log('getAllAvailableModels: defaultModelList=', defaultModelList);
    
    // 转换默认模型为显示格式
    const defaultConfigs: DisplayModel[] = defaultModelList.map(model => ({
      id: model.id,
      name: `${model.name} (默认)`,
      provider: model.provider as LLMProvider,
      model: model.name,
      isDefault: true
    }))
    
    console.log('getAllAvailableModels: defaultConfigs=', defaultConfigs);
    
    // 所有会员（包括专业会员）只能使用默认模型
    console.log('getAllAvailableModels: all users, default models only=', defaultConfigs);
    return defaultConfigs;
  }, [configs, membershipInfo.level])
  
  // 检查模型是否为默认模型
  const isDefaultModel = useCallback(async (modelId: string): Promise<boolean> => {
    return await defaultModelService.isDefaultModel(modelId)
  }, [])
  
  // 获取模型详情
  const getModelDetails = useCallback(async (modelId: string) => {
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
    const defaultModels = await defaultModelService.getDefaultModelList()
    console.log('getModelDetails: defaultModels=', defaultModels);
    const defaultModel = defaultModels.find(model => model.id === modelId)
    if (defaultModel) {
      console.log('getModelDetails: Found default model', defaultModel);
      return {
        id: defaultModel.id,
        name: defaultModel.name,
        provider: defaultModel.provider,
        model: defaultModel.name,
        isDefault: true
      }
    }
    
    console.log('getModelDetails: No model found');
    return null
  }, [configs])
  
  // 获取可用模型列表
  const fetchAvailableModels = useCallback(async () => {
    setLoading(true)
    try {
      const models = await getAllAvailableModels()
      setAvailableModels(models)
    } catch (error) {
      console.error('获取可用模型失败:', error)
    } finally {
      setLoading(false)
    }
  }, [getAllAvailableModels])
  
  // 当会员等级或配置变化时重新获取模型
  useEffect(() => {
    fetchAvailableModels()
  }, [fetchAvailableModels])
  
  return {
    getAllAvailableModels,
    isDefaultModel,
    getModelDetails,
    availableModels,
    loading,
    fetchAvailableModels
  }
}