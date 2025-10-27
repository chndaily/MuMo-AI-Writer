import { Novel, Chapter, NovelGenre, NovelTag, NovelOutline, Character, WritingStats, Location, WorldSetting, ChapterVersion, WritingRecord } from '#/novel'
import { MongodbStorageService } from './mongodbStorageService'
// 从chatStore导入Message和ChatHistory
import { Message, ChatHistory } from './chatStore'
// 从aiUsageHistoryService导入AIUsageRecord
import { AIUsageRecord } from './aiUsageHistoryService'
import { AIModelRecord } from './aiModelStore'
import { Collection } from '#/promptLibrary'

/**
 * 数据库管理器
 * 整合所有存储模块，提供统一的数据库操作接口
 * 修改为只使用 MongoDB，移除 IndexedDB 相关代码
 */
export class DatabaseManager {
  private mongodbStorageService: MongodbStorageService

  constructor() {
    // 初始化 MongoDB 存储服务
    this.mongodbStorageService = new MongodbStorageService()
  }

  // 小说存储访问器
  get novels() {
    return {
      addNovel: async (novel: Omit<Novel, 'id' | 'createdAt' | 'lastModified'>): Promise<Novel> => {
        return await this.mongodbStorageService.addNovel(novel)
      },
      updateNovel: async (novel: Novel): Promise<void> => {
        await this.mongodbStorageService.updateNovel(novel)
      },
      deleteNovel: async (id: string): Promise<void> => {
        await this.mongodbStorageService.deleteNovel(id)
      },
      getNovel: async (id: string): Promise<Novel | undefined> => {
        return await this.mongodbStorageService.getNovel(id)
      },
      getAllNovels: async (): Promise<Novel[]> => {
        return await this.mongodbStorageService.getAllNovels()
      },
      getNovelsByUserId: async (userId: string): Promise<Novel[]> => {
        // 按用户ID获取小说
        return await this.mongodbStorageService.getNovelsByUserId(userId)
      },
      searchNovels: async (filters: any): Promise<Novel[]> => {
        // 搜索小说
        return await this.mongodbStorageService.searchNovels(filters)
      }
    }
  }

  // 章节存储访问器
  get chapters() {
    return {
      addChapter: async (chapter: Omit<Chapter, 'id' | 'createdAt' | 'lastModified'>): Promise<Chapter> => {
        return await this.mongodbStorageService.addChapter(chapter)
      },
      updateChapter: async (chapter: Chapter): Promise<void> => {
        await this.mongodbStorageService.updateChapter(chapter)
      },
      deleteChapter: async (id: string): Promise<void> => {
        await this.mongodbStorageService.deleteChapter(id)
      },
      getChapter: async (id: string): Promise<Chapter | undefined> => {
        return await this.mongodbStorageService.getChapter(id)
      },
      getChaptersByNovelId: async (novelId: string): Promise<Chapter[]> => {
        return await this.mongodbStorageService.getChaptersByNovelId(novelId)
      }
    }
  }

  // 大纲存储访问器
  get outlines() {
    return {
      addOutline: async (outline: Omit<NovelOutline, 'id' | 'createdAt' | 'lastModified'>): Promise<NovelOutline> => {
        return await this.mongodbStorageService.addOutline(outline)
      },
      updateOutline: async (outline: NovelOutline): Promise<void> => {
        await this.mongodbStorageService.updateOutline(outline)
      },
      deleteOutline: async (id: string): Promise<void> => {
        await this.mongodbStorageService.deleteOutline(id)
      },
      getOutline: async (id: string): Promise<NovelOutline | undefined> => {
        return await this.mongodbStorageService.getOutline(id)
      },
      getOutlinesByNovelId: async (novelId: string): Promise<NovelOutline[]> => {
        return await this.mongodbStorageService.getOutlinesByNovelId(novelId)
      },
      batchUpdateParentIds: async (updates: { id: string; parentId: string }[]): Promise<void> => {
        // 批量更新大纲的parentId
        await this.mongodbStorageService.batchUpdateParentIds(updates)
      }
    }
  }

