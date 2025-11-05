import React, { useState, useEffect } from 'react';
import { 
  SyncOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  ReloadOutlined,
  CloudSyncOutlined,
  CloudOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { 
  Badge, 
  Tooltip, 
  Progress, 
  Button, 
  Space, 
  Typography,
  Card,
  Divider
} from 'antd';
import { optimizedDataSyncService } from '@/services/optimizedDataSyncService';
import { eventBus } from '@/utils/eventBus';

const { Text } = Typography;

/**
 * 数据同步状态监控组件
 */
const SyncStatusMonitor: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    isOnline: true,
    queueLength: 0,
    lastSyncTime: 0
  });
  
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncMessage, setLastSyncMessage] = useState('');

  // 定期更新同步状态
  useEffect(() => {
    const updateStatus = () => {
      const status = optimizedDataSyncService.getSyncStatus();
      // 转换状态格式以匹配组件期望的格式
      const convertedStatus = {
        isSyncing: status.isSyncing,
        isOnline: status.online,
        queueLength: 0, // 新服务没有队列长度概念
        lastSyncTime: status.lastSyncTime || 0
      };
      setSyncStatus(convertedStatus);
      
      // 根据队列长度计算进度（简化处理）
      if (convertedStatus.queueLength > 0) {
        setSyncProgress(Math.min(90, 100 - convertedStatus.queueLength * 10));
      } else if (convertedStatus.isSyncing) {
        setSyncProgress(90);
      } else {
        setSyncProgress(100);
      }
    };
    
    // 初始更新
    updateStatus();
    
    // 监听同步事件
    const handleSyncStarted = () => {
      setLastSyncMessage('开始同步...');
      updateStatus();
    };
    
    const handleSyncCompleted = (data: { success: boolean; error?: string }) => {
      if (data.success) {
        setLastSyncMessage('同步完成');
      } else {
        setLastSyncMessage(`同步失败: ${data.error || '未知错误'}`);
      }
      updateStatus();
    };
    
    eventBus.on('syncStarted', handleSyncStarted);
    eventBus.on('syncCompleted', handleSyncCompleted);
    
    // 定时更新状态
    const interval = setInterval(updateStatus, 1000);
    
    // 清理函数
    return () => {
      clearInterval(interval);
      eventBus.off('syncStarted', handleSyncStarted);
      eventBus.off('syncCompleted', handleSyncCompleted);
    };
  }, []);

  // 手动触发同步
  const handleManualSync = () => {
    setLastSyncMessage('正在同步...');
    optimizedDataSyncService.triggerSync();
  };

  // 格式化最后同步时间
  const formatLastSyncTime = (timestamp: number): string => {
    if (timestamp === 0) {
      return '从未同步';
    }
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  // 获取网络状态图标
  const getNetworkStatusIcon = () => {
    if (syncStatus.isOnline) {
      return <CloudOutlined style={{ color: '#52c41a' }} />;
    } else {
      return <CloudOutlined style={{ color: '#ff4d4f' }} />;
    }
  };

  // 获取同步状态图标
  const getSyncStatusIcon = () => {
    if (syncStatus.isSyncing) {
      return <SyncOutlined spin style={{ color: '#1890ff' }} />;
    } else if (syncStatus.queueLength > 0) {
      return <ReloadOutlined style={{ color: '#faad14' }} />;
    } else {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
  };

  return (
    <Card size="small" style={{ width: 300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Tooltip title={syncStatus.isOnline ? '网络连接正常' : '网络连接断开'}>
            {getNetworkStatusIcon()}
          </Tooltip>
          <Tooltip title={syncStatus.isSyncing ? '正在同步' : syncStatus.queueLength > 0 ? '等待同步' : '同步完成'}>
            {getSyncStatusIcon()}
          </Tooltip>
          <Text strong>数据同步</Text>
        </Space>
        <Button 
          type="primary" 
          size="small" 
          icon={<CloudSyncOutlined />}
          onClick={handleManualSync}
          disabled={!syncStatus.isOnline}
        >
          同步
        </Button>
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary">同步进度</Text>
        <Progress 
          percent={syncProgress} 
          size="small" 
          status={syncStatus.isSyncing ? 'active' : 'success'} 
        />
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <Space direction="vertical" size={2}>
          <Text type="secondary">状态详情</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            网络: {syncStatus.isOnline ? '在线' : '离线'}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            同步队列: {syncStatus.queueLength} 项
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            最后同步: {formatLastSyncTime(syncStatus.lastSyncTime)}
          </Text>
        </Space>
      </div>
      
      {lastSyncMessage && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">{lastSyncMessage}</Text>
        </div>
      )}
    </Card>
  );
};

export default SyncStatusMonitor;