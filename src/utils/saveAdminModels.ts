// 保存管理员配置的模型到数据库
import { defaultModelService } from '@/services/defaultModelService';
import { databaseManager } from '@/services/index';
import { useAIServiceStore } from '@/stores/aiServiceStore';

async function saveAdminConfiguredModels() {
  try {
    console.log('开始保存管理员配置的模型到数据库...');
    
    // 从store中获取当前的连接模型
    const { connectionModels } = useAIServiceStore.getState();
    
    // 获取所有可用模型（从connectionModels中获取实际可用的模型）
    const allModels = Object.values(connectionModels).flat();
    console.log('从connectionModels获取的模型:', allModels);
    
    // 获取当前默认配置ID
    const currentDefaultConfig = useAIServiceStore.getState().getDefaultConfig();
    const defaultModelId = currentDefaultConfig?.id || null;
    console.log('当前默认配置ID:', defaultModelId);
    
    // 保存到数据库
    console.log('正在保存模型到数据库...');
    await defaultModelService.setAdminDefaultModels(allModels, defaultModelId);
    
    console.log('模型保存完成');
    
    // 验证保存结果
    console.log('正在验证保存结果...');
    const savedModels = await databaseManager.aiModels.getAllAIModels();
    console.log('数据库中的模型:', savedModels);
    
    return savedModels;
  } catch (error) {
    console.error('保存管理员配置的模型到数据库时出错:', error);
    throw error;
  }
}

// 执行保存
saveAdminConfiguredModels()
  .then(result => {
    console.log('保存完成，共保存了', result.length, '个模型');
  })
  .catch(error => {
    console.error('保存失败:', error);
  });

export default saveAdminConfiguredModels;