import { ContentRelationService } from '../contentRelationService';
import { databaseManager } from '@/services/index';

// 模拟 databaseManager
jest.mock('@/services', () => ({
  databaseManager: {
    characters: {
      getCharactersByNovelId: jest.fn()
    },
    locations: {
      getLocationsByNovelId: jest.fn()
    },
    outlines: {
      getOutlinesByNovelId: jest.fn()
    }
  }
}));

describe('ContentRelationService', () => {
  let contentRelationService: ContentRelationService;

  beforeEach(() => {
    contentRelationService = new ContentRelationService();
    // 清除所有模拟调用记录
    jest.clearAllMocks();
  });

  describe('findReferences', () => {
    it('应该正确查找内容中的角色引用', async () => {
      // 模拟数据
      const mockCharacters = [
        { id: 'char-1', novelId: 'novel-1', name: '张三', description: '', role: 'supporting', createdAt: '', lastModified: '' },
        { id: 'char-2', novelId: 'novel-1', name: '李四', description: '', role: 'supporting', createdAt: '', lastModified: '' }
      ];
      
      (databaseManager.characters.getCharactersByNovelId as jest.Mock).mockResolvedValue(mockCharacters);
      (databaseManager.locations.getLocationsByNovelId as jest.Mock).mockResolvedValue([]);
      (databaseManager.outlines.getOutlinesByNovelId as jest.Mock).mockResolvedValue([]);

      const content = '张三和李四在公园里散步。';
      const result = await contentRelationService.findReferences('novel-1', content);

      expect(result.characters).toHaveLength(2);
      expect(result.characters[0].name).toBe('张三');
      expect(result.characters[1].name).toBe('李四');
      expect(result.locations).toHaveLength(0);
      expect(result.outlines).toHaveLength(0);
    });

    it('应该正确查找内容中的地点引用', async () => {
      // 模拟数据
      const mockLocations = [
        { id: 'loc-1', novelId: 'novel-1', name: '北京', description: '', type: 'city', importance: 'high', createdAt: '', lastModified: '' },
        { id: 'loc-2', novelId: 'novel-1', name: '上海', description: '', type: 'city', importance: 'high', createdAt: '', lastModified: '' }
      ];
      
      (databaseManager.characters.getCharactersByNovelId as jest.Mock).mockResolvedValue([]);
      (databaseManager.locations.getLocationsByNovelId as jest.Mock).mockResolvedValue(mockLocations);
      (databaseManager.outlines.getOutlinesByNovelId as jest.Mock).mockResolvedValue([]);

      const content = '他从北京到了上海。';
      const result = await contentRelationService.findReferences('novel-1', content);

      expect(result.characters).toHaveLength(0);
      expect(result.locations).toHaveLength(2);
      expect(result.locations[0].name).toBe('北京');
      expect(result.locations[1].name).toBe('上海');
      expect(result.outlines).toHaveLength(0);
    });
  });

  describe('checkCharacterConsistency', () => {
    it('应该检测到重复的角色名称', async () => {
      // 模拟数据
      const mockCharacters = [
        { id: 'char-1', novelId: 'novel-1', name: '张三' }
      ];
      
      (databaseManager.characters.getCharactersByNovelId as jest.Mock).mockResolvedValue(mockCharacters);

      const characterData = { name: '张三' };
      const result = await contentRelationService.checkCharacterConsistency('novel-1', characterData);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('角色名称"张三"已存在');
    });

    it('应该通过有效的角色数据', async () => {
      // 模拟数据
      const mockCharacters = [
        { id: 'char-1', novelId: 'novel-1', name: '张三' }
      ];
      
      (databaseManager.characters.getCharactersByNovelId as jest.Mock).mockResolvedValue(mockCharacters);

      const characterData = { name: '李四' };
      const result = await contentRelationService.checkCharacterConsistency('novel-1', characterData);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('checkLocationConsistency', () => {
    it('应该检测到重复的地点名称', async () => {
      // 模拟数据
      const mockLocations = [
        { id: 'loc-1', novelId: 'novel-1', name: '北京' }
      ];
      
      (databaseManager.locations.getLocationsByNovelId as jest.Mock).mockResolvedValue(mockLocations);

      const locationData = { name: '北京' };
      const result = await contentRelationService.checkLocationConsistency('novel-1', locationData);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('地点名称"北京"已存在');
    });

    it('应该通过有效的地点数据', async () => {
      // 模拟数据
      const mockLocations = [
        { id: 'loc-1', novelId: 'novel-1', name: '北京' }
      ];
      
      (databaseManager.locations.getLocationsByNovelId as jest.Mock).mockResolvedValue(mockLocations);

      const locationData = { name: '上海' };
      const result = await contentRelationService.checkLocationConsistency('novel-1', locationData);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });
});