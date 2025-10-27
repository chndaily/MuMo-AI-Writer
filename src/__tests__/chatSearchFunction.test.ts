import { searchKnowledgeBase } from '../utils/aiKnowledgeBaseUtils';
import type { Collection, PromptCollection } from '#/promptLibrary';
import { CollectionType, PromptType } from '#/promptLibrary';

// Mock Collection数据
const mockCollections: Collection[] = [
  {
    id: '1',
    type: CollectionType.Prompts,
    meta: {
      state: 'active',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    },
    attributes: {
      type: PromptType.Other,
      name: '凡人修仙传',
      description: '经典修仙小说',
      messages: [],
      models: []
    },
    relationships: {
      owner: {
        type: 'users',
        id: 'user1'
      }
    }
  } as PromptCollection,
  {
    id: '2',
    type: CollectionType.Prompts,
    meta: {
      state: 'active',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    },
    attributes: {
      type: PromptType.Other,
      name: '斗破苍穹',
      description: '玄幻小说',
      messages: [],
      models: []
    },
    relationships: {
      owner: {
        type: 'users',
        id: 'user1'
      }
    }
  } as PromptCollection
];

// 为mockCollections添加一个方法来模拟extractAllCaseLibraryContent的行为
jest.mock('../utils/caseLibraryUtils', () => ({
  ...jest.requireActual('../utils/caseLibraryUtils'),
  extractAllCaseLibraryContent: jest.fn().mockImplementation(async (collection) => {
    // 模拟从案例库中提取内容
    if (collection.attributes.name === '凡人修仙传') {
      return ['凡人修仙传是一部经典的修仙小说，讲述了韩立从凡人逐步修炼成仙的故事。'];
    } else if (collection.attributes.name === '斗破苍穹') {
      return ['斗破苍穹是一部玄幻小说，讲述了萧炎从废柴逆袭成为强者的传奇经历。'];
    }
    return [];
  })
}));

describe('Chat Search Function Test', () => {
  it('should search knowledge base and return relevant content', async () => {
    // 测试搜索功能
    const result = await searchKnowledgeBase(mockCollections, '修仙', 1000);
    
    // 验证结果
    expect(result).toContain('根据查询"修仙"找到的相关知识库内容');
    expect(result).toContain('凡人修仙传');
    expect(result).toContain('韩立');
  });

  it('should handle empty search query', async () => {
    // 测试空查询
    const result = await searchKnowledgeBase(mockCollections, '', 1000);
    
    // 验证结果
    expect(result).toBe('请提供更具体的查询内容');
  });

  it('should handle no matching results', async () => {
    // 测试无匹配结果
    const result = await searchKnowledgeBase(mockCollections, '科幻', 1000);
    
    // 验证结果包含提示信息
    expect(result).toContain('根据查询"科幻"找到的相关知识库内容');
    expect(result).toContain('未找到与查询直接相关的内容');
  });
});