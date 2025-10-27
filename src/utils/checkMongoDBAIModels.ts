// 检查MongoDB中的AI模型数据
import { apiService } from '@/services/apiService';

async function checkMongoDBAIModels() {
  try {
    console.log('开始检查MongoDB中的AI模型数据...');
    
    // 获取所有AI模型
    console.log('正在获取所有AI模型...');
    const allModels = await apiService.aiModels.getAllAIModels();
    console.log('所有AI模型:', allModels);
    
    // 获取默认AI模型
    console.log('正在获取默认AI模型...');
    const defaultModels = await apiService.aiModels.getDefaultAIModels();
    console.log('默认AI模型:', defaultModels);
    
    if (allModels.length > 0) {
      console.log(`\nMongoDB中总共找到 ${allModels.length} 个AI模型:`);
      allModels.forEach((model: any, index: number) => {
        console.log(`${index + 1}. ID: ${model.id || model._id}`);
        console.log(`   名称: ${model.name}`);
        console.log(`   提供商: ${model.provider}`);
        console.log(`   连接ID: ${model.connectionId}`);
        console.log(`   描述: ${model.description}`);
        console.log(`   是否默认: ${model.isDefault}`);
        console.log(`   创建时间: ${model.createdAt}`);
        console.log(`   更新时间: ${model.updatedAt}`);
        console.log('   原始数据:', JSON.stringify(model.raw, null, 2));
        console.log('------------------------');
      });
    } else {
      console.log('MongoDB中没有找到任何AI模型');
    }
    
    if (defaultModels.length > 0) {
      console.log(`\nMongoDB中找到 ${defaultModels.length} 个默认AI模型:`);
      defaultModels.forEach((model: any, index: number) => {
        console.log(`${index + 1}. ${model.name} (${model.provider})`);
      });
    } else {
      console.log('\nMongoDB中没有找到默认AI模型');
    }
    
    console.log('\n检查完成');
  } catch (error) {
    console.error('检查MongoDB中的AI模型数据时出错:', error);
  }
}

// 执行检查
checkMongoDBAIModels();

export default checkMongoDBAIModels;