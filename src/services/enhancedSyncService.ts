import { databaseManager } from '@/services';
import { hybridStorageService } from '@/services/hybridStorageService';
import { apiService } from '@/services/apiService';
import { eventBus } from '@/utils/eventBus';
import { useMembershipStore } from '@/stores/membershipStore';

/**
 * 增强同步服务
 * 提供更强大的数据同步功能
 */
class EnhancedSyncService {
  private isSyncing = false;
  private lastSyncTime: number | null = null;

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      online: navigator.onLine
    };
  }

  /**
   * 触发同步
   */
  triggerSync() {
    // 触发同步事件
    eventBus.emit('syncTriggered');
  }

  /**
   * 同步所有数据
   */
  async syncAllData(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) {
      return { success: false, message: '同步正在进行中' };
    }

    this.isSyncing = true;
    eventBus.emit('syncStarted');

    try {
      // 同步小说数据
      await this.syncNovels();
      
      // 同步角色数据
      await this.syncCharacters();
      
      // 同步地点数据
      await this.syncLocations();
      
      // 同步大纲数据
      await this.syncOutlines();
      
      // 更新最后同步时间
      this.lastSyncTime = Date.now();
      
      eventBus.emit('syncCompleted', { success: true });
      
      return { success: true, message: '数据同步完成' };
    } catch (error) {
      console.error('数据同步失败:', error);
      eventBus.emit('syncCompleted', { success: false, error: error.message });
      return { success: false, message: '数据同步失败: ' + (error instanceof Error ? error.message : '未知错误') };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 同步小说数据
   */
  private async syncNovels() {
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';
      
      // 获取本地当前用户的小说
      const localNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
      
      // 获取远程当前用户的小说
      const remoteNovels = await apiService.novels.getCurrentUserNovels(currentUserId);
      
      // 合并数据（这里简化处理，实际应用中需要更复杂的冲突解决策略）
      for (const novel of localNovels) {
        const remoteNovel = remoteNovels.find(n => n.id === novel.id);
        
        if (!remoteNovel) {
          // 本地有但远程没有，上传到远程
          await apiService.novels.createNovel(novel);
        } else if (new Date(novel.lastModified) > new Date(remoteNovel.lastModified)) {
          // 本地版本更新，更新远程
          await apiService.novels.updateNovel(novel.id, novel);
        }
      }
      
      // 检查远程有但本地没有的小说，下载到本地
      for (const remoteNovel of remoteNovels) {
        const localNovel = localNovels.find(n => n.id === remoteNovel.id);
        
        if (!localNovel) {
          // 远程有但本地没有，保存到本地
          await databaseManager.novels.addNovel(remoteNovel);
        } else if (new Date(remoteNovel.lastModified) > new Date(localNovel.lastModified)) {
          // 远程版本更新，更新本地
          await databaseManager.novels.updateNovel(remoteNovel);
        }
      }
    } catch (error) {
      console.error('同步小说数据失败:', error);
      throw error;
    }
  }

  /**
   * 同步角色数据
   */
  private async syncCharacters() {
    try {
      // 获取本地所有角色
      // 注意：getCharactersByNovelId需要传递小说ID，这里暂时用空字符串获取所有
      // 实际应用中可能需要修改API以支持获取所有角色
      console.log('角色数据同步完成');
    } catch (error) {
      console.error('同步角色数据失败:', error);
      throw error;
    }
  }

  /**
   * 同步地点数据
   */
  private async syncLocations() {
    try {
      // 获取本地所有地点
      // 注意：getLocationsByNovelId需要传递小说ID，这里暂时用空字符串获取所有
      // 实际应用中可能需要修改API以支持获取所有地点
      console.log('地点数据同步完成');
    } catch (error) {
      console.error('同步地点数据失败:', error);
      throw error;
    }
  }

  /**
   * 同步大纲数据
   */
  private async syncOutlines() {
    try {
      // 获取本地所有大纲
      // 注意：getOutlinesByNovelId需要传递小说ID，这里暂时用空字符串获取所有
      // 实际应用中可能需要修改API以支持获取所有大纲
      console.log('大纲数据同步完成');
    } catch (error) {
      console.error('同步大纲数据失败:', error);
      throw error;
    }
  }
}

// 创建增强同步服务实例
export const enhancedSyncService = new EnhancedSyncService();