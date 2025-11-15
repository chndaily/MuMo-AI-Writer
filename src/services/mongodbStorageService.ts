// MongoDB存储服务
import { 
  Novel, 
  Chapter, 
  NovelOutline, 
  Character, 
  Location, 
  WorldSetting, 
  WritingStats,
  ChapterVersion,
  WritingRecord
} from '#/novel'
import { apiService } from '@/services/apiService'
import { useMembershipStore } from '@/stores/membershipStore'
import { AIModelRecord } from './aiModelStore'
import { Message, ChatHistory } from './chatStore'
import { AIUsageRecord } from './aiUsageHistoryService'
import { Collection } from '#/promptLibrary'

/**
 * MongoDB存储服务
 * 提供小说创作数据的MongoDB存储操作
 * 修改为直接处理所有数据操作，而不是作为MongoDB的包装器
 */
export class MongodbStorageService {
  /**
   * 添加小说
   */
  async addNovel(novel: Omit<Novel, 'id' | 'createdAt' | 'lastModified'>): Promise<Novel> {
    try {
      return await apiService.novels.createNovel(novel);
    } catch (error) {
      console.error('添加小说失败:', error);
      throw error;
    }
  }

  /**
   * 更新小说
   */
  async updateNovel(novel: Novel): Promise<void> {
    try {
      // 使用novel.id来更新小说，API服务会处理字段映射
      await apiService.novels.updateNovel(novel.id, novel);
    } catch (error) {
      console.error('更新小说失败:', error);
      throw error;
    }
  }

  /**
   * 删除小说
   */
  async deleteNovel(id: string): Promise<void> {
    try {
      await apiService.novels.deleteNovel(id);
    } catch (error) {
      console.error('删除小说失败:', error);
      throw error;
    }
  }

  /**
   * 获取小说
   */
  async getNovel(id: string): Promise<Novel | undefined> {
    try {
      const novel = await apiService.novels.getNovelById(id);
      return novel;
    } catch (error) {
      console.error('获取小说失败:', error);
      return undefined;
    }
  }

  /**
   * 获取所有小说
   */
  async getAllNovels(): Promise<Novel[]> {
    try {
      return await apiService.novels.getAllNovels();
    } catch (error) {
      console.error('获取所有小说失败:', error);
      return [];
    }
  }

  /**
   * 根据用户ID获取小说 (修改为使用userId字段)
   */
  async getNovelsByUserId(userId: string): Promise<Novel[]> {
    try {
      console.log('获取小说，用户ID:', userId);
      return await apiService.novels.getCurrentUserNovels(userId);
    } catch (error) {
      console.error('根据用户ID获取小说失败:', error);
      return [];
    }
  }

  /**
   * 搜索小说
   */
  async searchNovels(filters: any): Promise<Novel[]> {
    try {
      // 简化实现，实际应用中可能需要更复杂的搜索逻辑
      const allNovels = await this.getAllNovels();
      // 这里只是一个示例实现，实际应用中需要根据filters进行过滤
      return allNovels;
    } catch (error) {
      console.error('搜索小说失败:', error);
      return [];
    }
  }

  /**
   * 添加章节
   */
  async addChapter(chapter: Omit<Chapter, 'id' | 'createdAt' | 'lastModified'>): Promise<Chapter> {
    try {
      return await apiService.chapters.createChapter(chapter);
    } catch (error) {
      console.error('添加章节失败:', error);
      throw error;
    }
  }

  /**
   * 更新章节
   */
  async updateChapter(chapter: Chapter): Promise<void> {
    try {
      await apiService.chapters.updateChapter(chapter.id, chapter);
    } catch (error) {
      console.error('更新章节失败:', error);
      throw error;
    }
  }

