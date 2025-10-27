// 检查模型同步的脚本
import { databaseManager } from '@/services/index';
import { defaultModelService } from '@/services/defaultModelService';
import { useAIServiceStore } from '@/stores/aiServiceStore';

async function checkModelSync() {
  console.log('开始检查模型同步...');
  
  try {
    // 检查数据库中的模型
    const indexDBModels = await databaseManager.aiModels.getAllAIModels();
    console.log('数据库中的模型:', indexDBModels);
    
    // 检查默认模型服务中的模型
    const defaultModels = await defaultModelService.getAdminConfiguredDefaultModels();
    console.log('默认模型服务中的模型:', defaultModels);
    
    // 检查AI服务存储中的管理员默认模型
    const { adminDefaultModels } = useAIServiceStore.getState();
    console.log('AI服务存储中的管理员默认模型:', adminDefaultModels);
    
    console.log('检查完成');
  } catch (error) {
    console.error('检查过程中出错:', error);
  }
}

// 运行检查
checkModelSync();