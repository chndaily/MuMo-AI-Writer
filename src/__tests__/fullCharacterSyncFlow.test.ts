import { hybridStorageService } from '@/services/hybridStorageService';
import { databaseManager } from '@/services/index';

// 模拟完整的角色同步流程
describe('Full Character Sync Flow', () => {
  beforeAll(async () => {
    // 初始化数据库
    try {
      // databaseManager.initializeDatabase() 方法已移除
      // 使用 initializeDatabase() 函数替代
      console.log('跳过数据库初始化');
    } catch (error) {
      console.log('数据库初始化失败:', error);
    }
  }, 10000);

  test('should complete full character sync flow', async () => {
    const novelId = 'test-novel-id';
    const characterData = {
      name: '测试角色',
      description: '这是一个测试角色',
      role: 'protagonist',
      appearance: '英俊潇洒',
      personality: '勇敢正义',
      background: '出身名门',
      abilities: '剑术高超',
      relationships: '与主角是朋友',
      characterArc: '成长为英雄',
      details: '详细信息',
      tags: ['测试', '角色'],
      professionTags: ['剑客'],
      personalityTags: ['勇敢'],
      functionTags: ['主角'],
    };

    // 模拟console.log以便捕获输出
    const originalLog = console.log;
    const mockLogs: string[] = [];
    console.log = (...args) => {
      mockLogs.push(args.join(' '));
    };

    try {
      // 1. 保存角色数据
      console.log('步骤1: 保存角色数据');
      const characterElement = {
        ...characterData,
        id: undefined, // 让系统生成ID
        novelId,
        type: 'character',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      await hybridStorageService.saveWorldElement(characterElement, 'character');
      console.log('角色数据保存完成');

      // 检查保存日志
      const saveLogs = mockLogs.filter(log => log.includes('添加新角色'));
      expect(saveLogs.length).toBeGreaterThan(0);
      expect(saveLogs[0]).toContain('测试角色');

      // 2. 等待一段时间确保数据写入完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3. 获取保存的角色数据
      console.log('步骤2: 获取角色数据');
      const characters = await hybridStorageService.getWorldElements('character', novelId);
      console.log('获取到的角色数量:', characters.length);

      // 验证获取到的数据
      expect(characters.length).toBeGreaterThan(0);
      const savedCharacter = characters.find((c: any) => c.name === '测试角色');
      expect(savedCharacter).toBeDefined();
      expect(savedCharacter?.name).toBe('测试角色');
      expect(savedCharacter?.role).toBe('protagonist');
      expect(savedCharacter?.appearance).toBe('英俊潇洒');
      expect(savedCharacter?.personality).toBe('勇敢正义');

      // 4. 更新角色数据
      console.log('步骤3: 更新角色数据');
      const updatedCharacter = {
        ...savedCharacter,
        appearance: '更加英俊潇洒',
        lastModified: new Date().toISOString(),
      };

      await hybridStorageService.saveWorldElement(updatedCharacter, 'character');
      console.log('角色数据更新完成');

      // 5. 再次获取并验证更新
      await new Promise(resolve => setTimeout(resolve, 100));
      const updatedCharacters = await hybridStorageService.getWorldElements('character', novelId);
      const reSavedCharacter = updatedCharacters.find((c: any) => c.name === '测试角色');
      expect(reSavedCharacter?.appearance).toBe('更加英俊潇洒');

      console.log('完整的角色同步流程测试完成');
    } finally {
      // 恢复console.log
      console.log = originalLog;
    }
  }, 15000); // 增加超时时间
});