// 测试MongoDB同步的脚本
import { databaseManager, initializeDatabase } from '@/services/index';
import { defaultModelService } from '@/services/defaultModelService';

async function testMongoDBSync() {
  console.log('开始测试MongoDB同步...');
  
  try {
    // 获取所有AI模型
    const models = await databaseManager.aiModels.getAllAIModels();
    console.log('数据库中的AI模型:', models);
    
    // 初始化管理员默认模型
    await defaultModelService.initializeAdminDefaultModels();
    console.log('管理员默认模型初始化完成');
    
    console.log('测试完成');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

testMongoDBSync();