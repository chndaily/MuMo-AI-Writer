import { databaseManager } from '@/services/index';
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore';
import { WorldSetting } from '#/novel';

/**
 * 文化存储服务
 * 专门负责文化设定数据的本地和云端存储
 */
export class CultureStorageService {
  private supabaseStore = useSupabaseConfigStore;

  /**
   * 保存文化设定
   */
  async saveCulture(culture: WorldSetting): Promise<void> {
    // 1. 保存到本地
    await databaseManager.worldSettings.addWorldSetting(culture, 'culture');
    
    // 2. 同步到云端
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('cultures')
          .upsert({
            id: culture.id,
            novel_id: culture.novelId,
            name: culture.name,
            description: culture.description,
            type: 'culture',
            tags: culture.tags || [],
            traditions: culture.traditions,
            values: culture.values,
            arts: culture.arts,
            language: culture.language,
            religion: culture.religion,
            customs: culture.customs,
            festivals: culture.festivals,
            art: culture.art,
            social_structure: culture.socialStructure,
            education: culture.education,
            technology: culture.technology,
            details: culture.details,
            created_at: culture.createdAt,
            last_modified: culture.lastModified || culture.createdAt
          });
      } catch (error) {
        console.error('同步文化设定到云端失败:', error);
      }
    }
  }

  /**
   * 更新文化设定
   */
  async updateCulture(culture: WorldSetting): Promise<void> {
    culture.lastModified = new Date().toISOString();
    
    await databaseManager.worldSettings.updateWorldSetting(culture, 'culture');
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('cultures')
          .upsert({
            id: culture.id,
            novel_id: culture.novelId,
            name: culture.name,
            description: culture.description,
            type: 'culture',
            tags: culture.tags || [],
            traditions: culture.traditions,
            values: culture.values,
            arts: culture.arts,
            language: culture.language,
            religion: culture.religion,
            customs: culture.customs,
            festivals: culture.festivals,
            art: culture.art,
            social_structure: culture.socialStructure,
            education: culture.education,
            technology: culture.technology,
            details: culture.details,
            created_at: culture.createdAt,
            last_modified: culture.lastModified
          });
      } catch (error) {
        console.error('同步文化设定更新到云端失败:', error);
      }
    }
  }

  /**
   * 删除文化设定
   */
  async deleteCulture(cultureId: string): Promise<void> {
    await databaseManager.worldSettings.deleteWorldSetting(cultureId, 'culture');
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('cultures')
          .delete()
          .eq('id', cultureId);
      } catch (error) {
        console.error('删除云端文化设定失败:', error);
      }
    }
  }

  /**
   * 获取文化设定列表
   */
  async getCultures(novelId?: string): Promise<WorldSetting[]> {
    const cultures = await databaseManager.worldSettings.getAllData('culture');
    return novelId ? cultures.filter(c => c.novelId === novelId) : cultures;
  }
}