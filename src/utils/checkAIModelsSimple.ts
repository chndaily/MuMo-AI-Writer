// 简单的AI模型检查脚本
import { databaseManager } from '../services/index';

async function checkAIModels() {
  try {
    console.log('开始检查AI模型数据...');
    
    // 初始化数据库
    console.log('数据库初始化完成');
    
    // 获取所有AI模型
    const allModels = await databaseManager.aiModels.getAllAIModels();
    console.log('所有AI模型:', JSON.stringify(allModels, null, 2));
    
    // 获取默认AI模型
    const defaultModels = await databaseManager.aiModels.getDefaultAIModels();
    console.log('默认AI模型:', JSON.stringify(defaultModels, null, 2));
    
    console.log('AI模型数据检查完成');
  } catch (error) {
    console.error('检查AI模型数据时出错:', error);
  }
}

// 运行检查
checkAIModels();