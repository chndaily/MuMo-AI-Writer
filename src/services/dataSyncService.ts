import { databaseManager } from '@/services/index';
import { apiService } from '@/services/apiService';
import { useMembershipStore } from '@/stores/membershipStore';

/**
 * 数据同步服务
 * 负责处理本地IndexedDB和远程MongoDB之间的数据同步
 */
class DataSyncService {
  /**
   * 同步所有数据到云端
   */
  async syncAllDataToCloud(): Promise<{ 
    success: boolean; 
    message: string;
    stats: {
      novels: number;
      characters: number;
      locations: number;
      outlines: number;
    }
  }> {
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';
      
      console.log('开始同步所有数据到云端...');
      
      // 1. 同步小说数据
      console.log('同步小说数据...');
      const localNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
      let novelSyncCount = 0;
      
      for (const novel of localNovels) {
        try {
          // 确保小说有userId字段
          const novelWithUserId = {
            ...novel,
            userId: novel.userId || currentUserId
          };
          
          // 同步到MongoDB
          await apiService.novels.createNovel(novelWithUserId);
          novelSyncCount++;
          console.log(`小说 "${novel.title}" 同步成功`);
        } catch (error) {
          console.warn(`小说 "${novel.title}" 同步失败:`, error);
        }
      }
      
      // 2. 同步角色数据
      console.log('同步角色数据...');
      const localCharacters = await databaseManager.characters.getCharactersByNovelId('');
      let characterSyncCount = 0;
      
      for (const character of localCharacters) {
        try {
          // 同步到MongoDB
          await apiService.characters.createCharacter(character);
          characterSyncCount++;
          console.log(`角色 "${character.name}" 同步成功`);
        } catch (error) {
          console.warn(`角色 "${character.name}" 同步失败:`, error);
        }
      }
      
      // 3. 同步地点数据
      console.log('同步地点数据...');
      const localLocations = await databaseManager.locations.getLocationsByNovelId('');
      let locationSyncCount = 0;
      
      for (const location of localLocations) {
        try {
          // 同步到MongoDB
          await apiService.locations.createLocation(location);
          locationSyncCount++;
          console.log(`地点 "${location.name}" 同步成功`);
        } catch (error) {
          console.warn(`地点 "${location.name}" 同步失败:`, error);
        }
      }
      
      // 4. 同步大纲数据
      console.log('同步大纲数据...');
      const localOutlines = await databaseManager.outlines.getOutlinesByNovelId('');
      let outlineSyncCount = 0;
      
      for (const outline of localOutlines) {
        try {
          // 同步到MongoDB
          await apiService.outlines.createOutline(outline);
          outlineSyncCount++;
          console.log(`大纲 "${outline.title}" 同步成功`);
        } catch (error) {
          console.warn(`大纲 "${outline.title}" 同步失败:`, error);
        }
      }
      
      console.log('数据同步完成');
      
      return {
        success: true,
        message: `数据同步完成！共同步 ${novelSyncCount} 本小说、${characterSyncCount} 个角色、${locationSyncCount} 个地点、${outlineSyncCount} 个大纲。`,
        stats: {
          novels: novelSyncCount,
          characters: characterSyncCount,
          locations: locationSyncCount,
          outlines: outlineSyncCount
        }
      };
    } catch (error) {
      console.error('数据同步失败:', error);
      return {
        success: false,
        message: `数据同步失败: ${error instanceof Error ? error.message : '未知错误'}`,
        stats: {
          novels: 0,
          characters: 0,
          locations: 0,
          outlines: 0
        }
      };
    }
  }

  /**
   * 从云端同步数据到本地
   */
  async syncDataFromCloud(): Promise<{ 
    success: boolean; 
    message: string;
    stats: {
      novels: number;
      characters: number;
      locations: number;
      outlines: number;
    }
  }> {
    try {
      console.log('开始从云端同步数据到本地...');
      
      // 1. 同步小说数据
      console.log('同步小说数据...');
      const remoteNovels = await apiService.novels.getAllNovels();
      let novelSyncCount = 0;
      
      for (const novel of remoteNovels) {
        try {
          // 保存到本地IndexedDB
          await databaseManager.novels.addNovel(novel);
          novelSyncCount++;
          console.log(`小说 "${novel.title}" 同步到本地成功`);
        } catch (error) {
          console.warn(`小说 "${novel.title}" 同步到本地失败:`, error);
        }
      }
      
      // 注意：API服务中没有获取所有角色、地点、大纲的方法，这里简化处理
      // 在实际应用中，应该根据用户ID获取相关数据
      
      console.log('从云端同步数据完成');
      
      return {
        success: true,
        message: `从云端同步数据完成！共同步 ${novelSyncCount} 本小说到本地。`,
        stats: {
          novels: novelSyncCount,
          characters: 0,
          locations: 0,
          outlines: 0
        }
      };
    } catch (error) {
      console.error('从云端同步数据失败:', error);
      return {
        success: false,
        message: `从云端同步数据失败: ${error instanceof Error ? error.message : '未知错误'}`,
        stats: {
          novels: 0,
          characters: 0,
          locations: 0,
          outlines: 0
        }
      };
    }
  }

  /**
   * 检查数据同步状态
   */
  async checkSyncStatus(): Promise<{ 
    success: boolean; 
    message: string;
    localStats: {
      novels: number;
      characters: number;
      locations: number;
      outlines: number;
    };
    remoteStats: {
      novels: number;
    };
  }> {
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';

      // 获取本地数据统计
      const localNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
      const localCharacters = await databaseManager.characters.getCharactersByNovelId('');
      const localLocations = await databaseManager.locations.getLocationsByNovelId('');
      const localOutlines = await databaseManager.outlines.getOutlinesByNovelId('');
      
      // 获取云端数据统计
      const remoteNovels = await apiService.novels.getCurrentUserNovels(currentUserId);
      
      return {
        success: true,
        message: '数据同步状态检查完成',
        localStats: {
          novels: localNovels.length,
          characters: localCharacters.length,
          locations: localLocations.length,
          outlines: localOutlines.length
        },
        remoteStats: {
          novels: remoteNovels.length
        }
      };
    } catch (error) {
      console.error('检查同步状态失败:', error);
      return {
        success: false,
        message: `检查同步状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
        localStats: {
          novels: 0,
          characters: 0,
          locations: 0,
          outlines: 0
        },
        remoteStats: {
          novels: 0
        }
      };
    }
  }
}

// 创建数据同步服务实例
export const dataSyncService = new DataSyncService();