  // 角色存储访问器
  get characters() {
    return {
      addCharacter: async (character: Omit<Character, 'id' | 'createdAt' | 'lastModified'>): Promise<Character> => {
        return await this.mongodbStorageService.addCharacter(character)
      },
      updateCharacter: async (character: Character): Promise<void> => {
        await this.mongodbStorageService.updateCharacter(character)
      },
      deleteCharacter: async (id: string): Promise<void> => {
        await this.mongodbStorageService.deleteCharacter(id)
      },
      getCharacter: async (id: string): Promise<Character | undefined> => {
        return await this.mongodbStorageService.getCharacter(id)
      },
      getCharactersByNovelId: async (novelId: string): Promise<Character[]> => {
        return await this.mongodbStorageService.getCharactersByNovelId(novelId)
      }
    }
  }

  // 地点存储访问器
  get locations() {
    return {
      addLocation: async (location: Omit<Location, 'id' | 'createdAt' | 'lastModified'>): Promise<Location> => {
        return await this.mongodbStorageService.addLocation(location)
      },
      updateLocation: async (location: Location): Promise<void> => {
        await this.mongodbStorageService.updateLocation(location)
      },
      deleteLocation: async (id: string): Promise<void> => {
        await this.mongodbStorageService.deleteLocation(id)
      },
      getLocation: async (id: string): Promise<Location | undefined> => {
        return await this.mongodbStorageService.getLocation(id)
      },
      getLocationsByNovelId: async (novelId: string): Promise<Location[]> => {
        return await this.mongodbStorageService.getLocationsByNovelId(novelId)
      }
    }
  }

  // 世界观设定存储访问器
  get worldSettings() {
    return {
      addWorldSetting: async (
        setting: Omit<WorldSetting, 'id' | 'createdAt' | 'lastModified'>,
        type: 'culture' | 'technology' | 'magic' | 'history'
      ): Promise<WorldSetting> => {
        return await this.mongodbStorageService.addWorldSetting(type, setting)
      },
      updateWorldSetting: async (setting: WorldSetting, type: 'culture' | 'technology' | 'magic' | 'history'): Promise<void> => {
        await this.mongodbStorageService.updateWorldSetting(type, setting)
      },
      deleteWorldSetting: async (id: string, type: 'culture' | 'technology' | 'magic' | 'history'): Promise<void> => {
        await this.mongodbStorageService.deleteWorldSetting(type, id)
      },
      getWorldSetting: async (id: string, type: 'culture' | 'technology' | 'magic' | 'history'): Promise<WorldSetting | undefined> => {
        return await this.mongodbStorageService.getWorldSetting(type, id)
      },
      getWorldSettingsByNovelId: async (novelId: string, type: 'culture' | 'technology' | 'magic' | 'history'): Promise<WorldSetting[]> => {
        return await this.mongodbStorageService.getWorldSettingsByNovelId(type, novelId)
      },
      getAllData: async (type: 'culture' | 'technology' | 'magic' | 'history'): Promise<WorldSetting[]> => {
        return await this.mongodbStorageService.getAllWorldSettings(type)
      }
    }
  }

  // 统计信息存储访问器
  get stats() {
    return {
      updateStats: async (stats: WritingStats): Promise<void> => {
        await this.mongodbStorageService.updateStats(stats)
      },
      getStats: async (): Promise<WritingStats | null> => {
        return await this.mongodbStorageService.getStats()
      }
    }
  }

  // 章节版本存储访问器
  get chapterVersions() {
    return {
      addChapterVersion: async (version: Omit<ChapterVersion, 'id' | 'createdAt'>): Promise<ChapterVersion> => {
        return await this.mongodbStorageService.addChapterVersion(version)
      },
      getChapterVersions: async (chapterId: string): Promise<ChapterVersion[]> => {
        return await this.mongodbStorageService.getChapterVersions(chapterId)
      },
      deleteChapterVersion: async (id: string): Promise<void> => {
        await this.mongodbStorageService.deleteChapterVersion(id)
      }
    }
  }

  // 写作记录存储访问器
  get writingRecords() {
    return {
      addWritingRecord: async (record: Omit<WritingRecord, 'id' | 'createdAt' | 'lastModified'>): Promise<WritingRecord> => {
        return await this.mongodbStorageService.addWritingRecord(record)
      },
      updateWritingRecord: async (record: WritingRecord): Promise<void> => {
        await this.mongodbStorageService.updateWritingRecord(record)
      },
      deleteWritingRecord: async (id: string): Promise<void> => {
        await this.mongodbStorageService.deleteWritingRecord(id)
      },
      getWritingRecord: async (id: string): Promise<WritingRecord | undefined> => {
        return await this.mongodbStorageService.getWritingRecord(id)
      },
      getWritingRecordsByNovelId: async (novelId: string): Promise<WritingRecord[]> => {
        return await this.mongodbStorageService.getWritingRecordsByNovelId(novelId)
      }
    }
  }

