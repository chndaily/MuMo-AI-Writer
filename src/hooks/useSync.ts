import { useState, useEffect, useCallback } from 'react';
import { optimizedDataSyncService } from '@/services/optimizedDataSyncService';
import { backgroundSyncService } from '@/services/backgroundSyncService';

/**
 * 数据同步Hook
 * 提供同步状态和控制功能
 */
export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    isOnline: true,
    queueLength: 0,
    lastSyncTime: 0
  });
  
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // 更新同步状态
  const updateSyncStatus = useCallback(() => {
    const status = optimizedDataSyncService.getSyncStatus();
    setSyncStatus({
      isSyncing: status.isSyncing,
      isOnline: status.online,
      queueLength: 0, // 新的同步服务没有队列长度，保持为0
      lastSyncTime: status.lastSyncTime || 0
    });
  }, []);

  // 监听同步状态变化
  useEffect(() => {
    // 初始更新
    updateSyncStatus();
    
    // 定时更新状态
    const interval = setInterval(updateSyncStatus, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [updateSyncStatus]);

  // 手动同步所有数据
  const syncAllData = useCallback(async () => {
    setIsManualSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await optimizedDataSyncService.syncAllData();
      setSyncResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
      setSyncResult(errorResult);
      return errorResult;
    } finally {
      setIsManualSyncing(false);
    }
  }, []);

  // 立即同步
  const triggerSync = useCallback(() => {
    optimizedDataSyncService.triggerSync();
  }, []);

  // 设置同步间隔
  const setSyncInterval = useCallback((minutes: number) => {
    backgroundSyncService.setSyncInterval(minutes);
  }, []);

  // 获取后台同步服务状态
  const getBackgroundSyncStatus = useCallback(() => {
    return backgroundSyncService.getStatus();
  }, []);

  return {
    // 状态
    syncStatus,
    isManualSyncing,
    syncResult,
    
    // 操作
    syncAllData,
    triggerSync,
    setSyncInterval,
    getBackgroundSyncStatus,
    
    // 工具函数
    updateSyncStatus
  };
};