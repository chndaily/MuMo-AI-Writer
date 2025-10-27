import React from 'react';
import { Button, Space, List, Typography, Avatar } from 'antd';
import {
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons';

interface NavigationPanelProps {
  versionHistory: string[];
  isImmersiveMode: boolean;
  onToggleImmersiveMode: () => void;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  versionHistory,
  isImmersiveMode,
  onToggleImmersiveMode
}) => {
  return (
    <div className="navigation-panel">
      <div className="version-history">
        <h5>版本历史</h5>
        <List
          size="small"
          dataSource={versionHistory}
          renderItem={(item, index) => (
            <List.Item>
              <Typography.Text mark>版本 {index + 1}</Typography.Text> {item}
            </List.Item>
          )}
        />
      </div>
      
      <div className="immersion-mode">
        <h5>沉浸模式</h5>
        <Space direction="vertical">
          <div style={{ fontSize: '12px', color: '#666' }}>沉浸模式提供无干扰的创作环境</div>
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={onToggleImmersiveMode}
          >
            {isImmersiveMode ? '退出沉浸模式' : '进入沉浸模式'}
          </Button>
        </Space>
      </div>
      
      <div className="character-perspective">
        <h5>角色视角</h5>
        <Space>
          <Avatar 
            size="large" 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#1890ff' }}
          />
          <Avatar 
            size="large" 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#52c41a' }}
          />
          <Avatar 
            size="large" 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#faad14' }}
          />
        </Space>
      </div>
    </div>
  );
};

export default NavigationPanel;