  // 聊天记录存储访问器
  get chatHistory() {
    return {
      updateChatHistory: async (novelId: string, messages: Message[]): Promise<void> => {
        await this.mongodbStorageService.updateChatHistory(novelId, messages)
      },
      getChatHistory: async (novelId: string): Promise<ChatHistory | null> => {
        return await this.mongodbStorageService.getChatHistory(novelId)
      }
    }
  }

  // AI使用记录存储访问器
  get aiUsageHistory() {
    return {
      addAIUsageRecord: async (record: Omit<AIUsageRecord, 'id' | 'createdAt'>): Promise<AIUsageRecord> => {
        return await this.mongodbStorageService.addAIUsageRecord(record)
      },
      getAIUsageRecords: async (userId: string): Promise<AIUsageRecord[]> => {
        return await this.mongodbStorageService.getAIUsageRecords(userId)
      },
      getAIUsageRecord: async (id: string): Promise<AIUsageRecord | undefined> => {
        return await this.mongodbStorageService.getAIUsageRecord(id)
      }
    }
  }
  
  // AI模型存储访问器
  get aiModels() {
    return {
      addAIModel: async (model: Omit<AIModelRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModelRecord> => {
        return await this.mongodbStorageService.addAIModel(model)
      },
      updateAIModel: async (model: AIModelRecord): Promise<void> => {
        await this.mongodbStorageService.updateAIModel(model)
      },
      deleteAIModel: async (id: string): Promise<void> => {
        await this.mongodbStorageService.deleteAIModel(id)
      },
      getAIModel: async (id: string): Promise<AIModelRecord | undefined> => {
        return await this.mongodbStorageService.getAIModel(id)
      },
      getAllAIModels: async (): Promise<AIModelRecord[]> => {
        return await this.mongodbStorageService.getAllAIModels()
      },
      getDefaultAIModels: async (): Promise<AIModelRecord[]> => {
        return await this.mongodbStorageService.getDefaultAIModels()
      }
    }
  }
  
  // 用户成就存储访问器
  get userAchievements() {
    return {
      getByUserId: async (userId: string): Promise<any[]> => {
        return await this.mongodbStorageService.getUserAchievementsByUserId(userId)
      },
      addUserAchievement: async (data: any): Promise<any> => {
        return await this.mongodbStorageService.addUserAchievement(data)
      },
      updateUserAchievement: async (data: any): Promise<void> => {
        await this.mongodbStorageService.updateUserAchievement(data)
      }
    }
  }
  
  // 用户活动存储访问器
  get userActivities() {
    return {
      getByUserId: async (userId: string): Promise<any[]> => {
        return await this.mongodbStorageService.getUserActivitiesByUserId(userId)
      },
      addUserActivity: async (data: any): Promise<any> => {
        return await this.mongodbStorageService.addUserActivity(data)
      },
      updateUserActivity: async (data: any): Promise<void> => {
        await this.mongodbStorageService.updateUserActivity(data)
      }
    }
  }
  
  // 提示词库存储访问器
  get promptLibrary() {
    return {
      getAllCollections: async (): Promise<Collection[]> => {
        return await this.mongodbStorageService.getPromptLibraryCollections()
      },
      getCollectionById: async (id: string): Promise<Collection | undefined> => {
        return await this.mongodbStorageService.getPromptLibraryCollectionById(id)
      },
      createCollection: async (collection: Omit<Collection, 'id'>): Promise<Collection> => {
        return await this.mongodbStorageService.createPromptLibraryCollection(collection)
      },
      updateCollection: async (id: string, updateData: Partial<Collection>): Promise<Collection> => {
        return await this.mongodbStorageService.updatePromptLibraryCollection(id, updateData)
      },
      deleteCollection: async (id: string): Promise<void> => {
        await this.mongodbStorageService.deletePromptLibraryCollection(id)
      }
    }
  }
}

// 创建数据库管理器实例
export const databaseManager = new DatabaseManager()