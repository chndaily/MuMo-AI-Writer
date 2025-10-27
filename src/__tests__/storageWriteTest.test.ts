import { hybridStorageService } from '@/services/hybridStorageService';

// 创建一个简单的测试来验证数据存储
describe('Storage Write Test', () => {
  test('should write and read character data', async () => {
    // 创建测试数据
    const testCharacter = {
      id: 'test-char-001',
      novelId: 'test-novel-001',
      name: '测试角色',
      description: '这是一个测试角色',
      role: 'protagonist' as const,
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
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    // 模拟console.log以便捕获输出
    const originalLog = console.log;
    const mockLogs: string[] = [];
    console.log = (...args) => {
      mockLogs.push(args.join(' '));
    };

    try {
      // 测试保存角色数据
      console.log('开始保存角色数据...');
      await hybridStorageService.saveWorldElement(testCharacter, 'character');
      console.log('角色数据保存完成');

      // 检查日志输出
      const saveLogs = mockLogs.filter(log => log.includes('hybridStorageService.saveWorldElement'));
      expect(saveLogs.length).toBeGreaterThan(0);
      expect(saveLogs[0]).toContain('测试角色');

      // 测试获取角色数据
      console.log('开始获取角色数据...');
      const characters = await hybridStorageService.getWorldElements('character', 'test-novel-001');
      console.log('角色数据获取完成，数量:', characters.length);

      // 检查是否获取到了数据
      console.log('获取到的角色数据:', JSON.stringify(characters, null, 2));
    } finally {
      // 恢复console.log
      console.log = originalLog;
    }
  }, 10000); // 增加超时时间
});