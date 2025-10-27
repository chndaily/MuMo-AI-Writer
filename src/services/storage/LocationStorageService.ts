import { databaseManager } from '@/services/index';
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore';
import { Location } from '#/novel';

/**
 * 地点存储服务
 * 专门负责地点数据的本地和云端存储
 */
export class LocationStorageService {
  private supabaseStore = useSupabaseConfigStore;

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
            type: location.locationType || location.type,  // 优先使用locationType作为type字段的值
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
            location_type: location.locationType, // 保持locationType字段
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
            type: location.locationType || location.type,
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
            location_type: location.locationType,
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
    // 获取所有地点数据
    const locations: Location[] = [];
    return novelId ? locations.filter(l => l.novelId === novelId) : locations;
  }
}