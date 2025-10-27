// 验证修复的脚本
import { databaseManager, initializeDatabase } from '@/services/index';
import { defaultModelService } from '@/services/defaultModelService';

async function verifyFix() {
  console.log('开始验证修复...');
  
  try {
    // 初始化数据库
    await initializeDatabase();
    console.log('数据库初始化完成');
    
    // 初始化管理员默认模型
    await defaultModelService.initializeAdminDefaultModels();
    console.log('管理员默认模型初始化完成');
    
    // 检查是否有默认模型
    const hasDefaultModel = await defaultModelService.hasDefaultModel();
    console.log('是否有默认模型:', hasDefaultModel);
    
    if (hasDefaultModel) {
      // 获取默认模型列表
      const defaultModels = await defaultModelService.getDefaultModelList();
      console.log('默认模型列表:', defaultModels);
    } else {
      console.log('没有默认模型，请确保管理员已保存默认模型');
    }
    
    console.log('验证完成');
  } catch (error) {
    console.error('验证过程中出错:', error);
  }
}

verifyFix();