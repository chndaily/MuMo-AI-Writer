// 修复AI模型同步问题
import { databaseManager, getDatabaseStatus, initializeDatabase } from '@/services/index';
import { defaultModelService } from '@/services/defaultModelService';
import { apiService } from '@/services/apiService';
import { useAIServiceStore } from '@/stores/aiServiceStore';

async function fixModelSync() {
  try {
    console.log('=== 开始修复AI模型同步问题 ===');
    
    // 1. 检查数据库连接
    console.log('\n1. 检查数据库连接...');
    const dbStatus = await getDatabaseStatus();
    console.log(`  数据库状态: ${dbStatus}`);
    
    // 2. 从API获取模型
    console.log('\n2. 从API获取模型...');
    try {
      const apiModels = await apiService.aiModels.getAllAIModels();
      console.log(`  API返回模型数量: ${apiModels.length}`);
      
      if (apiModels.length > 0) {
        console.log('  API返回的模型详情:');
        apiModels.forEach((model: any, index: number) => {
          console.log(`    ${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
        });
      }
      
      // 3. 将API模型保存到IndexedDB
      console.log('\n3. 将API模型保存到IndexedDB...');
      // 清空现有的数据库模型
      const existingModels = await databaseManager.aiModels.getAllAIModels();
      console.log(`  IndexedDB中现有模型数量: ${existingModels.length}`);
      
      for (const model of existingModels) {
        await databaseManager.aiModels.deleteAIModel(model.id);
      }
      
      // 保存API模型到IndexedDB
      console.log('  保存API模型到IndexedDB...');
      for (const model of apiModels) {
        // 转换模型格式
        const modelToSave = {
          name: model.name,
          provider: model.provider,
          connectionId: model.connectionId,
          description: model.description,
          isDefault: model.isDefault,
          raw: model.raw,
          createdAt: model.createdAt,
          updatedAt: model.updatedAt
        };
        
        await databaseManager.aiModels.addAIModel(modelToSave);
      }
      
      console.log('  IndexedDB模型保存完成');
      
      // 4. 更新store中的管理员默认模型
      console.log('\n4. 更新store中的管理员默认模型...');
      // 转换为LLMConnectionModel格式
      const llmModels = apiModels.map((model: any) => ({
        name: model.name,
        connectionId: model.connectionId,
        raw: model.raw
      }));
      
      useAIServiceStore.getState().setAdminDefaultModels(llmModels);
      console.log('  store中的管理员默认模型更新完成');
    } catch (error) {
      console.error('  从API获取模型失败:', error);
      
      // 5. 如果API获取失败，尝试从IndexedDB获取
      console.log('\n5. 尝试从IndexedDB获取模型...');
      try {
        const indexedDbModels = await databaseManager.aiModels.getAllAIModels();
        console.log(`  IndexedDB中的模型数量: ${indexedDbModels.length}`);
        
        if (indexedDbModels.length > 0) {
          console.log('  IndexedDB中的模型详情:');
          indexedDbModels.forEach((model, index) => {
            console.log(`    ${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
          });
          
          // 更新store中的管理员默认模型
          console.log('\n  更新store中的管理员默认模型...');
          // 转换为LLMConnectionModel格式
          const llmModels = indexedDbModels.map((model) => ({
            name: model.name,
            connectionId: model.connectionId,
            raw: model.raw
          }));
          
          useAIServiceStore.getState().setAdminDefaultModels(llmModels);
          console.log('  store中的管理员默认模型更新完成');
        }
      } catch (dbError) {
        console.error('  从IndexedDB获取模型也失败:', dbError);
      }
    }
    
    // 6. 最终验证
    console.log('\n6. 最终验证...');
    const finalModels = await defaultModelService.getAdminConfiguredDefaultModels();
    console.log(`  最终模型数量: ${finalModels.length}`);
    
    if (finalModels.length > 0) {
      console.log('  最终模型详情:');
      finalModels.forEach((model, index) => {
        console.log(`    ${index + 1}. ${model.name} (连接ID: ${model.connectionId})`);
      });
    }
    
    console.log('\n=== AI模型同步问题修复完成 ===');
    
    return finalModels;
  } catch (error) {
    console.error('修复AI模型同步问题时发生错误:', error);
    throw error;
  }
}

// 执行修复
fixModelSync()
  .then(result => {
    console.log('修复完成，最终模型数量:', result.length);
  })
  .catch(error => {
    console.error('修复失败:', error);
  });

export default fixModelSync;