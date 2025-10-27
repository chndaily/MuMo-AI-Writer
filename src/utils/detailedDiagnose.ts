// 详细诊断AI模型同步问题
import { databaseManager, getDatabaseStatus } from '@/services/index';
import { defaultModelService } from '@/services/defaultModelService';
import { apiService } from '@/services/apiService';
import { LLMConnectionModel } from '#/llm';

async function detailedDiagnose() {
  try {
    console.log('=== 开始详细诊断AI模型同步问题 ===');
    
    // 1. 检查IndexedDB连接
    console.log('\n1. 检查IndexedDB连接...');
    try {
      const dbStatus = await getDatabaseStatus();
      console.log(`  数据库状态: ${dbStatus}`);
    } catch (error) {
      console.error('  IndexedDB连接检查失败:', error);
    }
    
    // 2. 检查MongoDB API连接
    console.log('\n2. 检查MongoDB API连接...');
    try {
      const response = await fetch('http://localhost:3001/api/ai-models');
      console.log(`  API连接状态: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const models = await response.json();
        console.log(`  API返回模型数量: ${models.length}`);
      } else {
        console.error('  API连接失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('  API连接检查失败:', error);
    }
    
    // 3. 检查IndexedDB中的模型
    console.log('\n3. 检查IndexedDB中的模型...');
    try {
      const indexedDbModels = await databaseManager.aiModels.getAllAIModels();
      console.log(`  IndexedDB中的模型数量: ${indexedDbModels.length}`);
      
      if (indexedDbModels.length > 0) {
        console.log('  IndexedDB中的模型详情:');
        indexedDbModels.forEach((model, index) => {
          console.log(`    ${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
        });
      }
    } catch (error) {
      console.error('  检查IndexedDB中的模型失败:', error);
    }
    
    // 4. 检查通过API服务获取的模型
    console.log('\n4. 检查通过API服务获取的模型...');
    try {
      const apiModels = await apiService.aiModels.getAllAIModels();
      console.log(`  API服务返回的模型数量: ${apiModels.length}`);
      
      if (apiModels.length > 0) {
        console.log('  API服务返回的模型详情:');
        apiModels.forEach((model: any, index: number) => {
          console.log(`    ${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
        });
      }
    } catch (error) {
      console.error('  检查API服务获取的模型失败:', error);
    }
    
    // 5. 检查默认模型服务
    console.log('\n5. 检查默认模型服务...');
    try {
      const adminModels = await defaultModelService.getAdminConfiguredDefaultModels();
      console.log(`  默认模型服务返回的模型数量: ${adminModels.length}`);
      
      if (adminModels.length > 0) {
        console.log('  默认模型服务返回的模型详情:');
        adminModels.forEach((model, index) => {
          console.log(`    ${index + 1}. ${model.name} (连接ID: ${model.connectionId})`);
        });
      }
    } catch (error) {
      console.error('  检查默认模型服务失败:', error);
    }
    
    // 6. 尝试保存测试模型
    console.log('\n6. 尝试保存测试模型...');
    try {
      const testModels: LLMConnectionModel[] = [
        {
          name: '诊断测试模型1',
          connectionId: 'diagnosis-connection-1',
          raw: {
            provider: 'OpenAI',
            model: 'gpt-4',
            baseUrl: 'https://api.openai.com/v1'
          }
        },
        {
          name: '诊断测试模型2',
          connectionId: 'diagnosis-connection-2',
          raw: {
            provider: 'DeepSeek',
            model: 'deepseek-ai/DeepSeek-V3.2-Exp',
            baseUrl: 'https://api-inference.modelscope.cn/v1'
          }
        }
      ];
      
      console.log('  正在保存测试模型...');
      await defaultModelService.setAdminDefaultModels(testModels, testModels[0].connectionId);
      console.log('  测试模型保存完成');
      
      // 验证保存结果
      console.log('  验证保存结果...');
      const savedModels = await databaseManager.aiModels.getAllAIModels();
      console.log(`  保存后数据库中的模型数量: ${savedModels.length}`);
    } catch (error) {
      console.error('  保存测试模型失败:', error);
    }
    
    // 7. 再次检查所有模型
    console.log('\n7. 再次检查所有模型...');
    try {
      const finalModels = await databaseManager.aiModels.getAllAIModels();
      console.log(`  最终数据库中的模型数量: ${finalModels.length}`);
      
      if (finalModels.length > 0) {
        console.log('  最终数据库中的模型详情:');
        finalModels.forEach((model, index) => {
          console.log(`    ${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
        });
      }
    } catch (error) {
      console.error('  最终检查模型失败:', error);
    }
    
    console.log('\n=== 详细诊断完成 ===');
    
  } catch (error) {
    console.error('详细诊断过程中发生错误:', error);
  }
}

// 执行诊断
detailedDiagnose();

export default detailedDiagnose;