import { databaseManager } from '@/services/index';
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore';
import { WorldSetting } from '#/novel';

/**
 * 科技存储服务
 * 专门负责科技设定数据的本地和云端存储
 */
export class TechnologyStorageService {
  private supabaseStore = useSupabaseConfigStore;

  /**
   * 保存科技设定
   */
  async saveTechnology(technology: WorldSetting): Promise<void> {
    // 1. 保存到本地
    await databaseManager.worldSettings.addWorldSetting(technology, 'technology');
    
    // 2. 同步到云端
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('technologies')
          .upsert({
            id: technology.id,
            novel_id: technology.novelId,
            name: technology.name,
            description: technology.description,
            type: 'technology',
            tags: technology.tags || [],
            level: technology.level,
            applications: technology.applications,
            limitations: technology.limitations,
            // impact: technology.impact,
            details: technology.details,
            created_at: technology.createdAt,
            last_modified: technology.lastModified || technology.createdAt
          });
      } catch (error) {
        console.error('同步科技设定到云端失败:', error);
      }
    }
  }

  /**
   * 更新科技设定
   */
  async updateTechnology(technology: WorldSetting): Promise<void> {
    technology.lastModified = new Date().toISOString();
    
    await databaseManager.worldSettings.updateWorldSetting(technology, 'technology');
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('technologies')
          .upsert({
            id: technology.id,
            novel_id: technology.novelId,
            name: technology.name,
            description: technology.description,
            type: 'technology',
            tags: technology.tags || [],
            level: technology.level,
            applications: technology.applications,
            limitations: technology.limitations,
            // impact: technology.impact,
            details: technology.details,
            created_at: technology.createdAt,
            last_modified: technology.lastModified
          });
      } catch (error) {
        console.error('同步科技设定更新到云端失败:', error);
      }
    }
  }

  /**
   * 删除科技设定
   */
  async deleteTechnology(technologyId: string): Promise<void> {
    await databaseManager.worldSettings.deleteWorldSetting(technologyId, 'technology');
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('technologies')
          .delete()
          .eq('id', technologyId);
      } catch (error) {
        console.error('删除云端科技设定失败:', error);
      }
    }
  }

  /**
   * 获取科技设定列表
   */
  async getTechnologies(novelId?: string): Promise<WorldSetting[]> {
    const technologies = await databaseManager.worldSettings.getAllData('technology');
    return novelId ? technologies.filter(t => t.novelId === novelId) : technologies;
  }
}