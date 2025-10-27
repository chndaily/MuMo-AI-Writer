import { hybridStorageService } from '@/services/hybridStorageService';
import { databaseManager } from '@/services/index';

// 模拟IndexedDB操作
const mockIDBRequest = {
  onsuccess: null as Function | null,
  onerror: null as Function | null,
  result: null as any,
};

const mockIDBTransaction = {
  objectStore: jest.fn().mockReturnValue({
    add: jest.fn().mockReturnValue(mockIDBRequest),
    put: jest.fn().mockReturnValue(mockIDBRequest),
    get: jest.fn().mockReturnValue(mockIDBRequest),
    getAll: jest.fn().mockReturnValue(mockIDBRequest),
    index: jest.fn().mockReturnValue({
      getAll: jest.fn().mockReturnValue(mockIDBRequest),
    }),
  }),
};

const mockDB = {
  transaction: jest.fn().mockReturnValue(mockIDBTransaction),
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(true),
  },
};

// 模拟databaseManager
jest.mock('@/services/databaseManager', () => ({
  databaseManager: {
    characters: {
      addCharacter: jest.fn(),
      updateCharacter: jest.fn(),
      getCharactersByNovelId: jest.fn().mockResolvedValue([]),
    },
    locations: {
      addLocation: jest.fn(),
      updateLocation: jest.fn(),
    },
    cultures: {
      addWorldSetting: jest.fn(),
      updateWorldSetting: jest.fn(),
    },
    technologies: {
      addWorldSetting: jest.fn(),
      updateWorldSetting: jest.fn(),
    },
    magics: {
      addWorldSetting: jest.fn(),
      updateWorldSetting: jest.fn(),
    },
    histories: {
      addWorldSetting: jest.fn(),
      updateWorldSetting: jest.fn(),
    },
  },
}));

describe('Character Storage Debug', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should save character data correctly', async () => {
    // 模拟添加角色的数据库操作
    const mockCharacter = {
      id: 'test-character-id',
      novelId: 'test-novel-id',
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
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    (databaseManager.characters.addCharacter as jest.Mock).mockResolvedValue(mockCharacter);

    // 调用hybridStorageService保存角色
    await hybridStorageService.saveWorldElement(mockCharacter, 'character');

    // 验证调用
    expect(databaseManager.characters.addCharacter).toHaveBeenCalledWith({
      novelId: 'test-novel-id',
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
    });
  });

  test('should update existing character correctly', async () => {
    // 模拟更新角色的数据库操作
    const mockCharacter = {
      id: 'existing-character-id',
      novelId: 'test-novel-id',
      name: '现有角色',
      description: '这是一个现有角色',
      role: 'supporting',
      appearance: '美丽动人',
      personality: '聪明机智',
      background: '平民出身',
      abilities: '医术高超',
      relationships: '与主角是朋友',
      characterArc: '成为医师',
      details: '详细信息',
      tags: ['现有', '角色'],
      professionTags: ['医师'],
      personalityTags: ['聪明'],
      functionTags: ['配角'],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    (databaseManager.characters.updateCharacter as jest.Mock).mockResolvedValue(undefined);

    // 调用hybridStorageService更新角色
    await hybridStorageService.saveWorldElement(mockCharacter, 'character');

    // 验证调用
    expect(databaseManager.characters.updateCharacter).toHaveBeenCalledWith({
      ...mockCharacter,
      lastModified: expect.any(String),
    });
  });

  test('should retrieve characters correctly', async () => {
    // 模拟获取角色的数据库操作
    const mockCharacters = [
      {
        id: 'character-1',
        novelId: 'test-novel-id',
        name: '角色1',
        description: '这是角色1',
        role: 'protagonist',
        appearance: '英俊潇洒',
        personality: '勇敢正义',
        background: '出身名门',
        abilities: '剑术高超',
        relationships: '与角色2是朋友',
        characterArc: '成长为英雄',
        details: '详细信息1',
        tags: ['角色1'],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      {
        id: 'character-2',
        novelId: 'test-novel-id',
        name: '角色2',
        description: '这是角色2',
        role: 'supporting',
        appearance: '美丽动人',
        personality: '聪明机智',
        background: '平民出身',
        abilities: '医术高超',
        relationships: '与角色1是朋友',
        characterArc: '成为医师',
        details: '详细信息2',
        tags: ['角色2'],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      }
    ];

    (databaseManager.characters.getCharactersByNovelId as jest.Mock).mockResolvedValue(mockCharacters);

    // 调用hybridStorageService获取角色
    const result = await hybridStorageService.getWorldElements('character', 'test-novel-id');

    // 验证结果
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('角色1');
    expect(result[1].name).toBe('角色2');
    expect(databaseManager.characters.getCharactersByNovelId).toHaveBeenCalledWith('test-novel-id');
  });
});