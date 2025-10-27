// 测试AI模型同步到MongoDB数据库
import { defaultModelService } from '@/services/defaultModelService';
import { databaseManager } from '@/services/index';
import { LLMConnectionModel } from '#/llm';

async function testAIModelSync() {
  try {
    console.log('开始测试AI模型同步到MongoDB数据库...');
    
    // 创建测试模型数据
    const testModels: LLMConnectionModel[] = [
      {
        name: 'GPT-4 Test Model',
        connectionId: 'test-connection-1',
        raw: {
          provider: 'OpenAI',
          capabilities: ['text-generation', 'code-completion']
        }
      },
      {
        name: 'Claude Test Model',
        connectionId: 'test-connection-2',
        raw: {
          provider: 'Anthropic',
          capabilities: ['text-generation', 'analysis']
        }
      }
    ];
    
    console.log('测试模型数据:', testModels);
    
    // 保存管理员默认模型
    console.log('正在保存管理员默认模型...');
    await defaultModelService.setAdminDefaultModels(testModels, testModels[0].connectionId);
    console.log('管理员默认模型保存完成');
    
    // 从数据库获取模型
    console.log('正在从数据库获取AI模型...');
    const dbModels = await databaseManager.aiModels.getAllAIModels();
    console.log('从数据库获取的AI模型:', dbModels);
    
    // 检查模型是否正确保存
    if (dbModels.length > 0) {
      console.log(`\n成功同步 ${dbModels.length} 个AI模型到MongoDB数据库:`);
      dbModels.forEach((model, index) => {
        console.log(`${index + 1}. ID: ${model.id}`);
        console.log(`   名称: ${model.name}`);
        console.log(`   提供商: ${model.provider}`);
        console.log(`   连接ID: ${model.connectionId}`);
        console.log(`   描述: ${model.description}`);
        console.log(`   是否默认: ${model.isDefault}`);
        console.log(`   创建时间: ${model.createdAt}`);
        console.log(`   更新时间: ${model.updatedAt}`);
        console.log('   原始数据:', model.raw);
        console.log('------------------------');
      });
    } else {
      console.log('MongoDB数据库中没有找到AI模型');
    }
    
    // 测试获取默认模型
    console.log('\n正在测试获取默认模型列表...');
    const defaultModelList = await defaultModelService.getDefaultModelList();
    console.log('默认模型列表:', defaultModelList);
    
    // 测试初始化管理员默认模型
    console.log('\n正在测试初始化管理员默认模型...');
    await defaultModelService.initializeAdminDefaultModels();
    console.log('管理员默认模型初始化完成');
    
  } catch (error) {
    console.error('测试AI模型同步时出错:', error);
  }
}

// 完整AI模型测试函数
export async function runFullAIModelTest() {
  console.log('开始运行完整AI模型同步测试...');
  await testAIModelSync();
  console.log('完整AI模型同步测试完成');
}

// 成员访问测试函数
export async function testMemberAccess() {
  console.log('开始测试成员访问...');
  // 这里可以添加具体的成员访问测试逻辑
  console.log('成员访问测试完成');
}

// 模型同步测试函数
export async function testModelSync() {
  console.log('开始测试模型同步...');
  // 这里可以添加具体的模型同步测试逻辑
  console.log('模型同步测试完成');
}

// 执行测试
testAIModelSync();

export default testAIModelSync;