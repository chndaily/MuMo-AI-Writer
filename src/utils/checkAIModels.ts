// 检查AI模型数据的工具脚本
import { databaseManager } from '../services/index';

// 检查数据库中的AI模型数据
async function checkAIModels() {
  try {
    console.log('开始检查数据库中的AI模型数据...');
    
    // 确保数据库已初始化
    if (!databaseManager['isInitialized']) {
      console.log('数据库未初始化，正在初始化...');
      // 数据库初始化逻辑
    }
    
    // 获取所有AI模型
    const allModels = await databaseManager.aiModels.getAllAIModels();
    console.log('所有AI模型:', allModels);
    
    // 获取默认AI模型
    const defaultModels = await databaseManager.aiModels.getDefaultAIModels();
    console.log('默认AI模型:', defaultModels);
    
    console.log('AI模型数据检查完成');
  } catch (error) {
    console.error('检查AI模型数据时出错:', error);
  }
}

// 运行检查
checkAIModels();