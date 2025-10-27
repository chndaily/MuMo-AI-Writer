import { CharacterSyncService } from '../services/sync/CharacterSyncService';
import { hybridStorageService } from '../services/hybridStorageService';

// Mock hybridStorageService
jest.mock('../services/hybridStorageService', () => ({
  hybridStorageService: {
    saveWorldElement: jest.fn(),
    getWorldElements: jest.fn(),
    getWorldElementsByExactTags: jest.fn()
  }
}));

describe('Simple Character Sync Test', () => {
  let characterSyncService: CharacterSyncService;

  beforeEach(() => {
    characterSyncService = new CharacterSyncService();
    jest.clearAllMocks();
  });

  it('should parse and sync multiple characters correctly', async () => {
    // 模拟AI生成的角色内容
    const aiContent = `
【角色设定：李明】
【基本信息】
姓名：李明
角色类型：主角
标签：工程师、聪明、好学
描述：一个年轻的工程师，聪明好学

【外貌特征】
中等身材，戴眼镜

【性格特质】
内向但坚韧

【背景故事】
出身普通家庭

【能力设定】
机械设计

【人际关系】
与导师关系密切

【角色发展弧光】
从新手成长为专家

【角色设定：王芳】
【基本信息】
姓名：王芳
角色类型：配角
标签：项目经理、干练、果断
描述：经验丰富的项目经理

【外貌特征】
高挑，干练

【性格特质】
果断，有领导力

【背景故事】
曾在多家公司工作

【能力设定】
项目管理

【人际关系】
与团队成员关系良好

【角色发展弧光】
帮助主角成长
`;

    // 模拟数据库中已有的元素
    (hybridStorageService.getWorldElements as jest.Mock).mockResolvedValue([]);
    (hybridStorageService.getWorldElementsByExactTags as jest.Mock).mockResolvedValue([]);
    (hybridStorageService.saveWorldElement as jest.Mock).mockResolvedValue(undefined);

    // 执行同步
    const result = await characterSyncService.syncCharacters(aiContent, 'test-novel-id', {});

    // 验证结果
    expect(result.success).toBe(true);
    expect(result.syncedItems).toBe(2); // 应该同步2个角色
    expect(hybridStorageService.saveWorldElement).toHaveBeenCalledTimes(2); // 应该调用2次保存

    // 验证保存的角色数据
    const savedElements = (hybridStorageService.saveWorldElement as jest.Mock).mock.calls;
    expect(savedElements[0][0].name).toBe('李明');
    expect(savedElements[0][0].role).toBe('protagonist');
    expect(savedElements[1][0].name).toBe('王芳');
    expect(savedElements[1][0].role).toBe('supporting');
  });
});