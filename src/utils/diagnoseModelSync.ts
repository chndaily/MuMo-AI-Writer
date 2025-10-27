// 诊断AI模型同步问题
import { defaultModelService } from '@/services/defaultModelService';
import { databaseManager } from '@/services/index';
import { LLMConnectionModel } from '#/llm';

async function diagnoseModelSync() {
  try {
    console.log('=== 开始诊断AI模型同步问题 ===');
    
    // 1. 检查数据库连接
    console.log('\n1. 检查数据库连接...');
    try {
      const dbModels = await databaseManager.aiModels.getAllAIModels();
      console.log(`  数据库连接正常，当前有 ${dbModels.length} 个模型`);
    } catch (error) {
      console.error('  数据库连接失败:', error);
      return;
    }
    
    // 2. 创建测试模型数据
    console.log('\n2. 创建测试模型数据...');
    const testModels: LLMConnectionModel[] = [
      {
        name: 'MCDeepSeek-V3.2',
        connectionId: 'deepseek-connection-1',
        raw: {
          provider: 'DeepSeek',
          model: 'deepseek-ai/DeepSeek-V3.2-Exp',
          baseUrl: 'https://api-inference.modelscope.cn/v1'
        }
      },
      {
        name: 'test',
        connectionId: 'openai-connection-1',
        raw: {
          provider: 'OpenAI',
          model: 'gpt-4',
          baseUrl: 'https://api.openai.com/v1'
        }
      },
      {
        name: '123123',
        connectionId: 'openai-connection-2',
        raw: {
          provider: 'OpenAI',
          model: 'gpt-4',
          baseUrl: 'https://api.openai.com/v1'
        }
      }
    ];
    
    console.log('  测试模型数据创建完成');
    
    // 3. 保存模型到数据库
    console.log('\n3. 保存模型到数据库...');
    try {
      await defaultModelService.setAdminDefaultModels(testModels, testModels[0].connectionId);
      console.log('  模型保存完成');
    } catch (error) {
      console.error('  模型保存失败:', error);
      return;
    }
    
    // 4. 验证保存结果
    console.log('\n4. 验证保存结果...');
    try {
      const savedModels = await databaseManager.aiModels.getAllAIModels();
      console.log(`  数据库中现在有 ${savedModels.length} 个模型`);
      
      if (savedModels.length > 0) {
        console.log('  保存的模型详情:');
        savedModels.forEach((model, index) => {
          console.log(`    ${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
        });
      } else {
        console.log('  警告: 数据库中没有模型');
      }
    } catch (error) {
      console.error('  验证保存结果失败:', error);
      return;
    }
    
    // 5. 测试初始化加载
    console.log('\n5. 测试初始化加载...');
    try {
      await defaultModelService.initializeAdminDefaultModels();
      console.log('  初始化加载完成');
    } catch (error) {
      console.error('  初始化加载失败:', error);
      return;
    }
    
    // 6. 检查最终结果
    console.log('\n6. 检查最终结果...');
    const { adminDefaultModels } = (await import('@/stores/aiServiceStore')).useAIServiceStore.getState();
    console.log(`  Store中有 ${adminDefaultModels.length} 个管理员默认模型`);
    
    if (adminDefaultModels.length > 0) {
      console.log('  管理员默认模型详情:');
      adminDefaultModels.forEach((model, index) => {
        console.log(`    ${index + 1}. ${model.name} (连接ID: ${model.connectionId})`);
      });
    } else {
      console.log('  警告: Store中没有管理员默认模型');
    }
    
    console.log('\n=== 诊断完成 ===');
    
    return {
      dbModels: await databaseManager.aiModels.getAllAIModels(),
      storeModels: adminDefaultModels
    };
  } catch (error) {
    console.error('诊断过程中发生错误:', error);
    throw error;
  }
}

// 执行诊断
diagnoseModelSync()
  .then(result => {
    console.log('\n诊断结果:', result);
  })
  .catch(error => {
    console.error('诊断失败:', error);
  });

export default diagnoseModelSync;