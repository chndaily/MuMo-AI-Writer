import { databaseManager } from '@/services/index';
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore';
import { WorldSetting } from '#/novel';

/**
 * 历史存储服务
 * 专门负责历史设定数据的本地和云端存储
 */
export class HistoryStorageService {
  private supabaseStore = useSupabaseConfigStore;

  /**
   * 保存历史设定
   */
  async saveHistory(history: WorldSetting): Promise<void> {
    // 1. 保存到本地
    await databaseManager.worldSettings.addWorldSetting(history, 'history');
    
    // 2. 同步到云端
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('histories')
          .upsert({
            id: history.id,
            novel_id: history.novelId,
            name: history.name,
            description: history.description,
            type: 'history',
            tags: history.tags || [],
            timeline: history.timeline,
            events: history.events,
            figures: history.figures,
            consequences: history.consequences,
            details: history.details,
            created_at: history.createdAt,
            last_modified: history.lastModified || history.createdAt
          });
      } catch (error) {
        console.error('同步历史设定到云端失败:', error);
      }
    }
  }

  /**
   * 更新历史设定
   */
  async updateHistory(history: WorldSetting): Promise<void> {
    history.lastModified = new Date().toISOString();
    
    await databaseManager.worldSettings.updateWorldSetting(history, 'history');
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('histories')
          .upsert({
            id: history.id,
            novel_id: history.novelId,
            name: history.name,
            description: history.description,
            type: 'history',
            tags: history.tags || [],
            timeline: history.timeline,
            events: history.events,
            figures: history.figures,
            consequences: history.consequences,
            details: history.details,
            created_at: history.createdAt,
            last_modified: history.lastModified
          });
      } catch (error) {
        console.error('同步历史设定更新到云端失败:', error);
      }
    }
  }

  /**
   * 删除历史设定
   */
  async deleteHistory(historyId: string): Promise<void> {
    await databaseManager.worldSettings.deleteWorldSetting(historyId, 'history');
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('histories')
          .delete()
          .eq('id', historyId);
      } catch (error) {
        console.error('删除云端历史设定失败:', error);
      }
    }
  }

  /**
   * 获取历史设定列表
   */
  async getHistories(novelId?: string): Promise<WorldSetting[]> {
    const histories = await databaseManager.worldSettings.getAllData('history');
    return novelId ? histories.filter(h => h.novelId === novelId) : histories;
  }
}