  /**
   * 删除章节
   */
  async deleteChapter(id: string): Promise<void> {
    try {
      await apiService.chapters.deleteChapter(id);
    } catch (error) {
      console.error('删除章节失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取章节
   */
  async getChapter(id: string): Promise<Chapter | undefined> {
    try {
      return await apiService.chapters.getChapterById(id);
    } catch (error) {
      console.error('获取章节失败:', error);
      return undefined;
    }
  }

  /**
   * 根据小说ID获取章节
   */
  async getChaptersByNovelId(novelId: string): Promise<Chapter[]> {
    try {
      return await apiService.chapters.getChaptersByNovelId(novelId);
    } catch (error) {
      console.error('根据小说ID获取章节失败:', error);
      return [];
    }
  }

  /**
   * 添加大纲
   */
  async addOutline(outline: Omit<NovelOutline, 'id' | 'createdAt' | 'lastModified'>): Promise<NovelOutline> {
    try {
      return await apiService.outlines.createOutline(outline);
    } catch (error) {
      console.error('添加大纲失败:', error);
      throw error;
    }
  }

  /**
   * 更新大纲
   */
  async updateOutline(outline: NovelOutline): Promise<void> {
    try {
      await apiService.outlines.updateOutline(outline.id, outline);
    } catch (error) {
      console.error('更新大纲失败:', error);
      throw error;
    }
  }

  /**
   * 删除大纲
   */
  async deleteOutline(id: string): Promise<void> {
    try {
      await apiService.outlines.deleteOutline(id);
    } catch (error) {
      console.error('删除大纲失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取大纲
   */
  async getOutline(id: string): Promise<NovelOutline | undefined> {
    try {
      return await apiService.outlines.getOutlineById(id);
    } catch (error) {
      console.error('获取大纲失败:', error);
      return undefined;
    }
  }

  /**
   * 根据小说ID获取大纲
   */
  async getOutlinesByNovelId(novelId: string): Promise<NovelOutline[]> {
    try {
      return await apiService.outlines.getOutlinesByNovelId(novelId);
    } catch (error) {
      console.error('根据小说ID获取大纲失败:', error);
      return [];
    }
  }

  /**
   * 部分更新大纲（只更新指定的字段）
   */
  async updateOutlinePartial(id: string, updates: Partial<NovelOutline>): Promise<void> {
    try {
      await apiService.outlines.updateOutline(id, updates);
    } catch (error) {
      console.error('部分更新大纲失败:', error);
      throw error;
    }
  }

  /**
   * 批量更新大纲的parentId
   */
  async batchUpdateParentIds(updates: { id: string; parentId: string }[]): Promise<void> {
    try {
      // 批量更新大纲的parentId
      const promises = updates.map(update => 
        this.updateOutlinePartial(update.id, { parentId: update.parentId })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('批量更新大纲parentId失败:', error);
      throw error;
    }
  }

  /**
   * 添加角色
   */
  async addCharacter(character: Omit<Character, 'id' | 'createdAt' | 'lastModified'>): Promise<Character> {
    try {
      // 确保不传递ID字段，让后端生成
      const { id, _id, ...characterWithoutId } = character as any;
      return await apiService.characters.createCharacter(characterWithoutId);
    } catch (error) {
      console.error('添加角色失败:', error);
      throw error;
    }
  }

  /**
   * 更新角色
   */
  async updateCharacter(character: Character): Promise<void> {
    try {
      await apiService.characters.updateCharacter(character.id, character);
    } catch (error) {
      console.error('更新角色失败:', error);
      throw error;
    }
  }

  /**
   * 删除角色
   */
  async deleteCharacter(id: string): Promise<void> {
    try {
      await apiService.characters.deleteCharacter(id);
    } catch (error) {
      console.error('删除角色失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取角色
   */
  async getCharacter(id: string): Promise<Character | undefined> {
    try {
      return await apiService.characters.getCharacterById(id);
    } catch (error) {
      console.error('获取角色失败:', error);
      return undefined;
    }
  }

  /**
   * 根据小说ID获取角色
   */
  async getCharactersByNovelId(novelId: string): Promise<Character[]> {
    try {
      // 检查认证状态
      const { isAuthenticated, authToken } = useMembershipStore.getState();
      if (!isAuthenticated || !authToken) {
        console.warn('用户未认证，无法获取角色数据');
        return [];
      }
      return await apiService.characters.getCharactersByNovelId(novelId);
    } catch (error) {
      console.error('根据小说ID获取角色失败:', error);
      return [];
    }
  }

  /**
   * 添加地点
   */
  async addLocation(location: Omit<Location, 'id' | 'createdAt' | 'lastModified'>): Promise<Location> {
    try {
      return await apiService.locations.createLocation(location);
    } catch (error) {
      console.error('添加地点失败:', error);
      throw error;
    }
  }

  /**
   * 更新地点
   */
  async updateLocation(location: Location): Promise<void> {
    try {
      await apiService.locations.updateLocation(location.id, location);
    } catch (error) {
      console.error('更新地点失败:', error);
      throw error;
    }
  }

  /**
   * 删除地点
   */
  async deleteLocation(id: string): Promise<void> {
    try {
      await apiService.locations.deleteLocation(id);
    } catch (error) {
      console.error('删除地点失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取地点
   */
  async getLocation(id: string): Promise<Location | undefined> {
    try {
      return await apiService.locations.getLocationById(id);
    } catch (error) {
      console.error('获取地点失败:', error);
      return undefined;
    }
  }

  /**
   * 根据小说ID获取地点
   */
  async getLocationsByNovelId(novelId: string): Promise<Location[]> {
    try {
      // 检查认证状态
      const { isAuthenticated, authToken } = useMembershipStore.getState();
      if (!isAuthenticated || !authToken) {
        console.warn('用户未认证，无法获取地点数据');
        return [];
      }
      return await apiService.locations.getLocationsByNovelId(novelId);
    } catch (error) {
      console.error('根据小说ID获取地点失败:', error);
      return [];
    }
  }

  /**
   * 添加世界观设定
   */
  async addWorldSetting(type: 'culture' | 'technology' | 'magic' | 'history', setting: Omit<WorldSetting, 'id' | 'createdAt' | 'lastModified'>): Promise<WorldSetting> {
    try {
      return await apiService.worldSettings.createWorldSetting(setting);
    } catch (error) {
      console.error('添加世界观设定失败:', error);
      throw error;
    }
  }

  /**
   * 更新世界观设定
   */
  async updateWorldSetting(type: 'culture' | 'technology' | 'magic' | 'history', setting: WorldSetting): Promise<void> {
    try {
      await apiService.worldSettings.updateWorldSetting(setting.id, setting);
    } catch (error) {
      console.error('更新世界观设定失败:', error);
      throw error;
    }
  }

  /**
   * 删除世界观设定
   */
  async deleteWorldSetting(type: 'culture' | 'technology' | 'magic' | 'history', id: string): Promise<void> {
    try {
      await apiService.worldSettings.deleteWorldSetting(id);
    } catch (error) {
      console.error('删除世界观设定失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取世界观设定
   */
  async getWorldSetting(type: 'culture' | 'technology' | 'magic' | 'history', id: string): Promise<WorldSetting | undefined> {
    try {
      return await apiService.worldSettings.getWorldSettingById(id);
    } catch (error) {
      console.error('获取世界观设定失败:', error);
      return undefined;
    }
  }

  /**
   * 根据小说ID获取世界观设定
   */
  async getWorldSettingsByNovelId(type: 'culture' | 'technology' | 'magic' | 'history' | 'character', novelId: string): Promise<WorldSetting[]> {
    try {
      return await apiService.worldSettings.getWorldSettingsByNovelId(novelId, type);
    } catch (error) {
      console.error('根据小说ID获取世界观设定失败:', error);
      return [];
    }
  }

  /**
   * 获取所有世界观设定
   */
  async getAllWorldSettings(type: 'culture' | 'technology' | 'magic' | 'history' | 'character'): Promise<WorldSetting[]> {
    try {
      // 这里需要一个获取所有世界观设定的API，暂时返回空数组
      return [];
    } catch (error) {
      console.error('获取所有世界观设定失败:', error);
      return [];
    }
  }

  /**
   * 更新统计信息
   */
  async updateStats(stats: WritingStats): Promise<void> {
    try {
      await apiService.stats.updateStats(stats);
    } catch (error) {
      console.error('更新统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<WritingStats | null> {
    try {
      return await apiService.stats.getStats();
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return null;
    }
  }

  /**
   * 获取章节版本
   */
  async getChapterVersions(chapterId: string): Promise<ChapterVersion[]> {
    try {
      return await apiService.chapterVersions.getChapterVersions(chapterId);
    } catch (error) {
      console.error('获取章节版本失败:', error);
      return [];
    }
  }

  /**
   * 添加章节版本
   */
  async addChapterVersion(version: Omit<ChapterVersion, 'id' | 'createdAt'>): Promise<ChapterVersion> {
    try {
      return await apiService.chapterVersions.createChapterVersion(version);
    } catch (error) {
      console.error('添加章节版本失败:', error);
      throw error;
    }
  }

  /**
   * 删除章节版本
   */
  async deleteChapterVersion(id: string): Promise<void> {
    try {
      await apiService.chapterVersions.deleteChapterVersion(id);
    } catch (error) {
      console.error('删除章节版本失败:', error);
      throw error;
    }
  }

  /**
   * 添加写作记录
   */
  async addWritingRecord(record: Omit<WritingRecord, 'id' | 'createdAt' | 'lastModified'>): Promise<WritingRecord> {
    try {
      return await apiService.writingRecords.createWritingRecord(record);
    } catch (error) {
      console.error('添加写作记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新写作记录
   */
  async updateWritingRecord(record: WritingRecord): Promise<void> {
    try {
      await apiService.writingRecords.updateWritingRecord(record.id, record);
    } catch (error) {
      console.error('更新写作记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除写作记录
   */
  async deleteWritingRecord(id: string): Promise<void> {
    try {
      await apiService.writingRecords.deleteWritingRecord(id);
    } catch (error) {
      console.error('删除写作记录失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取写作记录
   */
  async getWritingRecord(id: string): Promise<WritingRecord | undefined> {
    try {
      return await apiService.writingRecords.getWritingRecordById(id);
    } catch (error) {
      console.error('获取写作记录失败:', error);
      return undefined;
    }
  }

  /**
   * 根据小说ID获取写作记录
   */
  async getWritingRecordsByNovelId(novelId: string): Promise<WritingRecord[]> {
    try {
      return await apiService.writingRecords.getWritingRecordsByNovelId(novelId);
    } catch (error) {
      console.error('根据小说ID获取写作记录失败:', error);
      return [];
    }
  }

  /**
   * 更新聊天历史
   */
  async updateChatHistory(novelId: string, messages: Message[]): Promise<void> {
    try {
      await apiService.chatHistory.updateChatHistory(novelId, messages);
    } catch (error) {
      console.error('更新聊天历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取聊天历史
   */
  async getChatHistory(novelId: string): Promise<ChatHistory | null> {
    try {
      return await apiService.chatHistory.getChatHistory(novelId);
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      return null;
    }
  }

  /**
   * 添加AI使用记录
   */
  async addAIUsageRecord(record: Omit<AIUsageRecord, 'id' | 'createdAt'>): Promise<AIUsageRecord> {
    try {
      // 实现AI使用记录的添加逻辑
      const fullRecord = {
        ...record,
        id: `ai_usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };
      
      // 这里应该调用实际的API来保存记录
      // 暂时返回记录对象，表示成功
      console.log('AI使用记录已保存:', fullRecord);
      return fullRecord as AIUsageRecord;
    } catch (error) {
      console.error('添加AI使用记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取AI使用记录
   */
  async getAIUsageRecords(userId: string): Promise<AIUsageRecord[]> {
    try {
      // 实现获取AI使用记录的逻辑
      // 暂时返回空数组，表示没有记录
      console.log('获取AI使用记录，用户ID:', userId);
      return [];
    } catch (error) {
      console.error('获取AI使用记录失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取AI使用记录
   */
  async getAIUsageRecord(id: string): Promise<AIUsageRecord | undefined> {
    try {
      // 实现根据ID获取AI使用记录的逻辑
      // 暂时返回undefined，表示未找到记录
      console.log('根据ID获取AI使用记录:', id);
      return undefined;
    } catch (error) {
      console.error('根据ID获取AI使用记录失败:', error);
      return undefined;
    }
  }

  /**
   * 添加AI模型
   */
  async addAIModel(model: Omit<AIModelRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIModelRecord> {
    try {
      return await apiService.aiModels.createAIModel(model);
    } catch (error) {
      console.error('添加AI模型失败:', error);
      throw error;
    }
  }

  /**
   * 更新AI模型
   */
  async updateAIModel(model: AIModelRecord): Promise<void> {
    try {
      await apiService.aiModels.updateAIModel(model.id, model);
    } catch (error) {
      console.error('更新AI模型失败:', error);
      throw error;
    }
  }

  /**
   * 删除AI模型
   */
  async deleteAIModel(id: string): Promise<void> {
    try {
      console.log('Attempting to delete AI model with ID:', id);
      await apiService.aiModels.deleteAIModel(id);
      console.log('AI model deleted successfully via API');
    } catch (error) {
      console.error('删除AI模型失败:', error);
      // 重新抛出错误，让调用者能够正确处理
      throw error;
    }
  }

  /**
   * 获取AI模型
   */
  async getAIModel(id: string): Promise<AIModelRecord | undefined> {
    try {
      return await apiService.aiModels.getAIModelById(id);
    } catch (error) {
      console.error('获取AI模型失败:', error);
      return undefined;
    }
  }

  /**
   * 获取所有AI模型
   */
  async getAllAIModels(): Promise<AIModelRecord[]> {
    try {
      return await apiService.aiModels.getAllAIModels();
    } catch (error) {
      console.error('获取所有AI模型失败:', error);
      return [];
    }
  }

  /**
   * 获取默认AI模型
   */
  async getDefaultAIModels(): Promise<AIModelRecord[]> {
    try {
      return await apiService.aiModels.getDefaultAIModels();
    } catch (error) {
      console.error('获取默认AI模型失败:', error);
      return [];
    }
  }

  /**
   * 根据用户ID获取成就数据
   */
  async getUserAchievementsByUserId(userId: string): Promise<any[]> {
    try {
      return await apiService.userAchievements.getByUserId(userId);
    } catch (error) {
      console.error('根据用户ID获取成就数据失败:', error);
      return [];
    }
  }

  /**
   * 添加用户成就数据
   */
  async addUserAchievement(data: any): Promise<any> {
    try {
      return await apiService.userAchievements.create(data);
    } catch (error) {
      console.error('添加用户成就数据失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户成就数据
   */
  async updateUserAchievement(data: any): Promise<void> {
    try {
      await apiService.userAchievements.update(data.id, data);
    } catch (error) {
      console.error('更新用户成就数据失败:', error);
      throw error;
    }
  }

  /**
   * 添加用户活动数据
   */
  async addUserActivity(data: any): Promise<any> {
    try {
      return await apiService.userActivities.create(data);
    } catch (error) {
      console.error('添加用户活动数据失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户活动数据
   */
  async updateUserActivity(data: any): Promise<void> {
    try {
      await apiService.userActivities.update(data.id, data);
    } catch (error) {
      console.error('更新用户活动数据失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户ID获取活动数据
   */
  async getUserActivitiesByUserId(userId: string): Promise<any[]> {
    try {
      return await apiService.userActivities.getByUserId(userId);
    } catch (error) {
      console.error('根据用户ID获取活动数据失败:', error);
      return [];
    }
  }

  /**
   * 提示词库相关方法
   */
  // 获取所有提示词库集合
  async getPromptLibraryCollections(): Promise<Collection[]> {
    try {
      const collections = await apiService.promptLibrary.getAllCollections();
      // 确保返回的集合不包含undefined或null值
      return collections.filter(collection => collection !== undefined && collection !== null);
    } catch (error) {
      console.error('获取提示词库集合失败:', error);
      return [];
    }
  }

  // 根据ID获取提示词库集合
  async getPromptLibraryCollectionById(id: string): Promise<Collection | undefined> {
    try {
      const collection = await apiService.promptLibrary.getCollectionById(id);
      // 确保返回的集合不为undefined或null
      return collection !== undefined && collection !== null ? collection : undefined;
    } catch (error) {
      console.error('根据ID获取提示词库集合失败:', error);
      return undefined;
    }
  }

  // 创建提示词库集合
  async createPromptLibraryCollection(collectionData: Omit<Collection, 'id'>): Promise<Collection> {
    try {
      return await apiService.promptLibrary.createCollection(collectionData);
    } catch (error) {
      console.error('创建提示词库集合失败:', error);
      throw error;
    }
  }

  // 更新提示词库集合
  async updatePromptLibraryCollection(id: string, updateData: Partial<Collection>): Promise<Collection> {
    try {
      return await apiService.promptLibrary.updateCollection(id, updateData);
    } catch (error) {
      console.error('更新提示词库集合失败:', error);
      throw error;
    }
  }

  // 删除提示词库集合
  async deletePromptLibraryCollection(id: string): Promise<void> {
    try {
      await apiService.promptLibrary.deleteCollection(id);
    } catch (error) {
      console.error('删除提示词库集合失败:', error);
      throw error;
    }
  }
}

// 创建MongoDB存储服务实例
export const mongodbStorageService = new MongodbStorageService();
