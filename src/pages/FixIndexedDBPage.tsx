import React, { useState } from 'react';
import { Button, Card, message, Space, Typography } from 'antd';
import { fixIndexedDBIssues } from '@/utils/databaseFix';

const { Title, Paragraph } = Typography;

const FixIndexedDBPage: React.FC = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleFix = async () => {
    setIsFixing(true);
    setLogs([]);
    
    try {
      // 重定向控制台输出到状态
      const originalLog = console.log;
      const originalError = console.error;
      
      console.log = (...args) => {
        const message = args.join(' ');
        setLogs(prev => [...prev, `[INFO] ${message}`]);
        originalLog(...args);
      };
      
      console.error = (...args) => {
        const message = args.join(' ');
        setLogs(prev => [...prev, `[ERROR] ${message}`]);
        originalError(...args);
      };
      
      // 执行修复
      await fixIndexedDBIssues();
      
      message.success('IndexedDB修复完成！');
    } catch (error) {
      console.error('修复过程中发生错误:', error);
      message.error('修复过程中发生错误: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>修复IndexedDB问题</Title>
        
        <Paragraph>
          此工具用于修复IndexedDB数据库中的userId索引和数据问题。
        </Paragraph>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            type="primary" 
            onClick={handleFix} 
            loading={isFixing}
            disabled={isFixing}
          >
            {isFixing ? '修复中...' : '开始修复'}
          </Button>
          
          {logs.length > 0 && (
            <Card title="修复日志" size="small">
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                {logs.map((log, index) => (
                  <div key={index} style={{ 
                    color: log.includes('[ERROR]') ? '#ff4d4f' : 
                          log.includes('[INFO]') ? '#1890ff' : 
                          '#52c41a'
                  }}>
                    {log}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default FixIndexedDBPage;