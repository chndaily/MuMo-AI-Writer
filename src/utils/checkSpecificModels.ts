// 检查特定的AI模型是否存在于数据库中
import { apiService } from '@/services/apiService';
import { AIModelRecord } from '@/services/aiModelStore';

async function checkSpecificModels() {
  try {
    console.log('开始检查特定的AI模型...');
    
    // 管理员配置的三个模型名称
    const targetModelNames = [
      'MCDeepSeek-V3.2',
      'test',
      '123123'
    ];
    
    // 获取所有AI模型
    console.log('正在获取所有AI模型...');
    const allModels: AIModelRecord[] = await apiService.aiModels.getAllAIModels();
    console.log(`数据库中总共找到 ${allModels.length} 个AI模型`);
    
    console.log('\n=== 检查目标模型 ===');
    for (const modelName of targetModelNames) {
      const foundModel = allModels.find((model) => model.name === modelName);
      if (foundModel) {
        console.log(`✓ 找到模型: ${modelName}`);
        console.log(`  ID: ${foundModel.id}`);
        console.log(`  提供商: ${foundModel.provider}`);
        console.log(`  连接ID: ${foundModel.connectionId}`);
        console.log(`  描述: ${foundModel.description}`);
        console.log(`  是否默认: ${foundModel.isDefault}`);
        console.log(`  创建时间: ${foundModel.createdAt}`);
        console.log(`  更新时间: ${foundModel.updatedAt}`);
        console.log('  原始数据:', JSON.stringify(foundModel.raw, null, 2));
        console.log('------------------------');
      } else {
        console.log(`✗ 未找到模型: ${modelName}`);
        console.log('------------------------');
      }
    }
    
    // 检查默认模型
    console.log('\n=== 检查默认模型 ===');
    const defaultModels: AIModelRecord[] = await apiService.aiModels.getDefaultAIModels();
    if (defaultModels.length > 0) {
      console.log(`找到 ${defaultModels.length} 个默认模型:`);
      defaultModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name} (${model.provider})`);
      });
    } else {
      console.log('没有找到默认模型');
    }
    
    // 显示所有模型的简要信息
    console.log('\n=== 数据库中所有模型的简要信息 ===');
    if (allModels.length > 0) {
      allModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
      });
    } else {
      console.log('数据库中没有任何模型');
    }
    
    return { allModels, defaultModels, targetModelNames };
  } catch (error) {
    console.error('检查特定AI模型时出错:', error);
    throw error;
  }
}

// 执行检查
checkSpecificModels()
  .then(result => {
    console.log('\n检查完成');
  })
  .catch(error => {
    console.error('检查失败:', error);
  });

export default checkSpecificModels;