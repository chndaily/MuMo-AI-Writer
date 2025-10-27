import { databaseManager } from '@/services/index';
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore';
import { WorldSetting } from '#/novel';

/**
 * 魔法存储服务
 * 专门负责魔法设定数据的本地和云端存储
 */
export class MagicStorageService {
  private supabaseStore = useSupabaseConfigStore;

  /**
   * 保存魔法设定
   */
  async saveMagic(magic: WorldSetting): Promise<void> {
    // 1. 保存到本地
    await databaseManager.worldSettings.addWorldSetting(magic, 'magic');
    
    // 2. 同步到云端
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('magics')
          .upsert({
            id: magic.id,
            novel_id: magic.novelId,
            name: magic.name,
            description: magic.description,
            type: 'magic',
            tags: magic.tags || [],
            system: magic.system,
            sources: magic.sources,
            rules: magic.rules,
            spells: magic.spells,
            artifacts: magic.artifacts,
            world_relation: magic.worldRelation, // 添加世界观关联字段
            details: magic.details,
            created_at: magic.createdAt,
            last_modified: magic.lastModified || magic.createdAt
          });
      } catch (error) {
        console.error('同步魔法设定到云端失败:', error);
      }
    }
  }

  /**
   * 更新魔法设定
   */
  async updateMagic(magic: WorldSetting): Promise<void> {
    magic.lastModified = new Date().toISOString();
    
    await databaseManager.worldSettings.updateWorldSetting(magic, 'magic');
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('magics')
          .upsert({
            id: magic.id,
            novel_id: magic.novelId,
            name: magic.name,
            description: magic.description,
            type: 'magic',
            tags: magic.tags || [],
            system: magic.system,
            sources: magic.sources,
            rules: magic.rules,
            spells: magic.spells,
            artifacts: magic.artifacts,
            world_relation: magic.worldRelation, // 添加世界观关联字段
            details: magic.details,
            created_at: magic.createdAt,
            last_modified: magic.lastModified
          });
      } catch (error) {
        console.error('同步魔法设定更新到云端失败:', error);
      }
    }
  }

  /**
   * 删除魔法设定
   */
  async deleteMagic(magicId: string): Promise<void> {
    await databaseManager.worldSettings.deleteWorldSetting(magicId, 'magic');
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('magics')
          .delete()
          .eq('id', magicId);
      } catch (error) {
        console.error('删除云端魔法设定失败:', error);
      }
    }
  }

  /**
   * 获取魔法设定列表
   */
  async getMagics(novelId?: string): Promise<WorldSetting[]> {
    const magics = await databaseManager.worldSettings.getAllData('magic');
    return novelId ? magics.filter(m => m.novelId === novelId) : magics;
  }
}