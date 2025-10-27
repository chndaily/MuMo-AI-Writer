/**
 * 后台同步服务
 * 管理后台数据同步任务
 */
class BackgroundSyncService {
  private syncInterval: number | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * 设置同步间隔（分钟）
   */
  setSyncInterval(minutes: number) {
    // 清除现有的定时器
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // 设置新的同步间隔
    this.syncInterval = minutes;

    // 如果分钟数大于0，则启动定时器
    if (minutes > 0) {
      this.intervalId = setInterval(() => {
        // 触发同步事件
        console.log('Background sync triggered');
      }, minutes * 60 * 1000); // 转换为毫秒
    }
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      syncInterval: this.syncInterval,
      isRunning: this.intervalId !== null
    };
  }

  /**
   * 立即触发一次同步
   */
  triggerSync() {
    console.log('Manual background sync triggered');
  }
}

// 创建后台同步服务实例
export const backgroundSyncService = new BackgroundSyncService();