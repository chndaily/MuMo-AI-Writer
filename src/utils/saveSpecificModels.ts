// 保存特定的AI模型到数据库
import { defaultModelService } from '@/services/defaultModelService';
import { databaseManager } from '@/services/index';
import { LLMConnectionModel } from '#/llm';

async function saveSpecificModels() {
  try {
    console.log('开始保存特定的AI模型到数据库...');
    
    // 创建您配置的三个模型数据
    const specificModels: LLMConnectionModel[] = [
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
    
    console.log('特定模型数据:', specificModels);
    
    // 保存到数据库（假设第一个模型为默认模型）
    console.log('正在保存模型到数据库...');
    await defaultModelService.setAdminDefaultModels(specificModels, specificModels[0].connectionId);
    
    console.log('模型保存完成');
    
    // 验证保存结果
    console.log('正在验证保存结果...');
    const savedModels = await databaseManager.aiModels.getAllAIModels();
    console.log('数据库中的模型:', savedModels);
    
    // 显示保存的模型信息
    console.log('\n=== 保存的模型信息 ===');
    savedModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
    });
    
    return savedModels;
  } catch (error) {
    console.error('保存特定AI模型到数据库时出错:', error);
    throw error;
  }
}

// 执行保存
saveSpecificModels()
  .then(result => {
    console.log('\n保存完成，共保存了', result.length, '个模型');
  })
  .catch(error => {
    console.error('保存失败:', error);
  });

export default saveSpecificModels;