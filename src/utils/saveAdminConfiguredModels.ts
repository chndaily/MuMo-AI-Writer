// 手动保存管理员配置的模型到数据库
import { defaultModelService } from '@/services/defaultModelService';
import { LLMConnectionModel } from '#/llm';

async function saveAdminConfiguredModels() {
  try {
    console.log('开始保存管理员配置的模型到数据库...');
    
    // 创建您配置的三个模型数据
    const adminModels: LLMConnectionModel[] = [
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
    
    console.log('管理员配置的模型数据:', adminModels);
    
    // 保存到数据库（将第一个模型设为默认模型）
    console.log('正在保存模型到数据库...');
    await defaultModelService.setAdminDefaultModels(adminModels, adminModels[0].connectionId);
    
    console.log('模型保存完成！');
    
    // 验证保存结果
    console.log('正在验证保存结果...');
    const savedModels = await defaultModelService.getAdminConfiguredDefaultModels();
    console.log(`验证结果：数据库中有 ${savedModels.length} 个模型`);
    
    savedModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} (连接ID: ${model.connectionId})`);
    });
    
    return savedModels;
  } catch (error) {
    console.error('保存管理员配置的模型到数据库时出错:', error);
    throw error;
  }
}

// 如果直接运行此脚本，则执行保存操作
if (typeof window === 'undefined') {
  // Node.js环境
  saveAdminConfiguredModels()
    .then(result => {
      console.log('保存完成，共保存了', result.length, '个模型');
    })
    .catch(error => {
      console.error('保存失败:', error);
    });
}

export default saveAdminConfiguredModels;