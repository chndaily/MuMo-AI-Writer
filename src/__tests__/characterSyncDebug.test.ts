import { CharacterSyncService } from '@/services/sync/CharacterSyncService';
import { hybridStorageService } from '@/services/hybridStorageService';
import { parserServices } from '@/services/parsers';

// 模拟依赖服务
jest.mock('@/services/hybridStorageService');
jest.mock('@/services/parsers');

describe('Character Sync Debug', () => {
  let characterSyncService: CharacterSyncService;

  beforeEach(() => {
    characterSyncService = new CharacterSyncService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle single character sync correctly', async () => {
    // 模拟解析服务返回单个角色
    const mockCharacter = {
      name: '测试角色',
      description: '这是一个测试角色',
      role: 'protagonist',
      appearance: '英俊潇洒',
      personality: '勇敢正义',
      background: '出身名门',
      abilities: '剑术高超',
      relationships: '与主角是朋友',
      characterArc: '成长为英雄',
      details: '详细信息'
    };

    (parserServices.character.parseCharacterContent as jest.Mock).mockResolvedValue(mockCharacter);

    // 模拟存储服务
    (hybridStorageService.getWorldElements as jest.Mock).mockResolvedValue([]);
    (hybridStorageService.getWorldElementsByExactTags as jest.Mock).mockResolvedValue([]);
    (hybridStorageService.saveWorldElement as jest.Mock).mockResolvedValue(undefined);

    const content = `【角色设定1：测试角色】
【基本信息】
【名称】：测试角色
【角色类型】：主角
【标签】：勇敢、正义
【描述】：这是一个测试角色
【外貌特征】
英俊潇洒
【性格特质】
勇敢正义
【背景故事】
出身名门
【能力设定】
剑术高超
【人际关系】
与主角是朋友
【角色发展弧光】
成长为英雄
【细节补充】
详细信息`;

    const novelId = 'test-novel-id';

    const result = await characterSyncService.syncCharacters(content, novelId, {});

    // 验证结果
    expect(result.success).toBe(true);
    expect(result.syncedItems).toBe(1);
    
    // 验证调用次数
    expect(parserServices.character.parseCharacterContent).toHaveBeenCalledTimes(1);
    expect(hybridStorageService.getWorldElements).toHaveBeenCalledTimes(1);
    expect(hybridStorageService.saveWorldElement).toHaveBeenCalledTimes(1);
  });

  test('should handle multiple characters sync correctly', async () => {
    // 模拟解析服务返回多个角色
    const mockCharacters = [
      {
        name: '角色1',
        description: '这是角色1',
        role: 'protagonist',
        appearance: '英俊潇洒',
        personality: '勇敢正义',
        background: '出身名门',
        abilities: '剑术高超',
        relationships: '与角色2是朋友',
        characterArc: '成长为英雄',
        details: '详细信息1'
      },
      {
        name: '角色2',
        description: '这是角色2',
        role: 'supporting',
        appearance: '美丽动人',
        personality: '聪明机智',
        background: '平民出身',
        abilities: '医术高超',
        relationships: '与角色1是朋友',
        characterArc: '成为医师',
        details: '详细信息2'
      }
    ];

    (parserServices.character.parseCharacterContent as jest.Mock).mockResolvedValue(mockCharacters);

    // 模拟存储服务
    (hybridStorageService.getWorldElements as jest.Mock).mockResolvedValue([]);
    (hybridStorageService.getWorldElementsByExactTags as jest.Mock).mockResolvedValue([]);
    (hybridStorageService.saveWorldElement as jest.Mock).mockResolvedValue(undefined);

    const content = `【角色设定1：角色1】
【基本信息】
【名称】：角色1
【角色类型】：主角
【标签】：勇敢、正义
【描述】：这是角色1
【外貌特征】
英俊潇洒
【性格特质】
勇敢正义
【背景故事】
出身名门
【能力设定】
剑术高超
【人际关系】
与角色2是朋友
【角色发展弧光】
成长为英雄
【细节补充】
详细信息1

【角色设定2：角色2】
【基本信息】
【名称】：角色2
【角色类型】：配角
【标签】：聪明、善良
【描述】：这是角色2
【外貌特征】
美丽动人
【性格特质】
聪明机智
【背景故事】
平民出身
【能力设定】
医术高超
【人际关系】
与角色1是朋友
【角色发展弧光】
成为医师
【细节补充】
详细信息2`;

    const novelId = 'test-novel-id';

    const result = await characterSyncService.syncCharacters(content, novelId, {});

    // 验证结果
    expect(result.success).toBe(true);
    expect(result.syncedItems).toBe(2);
    
    // 验证调用次数
    expect(parserServices.character.parseCharacterContent).toHaveBeenCalledTimes(1);
    expect(hybridStorageService.getWorldElements).toHaveBeenCalledTimes(2);
    expect(hybridStorageService.saveWorldElement).toHaveBeenCalledTimes(2);
  });
});