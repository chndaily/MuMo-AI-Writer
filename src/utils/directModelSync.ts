// 直接模型同步工具
// 通过直接调用后端API来确保模型正确保存和同步

interface AIModel {
  id?: string;
  name: string;
  provider: string;
  connectionId: string;
  description: string;
  isDefault: boolean;
  raw: any;
  createdAt?: string;
  updatedAt?: string;
}

class DirectModelSync {
  private readonly API_BASE_URL = 'http://localhost:3001';
  
  // 获取所有AI模型
  async getAllModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/ai-models`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('获取所有AI模型失败:', error);
      throw error;
    }
  }
  
  // 获取默认AI模型
  async getDefaultModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/ai-models?isDefault=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('获取默认AI模型失败:', error);
      throw error;
    }
  }
  
  // 创建AI模型
  async createModel(model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModel> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/ai-models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...model,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('创建AI模型失败:', error);
      throw error;
    }
  }
  
  // 删除AI模型
  async deleteModel(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/ai-models/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('删除AI模型失败:', error);
      throw error;
    }
  }
  
  // 清空所有AI模型
  async clearAllModels(): Promise<void> {
    try {
      console.log('正在清空所有AI模型...');
      const models = await this.getAllModels();
      console.log(`找到 ${models.length} 个模型，准备删除...`);
      
      for (const model of models) {
        await this.deleteModel(model.id!);
        console.log(`已删除模型: ${model.name}`);
      }
      
      console.log('所有AI模型已清空');
    } catch (error) {
      console.error('清空所有AI模型失败:', error);
      throw error;
    }
  }
  
  // 保存管理员配置的模型
  async saveAdminModels(): Promise<AIModel[]> {
    try {
      console.log('开始保存管理员配置的模型...');
      
      // 首先清空现有模型
      await this.clearAllModels();
      
      // 创建您配置的三个模型
      const adminModels: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'MCDeepSeek-V3.2',
          provider: 'DeepSeek',
          connectionId: 'deepseek-connection-1',
          description: '管理员配置的模型: MCDeepSeek-V3.2',
          isDefault: true,
          raw: {
            provider: 'DeepSeek',
            model: 'deepseek-ai/DeepSeek-V3.2-Exp',
            baseUrl: 'https://api-inference.modelscope.cn/v1'
          }
        },
        {
          name: 'test',
          provider: 'OpenAI',
          connectionId: 'openai-connection-1',
          description: '管理员配置的模型: test',
          isDefault: false,
          raw: {
            provider: 'OpenAI',
            model: 'gpt-4',
            baseUrl: 'https://api.openai.com/v1'
          }
        },
        {
          name: '123123',
          provider: 'OpenAI',
          connectionId: 'openai-connection-2',
          description: '管理员配置的模型: 123123',
          isDefault: false,
          raw: {
            provider: 'OpenAI',
            model: 'gpt-4',
            baseUrl: 'https://api.openai.com/v1'
          }
        }
      ];
      
      console.log('准备保存以下模型:');
      adminModels.forEach((model, index) => {
        console.log(`  ${index + 1}. ${model.name} (${model.provider})`);
      });
      
      // 保存模型
      const savedModels: AIModel[] = [];
      for (const model of adminModels) {
        const savedModel = await this.createModel(model);
        savedModels.push(savedModel);
        console.log(`模型保存成功: ${savedModel.name} (ID: ${savedModel.id})`);
      }
      
      console.log('所有管理员配置的模型保存完成');
      return savedModels;
    } catch (error) {
      console.error('保存管理员配置的模型失败:', error);
      throw error;
    }
  }
  
  // 验证模型同步
  async verifySync(): Promise<void> {
    try {
      console.log('=== 验证模型同步 ===');
      
      // 检查所有模型
      const allModels = await this.getAllModels();
      console.log(`数据库中总共有 ${allModels.length} 个模型:`);
      allModels.forEach((model, index) => {
        console.log(`  ${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
      });
      
      // 检查默认模型
      const defaultModels = await this.getDefaultModels();
      console.log(`\n默认模型数量: ${defaultModels.length}`);
      if (defaultModels.length > 0) {
        console.log('默认模型详情:');
        defaultModels.forEach((model, index) => {
          console.log(`  ${index + 1}. ${model.name} (${model.provider})`);
        });
      }
      
      console.log('=== 验证完成 ===');
    } catch (error) {
      console.error('验证模型同步失败:', error);
      throw error;
    }
  }
}

// 创建实例并导出
const directModelSync = new DirectModelSync();

// 如果直接运行此脚本，则执行保存和验证
if (typeof window === 'undefined') {
  // Node.js环境
  async function run() {
    try {
      await directModelSync.saveAdminModels();
      await directModelSync.verifySync();
    } catch (error) {
      console.error('执行失败:', error);
    }
  }
  
  run();
}

export default directModelSync;