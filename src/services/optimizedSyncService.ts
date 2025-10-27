import { databaseManager } from '@/services/index';
import { hybridStorageService } from '@/services/hybridStorageService';
import { Novel, Character, Location, NovelOutline, WorldSetting } from '#/novel';
import { apiService } from '@/services/apiService';

/**
 * 优化的数据同步服务
 * 提供更高效的批量操作和智能缓存机制
 */
class OptimizedSyncService {
  // 请求缓存
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存时间

  // 批次大小配置
  private batchSize = 50;
  private maxRetries = 3;

  /**
   * 动态调整批次大小
   */
  setBatchSize(size: number): void {
    this.batchSize = Math.max(10, Math.min(200, size)); // 限制在10-200之间
  }

  /**
   * 带缓存的API请求
   */
  private async cachedApiRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const cached = this.requestCache.get(key);
    const now = Date.now();

    // 检查缓存是否有效
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      console.log(`返回缓存数据: ${key}`);
      return cached.data;
    }

    // 执行请求并缓存结果
    try {
      const data = await requestFn();
      this.requestCache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // 如果请求失败但有缓存数据，返回缓存数据
      if (cached) {
        console.warn(`API请求失败，使用缓存数据: ${key}`, error);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * 带重试机制的API调用
   */
  private async retryableApiCall<T>(call: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (retries > 0) {
        console.warn(`API调用失败，${retries}次重试机会`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (this.maxRetries - retries + 1))); // 递增延迟
        return this.retryableApiCall(call, retries - 1);
      }
      throw error;
    }
  }

  /**
   * 批量保存小说（优化版本）
   */
  async batchSaveNovels(novels: Novel[]): Promise<void> {
    console.log(`开始批量保存 ${novels.length} 本小说`);

    // 分批处理
    for (let i = 0; i < novels.length; i += this.batchSize) {
      const batch = novels.slice(i, i + this.batchSize);
      console.log(`处理批次 ${Math.floor(i/this.batchSize) + 1}/${Math.ceil(novels.length/this.batchSize)}`);

      // 并行保存到本地
      const localSavePromises = batch.map(novel => 
        databaseManager.novels.addNovel(novel)
      );
      
      try {
        await Promise.all(localSavePromises);
        console.log(`本地保存批次 ${Math.floor(i/this.batchSize) + 1} 完成`);
      } catch (error) {
        console.error(`本地保存批次 ${Math.floor(i/this.batchSize) + 1} 失败:`, error);
      }

      // 批量同步到云端（带重试机制）
      try {
        await this.retryableApiCall(async () => {
          const syncPromises = batch.map(novel => 
            apiService.novels.createNovel({
              title: novel.title,
              content: novel.content,
              genre: novel.genre,
              wordCount: novel.wordCount,
              progress: novel.progress,
              status: novel.status,
              description: novel.description,
              tags: novel.tags,
              coverImage: novel.coverImage,
              author: novel.author,
              targetWordCount: novel.targetWordCount,
              isPublic: novel.isPublic
            })
          );
          return Promise.all(syncPromises);
        });
        console.log(`云端同步批次 ${Math.floor(i/this.batchSize) + 1} 完成`);
      } catch (error) {
        console.error(`云端同步批次 ${Math.floor(i/this.batchSize) + 1} 失败:`, error);
      }
    }
  }

  /**
   * 批量保存角色（优化版本）
   */
  async batchSaveCharacters(characters: Character[]): Promise<void> {
    console.log(`开始批量保存 ${characters.length} 个角色`);

    // 分批处理
    for (let i = 0; i < characters.length; i += this.batchSize) {
      const batch = characters.slice(i, i + this.batchSize);
      
      // 并行保存到本地
      const localSavePromises = batch.map(character => 
        databaseManager.characters.addCharacter(character)
      );
      
      try {
        await Promise.all(localSavePromises);
      } catch (error) {
        console.error(`本地保存角色批次失败:`, error);
      }

      // 批量同步到云端
      try {
        await this.retryableApiCall(async () => {
          const syncPromises = batch.map(character => 
            apiService.characters.createCharacter({
              novelId: character.novelId,
              name: character.name,
              description: character.description,
              role: character.role,
              appearance: character.appearance,
              personality: character.personality,
              background: character.background,
              relationships: character.relationships,
              abilities: character.abilities,
              characterArc: character.characterArc,
              details: character.details,
              tags: character.tags,
              professionTags: character.professionTags,
              personalityTags: character.personalityTags,
              functionTags: character.functionTags
            })
          );
          return Promise.all(syncPromises);
        });
      } catch (error) {
        console.error(`云端同步角色批次失败:`, error);
      }
    }
  }

  /**
   * 批量保存地点（优化版本）
   */
  async batchSaveLocations(locations: Location[]): Promise<void> {
    console.log(`开始批量保存 ${locations.length} 个地点`);

    // 分批处理
    for (let i = 0; i < locations.length; i += this.batchSize) {
      const batch = locations.slice(i, i + this.batchSize);
      
      // 并行保存到本地
      const localSavePromises = batch.map(location => 
        databaseManager.locations.addLocation(location)
      );
      
      try {
        await Promise.all(localSavePromises);
      } catch (error) {
        console.error(`本地保存地点批次失败:`, error);
      }

      // 批量同步到云端
      try {
        await this.retryableApiCall(async () => {
          const syncPromises = batch.map(location => 
            apiService.locations.createLocation({
              novelId: location.novelId,
              name: location.name,
              description: location.description,
              type: location.type,
              importance: location.importance,
              geography: location.geography,
              climate: location.climate,
              terrain: location.terrain,
              naturalResources: location.naturalResources,
              ecosystem: location.ecosystem,
              architecture: location.architecture,
              socialStructure: location.socialStructure,
              culture: location.culture,
              historyBackground: location.historyBackground,
              politics: location.politics,
              governance: location.governance,
              laws: location.laws,
              economy: location.economy,
              mainIndustries: location.mainIndustries,
              trade: location.trade,
              wealth: location.wealth,
              details: location.details,
              tags: location.tags,
              locationType: location.locationType
            })
          );
          return Promise.all(syncPromises);
        });
      } catch (error) {
        console.error(`云端同步地点批次失败:`, error);
      }
    }
  }

  /**
   * 批量保存大纲（优化版本）
   */
  async batchSaveOutlines(outlines: NovelOutline[]): Promise<void> {
    console.log(`开始批量保存 ${outlines.length} 个大纲`);

    // 分批处理
    for (let i = 0; i < outlines.length; i += this.batchSize) {
      const batch = outlines.slice(i, i + this.batchSize);
      
      // 并行保存到本地
      const localSavePromises = batch.map(outline => 
        databaseManager.outlines.addOutline(outline)
      );
      
      try {
        await Promise.all(localSavePromises);
      } catch (error) {
        console.error(`本地保存大纲批次失败:`, error);
      }

      // 批量同步到云端
      try {
        await this.retryableApiCall(async () => {
          const syncPromises = batch.map(outline => 
            apiService.outlines.createOutline({
              novelId: outline.novelId,
              title: outline.title,
              content: outline.content,
              type: outline.type,
              order: outline.order,
              parentId: outline.parentId,
              summary: outline.summary
            })
          );
          return Promise.all(syncPromises);
        });
      } catch (error) {
        console.error(`云端同步大纲批次失败:`, error);
      }
    }
  }

  /**
   * 获取小说列表（带缓存优化）
   */
  async getNovels(): Promise<Novel[]> {
    return this.cachedApiRequest('novels', () => apiService.novels.getAllNovels());
  }

  /**
   * 根据ID获取小说（带缓存优化）
   */
  async getNovelById(id: string): Promise<Novel | undefined> {
    return this.cachedApiRequest(`novel_${id}`, () => apiService.novels.getNovelById(id));
  }

  /**
   * 获取角色列表（带缓存优化）
   */
  async getCharactersByNovelId(novelId: string): Promise<Character[]> {
    return this.cachedApiRequest(`characters_${novelId}`, () => 
      apiService.characters.getCharactersByNovelId(novelId)
    );
  }

  /**
   * 获取地点列表（带缓存优化）
   */
  async getLocationsByNovelId(novelId: string): Promise<Location[]> {
    return this.cachedApiRequest(`locations_${novelId}`, () => 
      apiService.locations.getLocationsByNovelId(novelId)
    );
  }

  /**
   * 获取大纲列表（带缓存优化）
   */
  async getOutlinesByNovelId(novelId: string): Promise<NovelOutline[]> {
    return this.cachedApiRequest(`outlines_${novelId}`, () => 
      apiService.outlines.getOutlinesByNovelId(novelId)
    );
  }

  /**
   * 清理过期缓存
   */
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.requestCache.entries()) {
      if ((now - value.timestamp) >= this.CACHE_TTL) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.requestCache.clear();
  }
}

// 导出优化后的同步服务实例
export const optimizedSyncService = new OptimizedSyncService();