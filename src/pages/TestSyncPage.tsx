import React, { useState } from 'react';
import { Card, Button, Space, Typography, message, Alert } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { optimizedDataSyncService } from '@/services/optimizedDataSyncService';

const { Title, Text } = Typography;

/**
 * 测试同步功能页面
 */
const TestSyncPage: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // 添加日志
  const addLog = (log: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  // 手动同步所有数据
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setLogs([]);
    
    addLog('开始手动同步所有数据...');
    
    try {
      const result = await optimizedDataSyncService.syncAllData();
      setSyncResult({
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        message.success('数据同步完成');
        addLog('数据同步成功完成');
      } else {
        message.error('数据同步失败');
        addLog(`数据同步失败: ${result.message}`);
      }
    } catch (error) {
      console.error('数据同步时出错:', error);
      addLog(`数据同步时出错: ${error instanceof Error ? error.message : '未知错误'}`);
      setSyncResult({
        success: false,
        message: `数据同步失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
      message.error('数据同步失败');
    } finally {
      setIsSyncing(false);
      addLog('同步过程结束');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3}>
          <SyncOutlined /> 测试同步功能
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<SyncOutlined />}
            loading={isSyncing}
            onClick={handleManualSync}
          >
            同步所有数据
          </Button>
        </Space>
      </div>
      
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* 测试区域 */}
        <div style={{ flex: 1 }}>
          <Card title="同步测试">
            <p>点击上面的按钮来测试数据同步功能。</p>
            
            {syncResult && (
              <Alert
                message={syncResult.success ? "同步成功" : "同步失败"}
                description={syncResult.message}
                type={syncResult.success ? "success" : "error"}
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}
            
            <div style={{ marginTop: '24px' }}>
              <Text strong>同步日志:</Text>
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                border: '1px solid #f0f0f0', 
                padding: '12px', 
                marginTop: '8px',
                backgroundColor: '#fafafa',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                ) : (
                  <Text type="secondary">暂无日志</Text>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestSyncPage;