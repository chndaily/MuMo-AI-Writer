import { databaseManager } from '@/services';
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore';
import { Novel, Character, NovelOutline, Location, ChapterVersion, WritingRecord } from '#/novel';
import { Message } from './chatStore';
import { WorldSettingType, WorldSetting } from '@/types/ai-generation';

/**
 * 混合存储服务
 * 优先使用本地IndexedDB，如果启用了Supabase则自动同步到云端
 */
class HybridStorageService {
  private supabaseStore = useSupabaseConfigStore;

  /**
   * 保存小说
   */
  async saveNovel(novel: Novel): Promise<void> {
    // 1. 先保存到本地IndexedDB
    await databaseManager.novels.addNovel(novel);
    
    // 2. 如果启用了Supabase，同步到云端
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('novels')
          .upsert({
            id: novel.id,
            title: novel.title,
            content: novel.content,
            genre: novel.genre,
            word_count: novel.wordCount,
            progress: novel.progress,
            status: novel.status,
            description: novel.description,
            tags: novel.tags,
            cover_image: novel.coverImage,
            author: novel.author,
            target_word_count: novel.targetWordCount,
            is_public: novel.isPublic,
            created_at: novel.createdAt,
            last_modified: novel.lastModified
          });
      } catch (error) {
        console.error('同步小说到云端失败:', error);
        // 不抛出错误，保证本地存储成功
      }
    }
  }

  /**
   * 更新小说
   */
  async updateNovel(novel: Novel): Promise<void> {
    // 更新最后修改时间
    novel.lastModified = new Date().toISOString();
    
    // 1. 更新本地数据
    await databaseManager.novels.updateNovel(novel);
    
    // 2. 同步到云端
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('novels')
          .upsert({
            id: novel.id,
            title: novel.title,
            content: novel.content,
            genre: novel.genre,
            word_count: novel.wordCount,
            progress: novel.progress,
            status: novel.status,
            description: novel.description,
            tags: novel.tags,
            cover_image: novel.coverImage,
            author: novel.author,
            target_word_count: novel.targetWordCount,
            is_public: novel.isPublic,
            created_at: novel.createdAt,
            last_modified: novel.lastModified
          });
      } catch (error) {
        console.error('同步小说更新到云端失败:', error);
      }
    }
  }

  /**
   * 删除小说
   */
  async deleteNovel(novelId: string): Promise<void> {
    // 1. 删除本地数据
    await databaseManager.novels.deleteNovel(novelId);
    
    // 2. 删除云端数据
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('novels')
          .delete()
          .eq('id', novelId);
      } catch (error) {
        console.error('删除云端小说失败:', error);
      }
    }
  }

  /**
   * 获取小说列表
   */
  async getNovels(): Promise<Novel[]> {
    // 优先从本地获取
    return await databaseManager.novels.getAllNovels();
  }

  /**
   * 保存角色
   */
  async saveCharacter(character: Character): Promise<void> {
    // 1. 保存到本地
    await databaseManager.characters.addCharacter(character);
    
    // 2. 同步到云端
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('characters')
          .upsert({
            id: character.id,
            novel_id: character.novelId,
            name: character.name,
            description: character.description,
            role: character.role,
            appearance: character.appearance,
            personality: character.personality,
            background: character.background,
            relationships: character.relationships,
            created_at: character.createdAt,
            last_modified: character.lastModified || character.createdAt
          });
      } catch (error) {
        console.error('同步角色到云端失败:', error);
      }
    }
  }

  /**
   * 更新角色
   */
  async updateCharacter(character: Character): Promise<void> {
    character.lastModified = new Date().toISOString();
    
    await databaseManager.characters.updateCharacter(character);
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('characters')
          .upsert({
            id: character.id,
            novel_id: character.novelId,
            name: character.name,
            description: character.description,
            role: character.role,
            appearance: character.appearance,
            personality: character.personality,
            background: character.background,
            relationships: character.relationships,
            created_at: character.createdAt,
            last_modified: character.lastModified
          });
      } catch (error) {
        console.error('同步角色更新到云端失败:', error);
      }
    }
  }

  /**
   * 删除角色
   */
  async deleteCharacter(characterId: string): Promise<void> {
    await databaseManager.characters.deleteCharacter(characterId);
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('characters')
          .delete()
          .eq('id', characterId);
      } catch (error) {
        console.error('删除云端角色失败:', error);
      }
    }
  }

  /**
   * 获取角色列表
   */
  async getCharacters(novelId?: string): Promise<Character[]> {
    const characters = await databaseManager.characters.getCharactersByNovelId(novelId);
    return novelId ? characters.filter(c => c.novelId === novelId) : characters;
  }

  /**
   * 保存大纲
   */
  async saveOutline(outline: NovelOutline): Promise<void> {
    // 使用正确的addOutline方法，确保ID由数据库层生成
    await databaseManager.outlines.addOutline(outline);
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('outlines')
          .upsert({
            id: outline.id,
            novel_id: outline.novelId,
            title: outline.title,
            content: outline.content,
            type: outline.type,
            order: outline.order,
            parent_id: outline.parentId,
            created_at: outline.createdAt,
            last_modified: outline.lastModified
          });
      } catch (error) {
        console.error('同步大纲到云端失败:', error);
      }
    }
  }

  /**
   * 更新大纲
   */
  async updateOutline(outline: NovelOutline): Promise<void> {
    console.log('hybridStorageService.updateOutline 调用:', outline);
    // 确保更新最后修改时间
    outline.lastModified = new Date().toISOString();
    
    // 使用正确的updateOutline方法
    await databaseManager.outlines.updateOutline(outline);
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('outlines')
          .upsert({
            id: outline.id,
            novel_id: outline.novelId,
            title: outline.title,
            content: outline.content,
            type: outline.type,
            order: outline.order,
            parent_id: outline.parentId,
            created_at: outline.createdAt,
            last_modified: outline.lastModified
          });
      } catch (error) {
        console.error('同步大纲更新到云端失败:', error);
      }
    }
  }

   /**
   * 批量更新大纲的parentId（带进度提示和性能优化）
   */
  async batchUpdateOutlinesParentId(
    updates: { id: string; parentId: string }[], 
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    const total = updates.length;
    let completed = 0;
    
    // 分批处理，每批100个
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      // 批量更新本地数据
      await databaseManager.outlines.batchUpdateParentIds(batch);
      
      // 如果启用了Supabase，同步到云端
      const { client, isEnabled } = this.supabaseStore.getState()
      if (isEnabled && client) {
        try {
          // 批量更新云端数据
          const cloudUpdates = batch.map(update => ({
            id: update.id,
            parent_id: update.parentId,
            last_modified: new Date().toISOString()
          }));
          
          // 使用批量upsert操作
          await client
            .from('outlines')
            .upsert(cloudUpdates);
        } catch (error) {
          console.error('批量同步大纲更新到云端失败:', error)
        }
      }
      
      // 更新进度
      completed += batch.length;
      if (onProgress) {
        onProgress(completed, total);
      }
    }
  }

  /**
   * 删除大纲
   */
  async deleteOutline(outlineId: string): Promise<void> {
    await databaseManager.outlines.deleteOutline(outlineId);
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('outlines')
          .delete()
          .eq('id', outlineId);
      } catch (error) {
        console.error('删除云端大纲失败:', error);
      }
    }
  }

  /**
   * 获取单个大纲
   */
  async getOutline(outlineId: string): Promise<NovelOutline | undefined> {
    return await databaseManager.outlines.getOutline(outlineId);
  }

  /**
   * 获取大纲列表
   */
  async getOutlines(novelId?: string): Promise<NovelOutline[]> {
    if (novelId) {
      // 如果提供了novelId，使用索引查询以提高性能
      return await databaseManager.outlines.getOutlinesByNovelId(novelId);
    } else {
      // 如果没有提供novelId，应该获取所有数据
      // 但当前实现中databaseManager.outlines.getOutlinesByNovelId不支持无参数调用
      // 我们需要获取所有小说的ID，然后获取所有大纲
      try {
        // 获取所有小说
        const novels = await databaseManager.novels.getAllNovels();
        // 获取所有小说的大纲
        const allOutlines: NovelOutline[] = [];
        for (const novel of novels) {
          const outlines = await databaseManager.outlines.getOutlinesByNovelId(novel.id);
          allOutlines.push(...outlines);
        }
        return allOutlines;
      } catch (error) {
        console.error('获取所有大纲失败:', error);
        return [];
      }
    }
  }

  /**
   * 检查网络状态并尝试同步
   */
  async syncIfOnline(): Promise<void> {
    if (navigator.onLine) {
      const { isEnabled, syncData } = this.supabaseStore.getState();
      if (isEnabled) {
        try {
          await syncData();
        } catch (error) {
          console.error('在线同步失败:', error);
        }
      }
    }
  }

  /**
   * 强制同步所有数据
   */
  async forcSync(): Promise<void> {
    const { isEnabled, syncData } = this.supabaseStore.getState();
    if (isEnabled) {
      await syncData();
    }
  }

  /**
   * 保存地点
   */
  async saveLocation(location: Location): Promise<void> {
    // 1. 保存到本地
    await databaseManager.locations.addLocation(location);
    
    // 2. 同步到云端
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('locations')
          .upsert({
            id: location.id,
            novel_id: location.novelId,
            name: location.name,
            description: location.description,
            type: location.type,
            importance: location.importance,
            geography: location.geography,
            climate: location.climate,
            terrain: location.terrain,
            natural_resources: location.naturalResources,
            ecosystem: location.ecosystem,
            architecture: location.architecture,
            social_structure: location.socialStructure,
            culture: location.culture,
            history_background: location.historyBackground,
            politics: location.politics,
            governance: location.governance,
            laws: location.laws,
            economy: location.economy,
            main_industries: location.mainIndustries,
            trade: location.trade,
            wealth: location.wealth,
            tags: location.tags || [],
            created_at: location.createdAt,
            last_modified: location.lastModified || location.createdAt
          });
      } catch (error) {
        console.error('同步地点到云端失败:', error);
      }
    }
  }

  /**
   * 更新地点
   */
  async updateLocation(location: Location): Promise<void> {
    location.lastModified = new Date().toISOString();
    
    await databaseManager.locations.updateLocation(location);
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('locations')
          .upsert({
            id: location.id,
            novel_id: location.novelId,
            name: location.name,
            description: location.description,
            type: location.type,
            importance: location.importance,
            geography: location.geography,
            climate: location.climate,
            terrain: location.terrain,
            natural_resources: location.naturalResources,
            ecosystem: location.ecosystem,
            architecture: location.architecture,
            social_structure: location.socialStructure,
            culture: location.culture,
            history_background: location.historyBackground,
            politics: location.politics,
            governance: location.governance,
            laws: location.laws,
            economy: location.economy,
            main_industries: location.mainIndustries,
            trade: location.trade,
            wealth: location.wealth,
            tags: location.tags || [],
            created_at: location.createdAt,
            last_modified: location.lastModified
          });
      } catch (error) {
        console.error('同步地点更新到云端失败:', error);
      }
    }
  }

  /**
   * 删除地点
   */
  async deleteLocation(locationId: string): Promise<void> {
    await databaseManager.locations.deleteLocation(locationId);
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('locations')
          .delete()
          .eq('id', locationId);
      } catch (error) {
        console.error('删除云端地点失败:', error);
      }
    }
  }

  /**
   * 获取地点列表
   */
  async getLocations(novelId?: string): Promise<Location[]> {
    const locations = await databaseManager.locations.getLocationsByNovelId(novelId);
    return novelId ? locations.filter(l => l.novelId === novelId) : locations;
  }

  /**
   * 保存世界观元素
   */
  async saveWorldElement(element: any, type: WorldSettingType): Promise<void> {
    element.lastModified = new Date().toISOString();
    
    console.log('hybridStorageService.saveWorldElement 调用，element:', element.name, ', type:', type);
    
    // 保存到本地数据库
    let localElement: any = null;
    switch (type) {
      case 'character':
        // 根据是否有ID决定是添加还是更新
        if (element.id) {
          // 更新现有角色
          console.log('更新现有角色:', element.name);
          await databaseManager.characters.updateCharacter({
            ...element,
            id: element.id,
            novelId: element.novelId,
            name: element.name,
            description: element.description,
            role: element.role,
            appearance: element.appearance,
            personality: element.personality,
            background: element.background,
            abilities: element.abilities,
            relationships: element.relationships,
            characterArc: element.characterArc,
            // 保持details字段，因为Character接口中有这个字段
            details: element.details,
            tags: element.tags || [],
            professionTags: element.professionTags || [],
            personalityTags: element.personalityTags || [],
            functionTags: element.functionTags || [],
          });
          localElement = element; // 更新操作直接使用传入的元素
        } else {
          // 添加新角色
          console.log('添加新角色:', element.name);
          localElement = await databaseManager.characters.addCharacter({
            novelId: element.novelId,
            name: element.name,
            description: element.description,
            role: element.role,
            appearance: element.appearance,
            personality: element.personality,
            background: element.background,
            abilities: element.abilities,
            relationships: element.relationships,
            characterArc: element.characterArc,
            details: element.details,
            tags: element.tags || [],
            professionTags: element.professionTags || [],
            personalityTags: element.personalityTags || [],
            functionTags: element.functionTags || [],
          });
          console.log('角色添加成功:', localElement.name);
        }
        break;
      case 'location':
        // 根据是否有ID决定是添加还是更新
        if (element.id) {
          // 更新现有地点
          await databaseManager.locations.updateLocation({
            ...element,
            id: element.id,
            novelId: element.novelId,
            name: element.name,
            description: element.description,
            type: element.locationType || element.type,  // 优先使用locationType作为type字段的值
            importance: element.importance,
            geography: element.geography,
            climate: element.climate,
            terrain: element.terrain,
            naturalResources: element.naturalResources,
            ecosystem: element.ecosystem,
            architecture: element.architecture,
            socialStructure: element.socialStructure,
            culture: element.culture,
            historyBackground: element.historyBackground,
            politics: element.politics,
            governance: element.governance,
            laws: element.laws,
            economy: element.economy,
            mainIndustries: element.mainIndustries,
            trade: element.trade,
            wealth: element.wealth,
            details: element.details || '', // 添加details字段
            tags: element.tags || [],
            locationType: element.locationType, // 保持locationType字段
          });
          localElement = element; // 更新操作直接使用传入的元素
        } else {
          // 添加新地点
          localElement = await databaseManager.locations.addLocation({
            novelId: element.novelId,
            name: element.name,
            description: element.description,
            type: element.locationType || element.type,  // 优先使用locationType作为type字段的值
            importance: element.importance,
            geography: element.geography,
            climate: element.climate,
            terrain: element.terrain,
            naturalResources: element.naturalResources,
            ecosystem: element.ecosystem,
            architecture: element.architecture,
            socialStructure: element.socialStructure,
            culture: element.culture,
            historyBackground: element.historyBackground,
            politics: element.politics,
            governance: element.governance,
            laws: element.laws,
            economy: element.economy,
            mainIndustries: element.mainIndustries,
            trade: element.trade,
            wealth: element.wealth,
            details: element.details || '', // 添加details字段
            tags: element.tags || [],
            locationType: element.locationType, // 保持locationType字段
          });
        }
        break;
      case 'culture':
        // 根据是否有ID决定是添加还是更新
        if (element.id) {
          // 更新现有文化设定
          await databaseManager.worldSettings.updateWorldSetting({
            ...element,
            id: element.id,
            novelId: element.novelId,
            name: element.name,
            description: element.description,
            type: 'culture',
            tags: element.tags || [],
            traditions: element.traditions,
            values: element.values,
            arts: element.arts,
            language: element.language,
            religion: element.religion,
            customs: element.customs,
            festivals: element.festivals,
            art: element.art,
            socialStructure: element.socialStructure,
            education: element.education,
            technology: element.technology,
            details: element.details,
            cultureInteraction: element.cultureInteraction,
            literature: element.literature,
          }, 'culture');
          localElement = element; // 更新操作直接使用传入的元素
        } else {
          // 添加新文化设定
          localElement = await databaseManager.worldSettings.addWorldSetting({
            novelId: element.novelId,
            name: element.name,
            description: element.description,
            type: 'culture',
            tags: element.tags || [],
            traditions: element.traditions,
            values: element.values,
            arts: element.arts,
            language: element.language,
            religion: element.religion,
            customs: element.customs,
            festivals: element.festivals,
            art: element.art,
            socialStructure: element.socialStructure,
            education: element.education,
            technology: element.technology,
            details: element.details,
            cultureInteraction: element.cultureInteraction,
          }, 'culture');
        }
        break;
      case 'technology':
        // 根据是否有ID决定是添加还是更新
        if (element.id) {
          // 更新现有科技设定
          const techSetting = {
            ...element,
            id: element.id,
            novelId: element.novelId,
            name: element.name || '', // 确保name字段存在
            description: element.description || '',
            type: 'technology' as const,
            tags: element.tags || [],
            level: element.level,
            applications: element.applications,
            limitations: element.limitations,
            impact: element.impact,
            details: element.details
          };
          await databaseManager.worldSettings.updateWorldSetting(techSetting, 'technology');
          localElement = element; // 更新操作直接使用传入的元素
        } else {
          // 添加新科技设定
          const techSetting = {
            novelId: element.novelId,
            name: element.name || '', // 确保name字段存在
            description: element.description || '',
            type: 'technology' as const,
            tags: element.tags || [],
            level: element.level,
            applications: element.applications,
            limitations: element.limitations,
            impact: element.impact,
            details: element.details
          };
          localElement = await databaseManager.worldSettings.addWorldSetting(techSetting, 'technology');
        }
        break;
      case 'magic':
        // 根据是否有ID决定是添加还是更新
        if (element.id) {
          // 更新现有魔法设定
          const magicSetting = {
            ...element,
            id: element.id,
            novelId: element.novelId,
            name: element.name || '', // 确保name字段存在
            description: element.description || '',
            type: 'magic' as const,
            tags: element.tags || [],
            system: element.system,
            sources: element.sources,
            rules: element.rules,
            spells: element.spells,
            artifacts: element.artifacts,
            worldRelation: element.worldRelation, // 添加世界观关联字段
            details: element.details
          };
          await databaseManager.worldSettings.updateWorldSetting(magicSetting, 'magic');
          localElement = element; // 更新操作直接使用传入的元素
        } else {
          // 添加新魔法设定
          const magicSetting = {
            novelId: element.novelId,
            name: element.name || '', // 确保name字段存在
            description: element.description || '',
            type: 'magic' as const,
            tags: element.tags || [],
            system: element.system,
            sources: element.sources,
            rules: element.rules,
            spells: element.spells,
            artifacts: element.artifacts,
            worldRelation: element.worldRelation, // 添加世界观关联字段
            details: element.details
          };
          localElement = await databaseManager.worldSettings.addWorldSetting(magicSetting, 'magic');
        }
        break;
      case 'history':
        // 根据是否有ID决定是添加还是更新
        if (element.id) {
          // 更新现有历史设定
          const historySetting = {
            ...element,
            id: element.id,
            novelId: element.novelId,
            name: element.name || '', // 确保name字段存在
            description: element.description || '',
            type: 'history' as const,
            tags: element.tags || [],
            timeline: element.timeline,
            events: element.events,
            figures: element.figures,
            consequences: element.consequences,
            details: element.details
          };
          await databaseManager.worldSettings.updateWorldSetting(historySetting, 'history');
          localElement = element; // 更新操作直接使用传入的元素
        } else {
          // 添加新历史设定
          const historySetting = {
            novelId: element.novelId,
            name: element.name || '', // 确保name字段存在
            description: element.description || '',
            type: 'history' as const,
            tags: element.tags || [],
            timeline: element.timeline,
            events: element.events,
            figures: element.figures,
            consequences: element.consequences,
            details: element.details
          };
          localElement = await databaseManager.worldSettings.addWorldSetting(historySetting, 'history');
        }
        break;
      default:
        console.warn(`不支持的世界观元素类型: ${type}`);
    }
    
    // 验证数据是否成功保存
    try {
      if (type === 'character' && localElement) {
        // 验证角色数据是否成功保存
        const savedCharacter = await databaseManager.characters.getCharacter(localElement.id);
        if (!savedCharacter) {
          console.warn('角色数据保存验证失败，未找到保存的角色');
        } else {
          console.log('角色数据保存验证成功:', savedCharacter.name);
        }
      } else if (type === 'history' && localElement) {
        // 验证历史设定数据是否成功保存
        const savedHistory = await databaseManager.worldSettings.getWorldSetting(localElement.id, 'history');
        if (!savedHistory) {
          console.warn('历史设定数据保存验证失败，未找到保存的历史设定');
        } else {
          console.log('历史设定数据保存验证成功:', savedHistory.name);
        }
      }
    } catch (verifyError) {
      console.warn('数据保存验证时出错:', verifyError);
    }
    
    // 同步到云端（如果启用）
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        // 根据类型同步到对应的云端表
        switch (type) {
          case 'character':
            await client
              .from('characters')
              .upsert({
                id: localElement?.id || element.id, // 使用本地生成的ID，如果没有则使用传入的ID
                novel_id: element.novelId,
                name: element.name,
                description: element.description,
                role: element.role || 'supporting',
                appearance: element.appearance,
                personality: element.personality,
                background: element.background,
                abilities: element.abilities,
                relationships: element.relationships,
                character_arc: element.characterArc,
                details: element.details,
                tags: element.tags || [], // 添加标签字段
                profession_tags: element.professionTags || [], // 添加职业标签字段
                personality_tags: element.personalityTags || [], // 添加性格标签字段
                function_tags: element.functionTags || [], // 添加功能标签字段
                created_at: localElement?.createdAt || element.createdAt, // 使用本地生成的时间戳
                last_modified: element.lastModified || element.createdAt
              });
            break;
          case 'location':
            await client
              .from('locations')
              .upsert({
                id: localElement?.id || element.id,
                novel_id: element.novelId,
                name: element.name,
                description: element.description,
                type: element.locationType || element.type,  // 优先使用locationType作为type字段的值
                importance: element.importance,
                geography: element.geography,
                climate: element.climate,
                terrain: element.terrain,
                natural_resources: element.naturalResources,
                ecosystem: element.ecosystem,
                architecture: element.architecture,
                social_structure: element.socialStructure,
                culture: element.culture,
                history_background: element.historyBackground,
                politics: element.politics,
                governance: element.governance,
                laws: element.laws,
                economy: element.economy,
                main_industries: element.mainIndustries,
                trade: element.trade,
                wealth: element.wealth,
                tags: element.tags || [],
                location_type: element.locationType, // 保持locationType字段
                created_at: localElement?.createdAt || element.createdAt,
                last_modified: element.lastModified || element.createdAt
              });
            break;
          case 'culture':
            await client
              .from('cultures')
              .upsert({
                id: localElement?.id || element.id,
                novel_id: element.novelId,
                name: element.name,
                description: element.description,
                type: 'culture',
                tags: element.tags || [],
                traditions: element.traditions,
                values: element.values,
                arts: element.arts,
                language: element.language,
                religion: element.religion,
                customs: element.customs,
                festivals: element.festivals,
                art: element.art,
                social_structure: element.socialStructure,
                education: element.education,
                technology: element.technology,
                details: element.details,
                literature: element.literature,
                culture_interaction: element.cultureInteraction,
                created_at: localElement?.createdAt || element.createdAt,
                last_modified: element.lastModified || element.createdAt
              });
            break;
          case 'technology':
            await client
              .from('technologies')
              .upsert({
                id: localElement?.id || element.id,
                novel_id: element.novelId,
                name: element.name,
                description: element.description,
                type: 'technology',
                tags: element.tags || [],
                level: element.level,
                applications: element.applications,
                limitations: element.limitations,
                impact: element.impact,
                details: element.details,
                created_at: localElement?.createdAt || element.createdAt,
                last_modified: element.lastModified || element.createdAt
              });
            break;
          case 'magic':
            await client
              .from('magics')
              .upsert({
                id: localElement?.id || element.id,
                novel_id: element.novelId,
                name: element.name,
                description: element.description,
                type: 'magic',
                tags: element.tags || [],
                system: element.system,
                sources: element.sources,
                rules: element.rules,
                spells: element.spells,
                artifacts: element.artifacts,
                world_relation: element.worldRelation, // 添加世界观关联字段
                details: element.details,
                literature: element.literature,
                created_at: localElement?.createdAt || element.createdAt,
                last_modified: element.lastModified || element.createdAt
              });
            break;
          case 'history':
            await client
              .from('histories')
              .upsert({
                id: localElement?.id || element.id,
                novel_id: element.novelId,
                name: element.name,
                description: element.description,
                type: 'history',
                tags: element.tags || [],
                timeline: element.timeline,
                events: element.events,
                figures: element.figures,
                consequences: element.consequences,
                details: element.details,
                literature: element.literature,
                created_at: localElement?.createdAt || element.createdAt,
                last_modified: element.lastModified || element.createdAt
              });
            break;
          default:
            console.warn(`不支持的世界观元素类型: ${type}`);
        }
      } catch (error) {
        console.error('同步世界观元素到云端失败:', error);
      }
    }
  }

  /**
   * 更新世界观元素（带冲突处理）
   */
  async updateWorldElement(element: any, type: WorldSettingType, forceUpdate: boolean = false): Promise<void> {
    // 获取云端数据以检查冲突
    const { client, isEnabled } = this.supabaseStore.getState();
    let cloudElement: any = null;
    
    if (isEnabled && client && element.id) {
      try {
        let query;
        switch (type) {
          case 'character':
            query = client.from('characters').select('*').eq('id', element.id);
            break;
          case 'location':
            query = client.from('locations').select('*').eq('id', element.id);
            break;
          case 'culture':
            query = client.from('cultures').select('*').eq('id', element.id);
            break;
          case 'technology':
            query = client.from('technologies').select('*').eq('id', element.id);
            break;
          case 'magic':
            query = client.from('magics').select('*').eq('id', element.id);
            break;
          case 'history':
            query = client.from('histories').select('*').eq('id', element.id);
            break;
          default:
            throw new Error(`不支持的世界观元素类型: ${type}`);
        }
        
        const { data, error } = await query.single();
        if (error) {
          console.warn(`获取云端${type}数据失败:`, error);
        } else {
          cloudElement = data;
        }
      } catch (error) {
        console.warn(`检查云端${type}数据时出错:`, error);
      }
    }
    
    // 检查是否有冲突
    if (cloudElement && !forceUpdate) {
      const localModified = new Date(element.lastModified || element.createdAt);
      const cloudModified = new Date(cloudElement.last_modified || cloudElement.created_at);
      
      if (cloudModified > localModified) {
        // 云端数据更新，需要处理冲突
        console.warn(`${type}存在冲突，云端数据较新`);
        // 这里可以触发用户选择处理方式，暂时先用云端数据
        // 实际应用中应该提供UI让用户选择保留哪个版本
        throw new Error('数据存在冲突，请手动处理');
      }
    }
    
    // 更新本地数据
    await this.saveWorldElement(element, type);
  }

  /**
   * 检查跨模块引用
   */
  private async checkCrossModuleReferences(element: any, type: string): Promise<void> {
    try {
      // 只对特定类型进行引用检查
      if (type !== 'character' && type !== 'location' && type !== 'outline') {
        return;
      }
      
      // 获取相关数据
      // novelId 变量在此作用域中未定义，使用 element.novelId
      const characters = await databaseManager.characters.getCharactersByNovelId(element.novelId);
      const locations = await databaseManager.locations.getLocationsByNovelId(element.novelId);
      
      switch (type) {
        case 'character':
          // 检查角色描述中引用的其他角色和地点
          if (element.description) {
            const descriptionText = element.description.toLowerCase();
            characters.forEach(char => {
              if (char.id !== element.id && descriptionText.includes(char.name.toLowerCase())) {
                console.log(`检测到角色"${element.name}"引用角色"${char.name}"`);
              }
            });
            locations.forEach(loc => {
              if (descriptionText.includes(loc.name.toLowerCase())) {
                console.log(`检测到角色"${element.name}"引用地点"${loc.name}"`);
              }
            });
          }
          break;
          
        case 'location':
          // 检查地点描述中引用的其他地点和角色
          if (element.description) {
            const descriptionText = element.description.toLowerCase();
            locations.forEach(loc => {
              if (loc.id !== element.id && descriptionText.includes(loc.name.toLowerCase())) {
                console.log(`检测到地点"${element.name}"引用地点"${loc.name}"`);
              }
            });
            characters.forEach(char => {
              if (descriptionText.includes(char.name.toLowerCase())) {
                console.log(`检测到地点"${element.name}"引用角色"${char.name}"`);
              }
            });
          }
          break;
      }
    } catch (error) {
      console.warn('跨模块引用检查失败:', error);
    }
  }

  /**
   * 批量保存世界观元素（带进度提示）
   */
  async batchSaveWorldElements(elements: { element: any; type: WorldSettingType }[], onProgress?: (completed: number, total: number) => void): Promise<void> {
    const total = elements.length;
    let completed = 0;
    
    // 分批处理，每批50个
    const batchSize = 50;
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      
      // 批量保存到本地
      const savePromises = batch.map(item => this.saveWorldElement(item.element, item.type));
      await Promise.all(savePromises);
      
      // 更新进度
      completed += batch.length;
      if (onProgress) {
        onProgress(completed, total);
      }
    }
  }

  /**
   * 获取世界观元素
   */
  async getWorldElements(type?: string, novelId?: string): Promise<any[]> {
    try {
      console.log(`getWorldElements called with type: ${type}, novelId: ${novelId}`);
      
      if (type) {
        // 根据类型获取对应的世界观元素
        switch (type) {
          case 'character':
            console.log(`获取角色数据，novelId: ${novelId}`);
            const characters = novelId 
              ? await databaseManager.characters.getCharactersByNovelId(novelId)
              : await databaseManager.characters.getCharactersByNovelId('');
            console.log(`获取到 ${characters.length} 个角色`);
            return characters;
          case 'location':
            console.log(`获取地点数据，novelId: ${novelId}`);
            const locations = novelId 
              ? await databaseManager.locations.getLocationsByNovelId(novelId)
              : await databaseManager.locations.getLocationsByNovelId('');
            // 转换Location对象为WorldElement格式
            const worldElements = locations.map(location => ({
              ...location,
              // WorldElement的type字段表示元素类型，应该是'location'
              type: 'location',
              // 保存地点的具体类型到locationType字段
              locationType: location.type,
              // 确保tags字段存在
              tags: location.tags || []
            }));
            console.log(`获取到 ${worldElements.length} 个地点`);
            return worldElements;
          case 'culture':
            console.log(`获取文化设定数据，novelId: ${novelId}`);
            const cultures = novelId 
              ? await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'culture')
              : await databaseManager.worldSettings.getAllData('culture');
            console.log(`获取到 ${cultures.length} 个文化设定`);
            return cultures;
          case 'technology':
            console.log(`获取科技设定数据，novelId: ${novelId}`);
            const technologies = novelId 
              ? await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'technology')
              : await databaseManager.worldSettings.getAllData('technology');
            console.log(`获取到 ${technologies.length} 个科技设定`);
            return technologies;
          case 'magic':
            console.log(`获取魔法设定数据，novelId: ${novelId}`);
            const magics = novelId 
              ? await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'magic')
              : await databaseManager.worldSettings.getAllData('magic');
            console.log(`获取到 ${magics.length} 个魔法设定`);
            return magics;
          case 'history':
            console.log(`获取历史设定数据，novelId: ${novelId}`);
            const histories = novelId 
              ? await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'history')
              : await databaseManager.worldSettings.getAllData('history');
            console.log(`获取到 ${histories.length} 个历史设定`);
            return histories;
          default:
            console.warn(`不支持的世界观元素类型: ${type}`);
            return [];
        }
      } else {
        // 获取所有类型的世界观元素
        console.log('获取所有类型的世界观元素');
        const allElements: any[] = [];
        
        try {
          // 获取角色
          const characters = novelId 
            ? await databaseManager.characters.getCharactersByNovelId(novelId)
            : await databaseManager.characters.getCharactersByNovelId('');
          allElements.push(...characters);
          console.log(`获取到 ${characters.length} 个角色`);
        } catch (error) {
          console.error('获取角色数据失败:', error);
        }
        
        try {
          // 获取地点
          const locations = novelId 
            ? await databaseManager.locations.getLocationsByNovelId(novelId)
            : await databaseManager.locations.getLocationsByNovelId('');
          // 转换Location对象为WorldElement格式
          const worldElements = locations.map(location => ({
            ...location,
            // WorldElement的type字段表示元素类型，应该是'location'
            type: 'location',
            // WorldElement使用locationType字段表示地点的具体类型，Location使用type字段
            locationType: location.type,
            // 确保tags字段存在
            tags: location.tags || []
          }));
          allElements.push(...worldElements);
          console.log(`获取到 ${locations.length} 个地点`);
        } catch (error) {
          console.error('获取地点数据失败:', error);
        }
        
        try {
          // 获取文化设定
          const cultures = novelId 
            ? await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'culture')
            : await databaseManager.worldSettings.getAllData('culture');
          allElements.push(...cultures);
          console.log(`获取到 ${cultures.length} 个文化设定`);
        } catch (error) {
          console.error('获取文化设定数据失败:', error);
        }
        
        try {
          // 获取科技设定
          const technologies = novelId 
            ? await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'technology')
            : await databaseManager.worldSettings.getAllData('technology');
          allElements.push(...technologies);
          console.log(`获取到 ${technologies.length} 个科技设定`);
        } catch (error) {
          console.error('获取科技设定数据失败:', error);
        }
        
        try {
          // 获取魔法设定
          const magics = novelId 
            ? await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'magic')
            : await databaseManager.worldSettings.getAllData('magic');
          allElements.push(...magics);
          console.log(`获取到 ${magics.length} 个魔法设定`);
        } catch (error) {
          console.error('获取魔法设定数据失败:', error);
        }
        
        try {
          // 获取历史设定
          const histories = novelId 
            ? await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'history')
            : await databaseManager.worldSettings.getAllData('history');
          allElements.push(...histories);
          console.log(`获取到 ${histories.length} 个历史设定`);
        } catch (error) {
          console.error('获取历史设定数据失败:', error);
        }
        
        console.log(`总共获取到 ${allElements.length} 个世界观元素`);
        return allElements;
      }
    } catch (error) {
      console.error('获取世界观元素失败:', error);
      throw new Error(`获取世界观元素失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 删除世界观元素
   */
  async deleteWorldElement(elementId: string, type: string): Promise<void> {
    // 根据类型删除对应的世界观元素
    switch (type) {
      case 'character':
        await databaseManager.characters.deleteCharacter(elementId);
        break;
      case 'location':
        await databaseManager.locations.deleteLocation(elementId);
        break;
      case 'culture':
        await databaseManager.worldSettings.deleteWorldSetting(elementId, 'culture');
        break;
      case 'technology':
        await databaseManager.worldSettings.deleteWorldSetting(elementId, 'technology');
        break;
      case 'magic':
        await databaseManager.worldSettings.deleteWorldSetting(elementId, 'magic');
        break;
      case 'history':
        await databaseManager.worldSettings.deleteWorldSetting(elementId, 'history');
        break;
      default:
        console.warn(`不支持的世界观元素类型: ${type}`);
    }
    
    // 同步到云端（如果启用）
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        // 根据类型从云端删除数据
        switch (type) {
          case 'character':
            await client
              .from('characters')
              .delete()
              .eq('id', elementId);
            break;
          case 'location':
            await client
              .from('locations')
              .delete()
              .eq('id', elementId);
            break;
          case 'culture':
            await client
              .from('cultures')
              .delete()
              .eq('id', elementId);
            break;
          case 'technology':
            await client
              .from('technologies')
              .delete()
              .eq('id', elementId);
            break;
          case 'magic':
            await client
              .from('magics')
              .delete()
              .eq('id', elementId);
            break;
          case 'history':
            await client
              .from('histories')
              .delete()
              .eq('id', elementId);
            break;
        }
      } catch (error) {
        console.error(`删除${type}云端数据失败:`, error);
      }
    }
  }

  /**
   * 根据标签获取世界观元素
   */
  async getWorldElementsByTags(tags: string[], type?: string, novelId?: string): Promise<any[]> {
    try {
      // 首先获取所有符合条件的世界观元素
      const allElements = await this.getWorldElements(type, novelId);
      
      // 然后根据标签进行筛选
      if (tags && tags.length > 0) {
        return allElements.filter(element => {
          if (!element.tags || element.tags.length === 0) return false;
          // 检查是否有共同标签
          return element.tags.some((tag: string) => tags.includes(tag));
        });
      }
      
      return allElements;
    } catch (error) {
      console.error('根据标签获取世界观元素失败:', error);
      throw new Error(`根据标签获取世界观元素失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 根据标签精确匹配获取世界观元素
   * 要求元素必须包含所有指定的标签
   */
  async getWorldElementsByExactTags(tags: string[], type?: string, novelId?: string): Promise<any[]> {
    try {
      // 首先获取所有符合条件的世界观元素
      const allElements = await this.getWorldElements(type, novelId);
      
      // 然后根据标签进行精确匹配筛选
      if (tags && tags.length > 0) {
        return allElements.filter(element => {
          if (!element.tags || element.tags.length === 0) return false;
          // 检查是否包含所有指定的标签
          return tags.every(tag => element.tags.includes(tag));
        });
      }
      
      return allElements;
    } catch (error) {
      console.error('根据标签精确匹配获取世界观元素失败:', error);
      throw new Error(`根据标签精确匹配获取世界观元素失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 保存章节版本
   */
  async saveChapterVersion(version: Omit<ChapterVersion, 'id' | 'createdAt'>): Promise<void> {
    // 1. 保存到本地
    const savedVersion = await databaseManager.chapterVersions.addChapterVersion(version);
    
    // 2. 同步到云端（如果启用）
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('chapter_versions')
          .upsert({
            id: savedVersion.id,
            chapter_id: savedVersion.chapterId,
            content: savedVersion.content,
            word_count: savedVersion.wordCount,
            created_at: savedVersion.createdAt,
            version_name: savedVersion.versionName,
            summary: savedVersion.summary
          });
      } catch (error) {
        console.error('同步章节版本到云端失败:', error);
      }
    }
  }

  /**
   * 获取章节的所有版本
   */
  async getChapterVersions(chapterId: string): Promise<ChapterVersion[]> {
    // 优先从本地获取
    return await databaseManager.chapterVersions.getChapterVersions(chapterId);
  }

  /**
   * 获取章节的最新版本
   */
  async getLatestChapterVersion(chapterId: string): Promise<ChapterVersion | undefined> {
    // 优先从本地获取
    // 获取章节的最新版本需要额外的逻辑来确定哪个是最新版本
    const versions = await databaseManager.chapterVersions.getChapterVersions(chapterId);
    if (versions.length === 0) return undefined;
    // 按创建时间排序，返回最新的版本
    return versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  /**
   * 删除章节的所有版本
   */
  async deleteChapterVersions(chapterId: string): Promise<void> {
    // 1. 删除本地数据
    // 删除章节的所有版本需要先获取所有版本，然后逐个删除
    const versions = await databaseManager.chapterVersions.getChapterVersions(chapterId);
    for (const version of versions) {
      await databaseManager.chapterVersions.deleteChapterVersion(version.id);
    }
    
    // 2. 删除云端数据
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('chapter_versions')
          .delete()
          .eq('chapter_id', chapterId);
      } catch (error) {
        console.error('删除云端章节版本失败:', error);
      }
    }
  }

  /**
   * 删除单个章节版本
   */
  async deleteChapterVersion(versionId: string): Promise<void> {
    // 1. 删除本地数据
    await databaseManager.chapterVersions.deleteChapterVersion(versionId);
    
    // 2. 删除云端数据
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('chapter_versions')
          .delete()
          .eq('id', versionId);
      } catch (error) {
        console.error('删除云端章节版本失败:', error);
      }
    }
  }

  /**
   * 保存写作记录
   */
  async saveWritingRecord(record: Omit<WritingRecord, 'id' | 'createdAt' | 'lastModified'>): Promise<void> {
    // 1. 保存到本地
    await databaseManager.writingRecords.addWritingRecord(record);
    
    // 2. 同步到云端 (如果需要的话，这里可以添加云端同步逻辑)
    // 目前暂不实现云端同步
  }

  /**
   * 更新写作记录
   */
  async updateWritingRecord(record: WritingRecord): Promise<void> {
    // 更新最后修改时间
    record.lastModified = new Date().toISOString();
    
    // 1. 更新本地数据
    await databaseManager.writingRecords.updateWritingRecord(record);
    
    // 2. 同步到云端 (如果需要的话，这里可以添加云端同步逻辑)
    // 目前暂不实现云端同步
  }

  /**
   * 删除写作记录
   */
  async deleteWritingRecord(recordId: string): Promise<void> {
    // 1. 删除本地数据
    await databaseManager.writingRecords.deleteWritingRecord(recordId);
    
    // 2. 删除云端数据 (如果需要的话，这里可以添加云端同步逻辑)
    // 目前暂不实现云端同步
  }

  /**
   * 获取指定小说的所有写作记录
   */
  async getWritingRecordsByNovelId(novelId: string): Promise<WritingRecord[]> {
    // 优先从本地获取
    return await databaseManager.writingRecords.getWritingRecordsByNovelId(novelId);
  }

  /**
   * 获取指定小说指定类型的写作记录
   */
  async getWritingRecordsByNovelIdAndType(novelId: string, type: WritingRecord['type']): Promise<WritingRecord[]> {
    // 获取指定小说指定类型的写作记录需要先获取所有记录，然后过滤
    const records = await databaseManager.writingRecords.getWritingRecordsByNovelId(novelId);
    return records.filter(record => record.type === type);
  }

  /**
   * 保存聊天记录
   */
  async saveChatHistory(novelId: string, chatData: { messages: Message[] }): Promise<void> {
    // 1. 保存到本地
    await databaseManager.chatHistory.updateChatHistory(novelId, chatData.messages);
    
    // 2. 如果启用了Supabase，同步到云端
    // 注意：目前暂不实现云端同步，因为聊天记录通常不需要云端同步
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        // 如果需要实现云端同步，可以在这里添加代码
        console.log('聊天记录已保存到本地，云端同步功能待实现');
      } catch (error) {
        console.error('同步聊天记录到云端失败:', error);
      }
    }
  }

  /**
   * 获取聊天记录
   */
  async getChatHistory(novelId: string): Promise<{ messages: Message[] } | null> {
    // 优先从本地获取
    const chatHistory = await databaseManager.chatHistory.getChatHistory(novelId);
    if (chatHistory) {
      return {
        messages: chatHistory.messages
      };
    }
    return null;
  }

  /**
   * 清空聊天记录
   */
  async clearChatHistory(novelId: string): Promise<void> {
    // 1. 删除本地数据
    await databaseManager.chatHistory.updateChatHistory(novelId, []);
    
    // 2. 如果启用了Supabase，从云端删除
    // 注意：目前暂不实现云端同步
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        // 如果需要实现云端同步，可以在这里添加代码
        console.log('聊天记录已从本地清空，云端同步功能待实现');
      } catch (error) {
        console.error('删除云端聊天记录失败:', error);
      }
    }
  }
}

// 导出混合存储服务实例
export const hybridStorageService = new HybridStorageService();