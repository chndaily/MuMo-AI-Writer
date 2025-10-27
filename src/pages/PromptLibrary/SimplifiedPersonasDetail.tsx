import React from 'react';
import { Card, Typography, Tag, Space } from 'antd';
import type { PersonaCollection } from '#/promptLibrary';

const { Title, Text, Paragraph } = Typography;

interface SimplifiedPersonasDetailProps {
  collection: PersonaCollection
}

const SimplifiedPersonasDetail: React.FC<SimplifiedPersonasDetailProps> = ({ collection }) => {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4}>角色设定详情</Title>
      
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}>{collection.attributes.name}</Title>
            <Tag color="purple">角色设定</Tag>
            {collection.attributes.background && (
              <Paragraph type="secondary" style={{ margin: 0 }}>
                {collection.attributes.background}
              </Paragraph>
            )}
          </Space>
        </Card>
        
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>所有者: </Text>
            <Text type={collection.relationships.owner.id === 'system' ? 'success' : 'secondary'}>
              {collection.relationships.owner.id === 'system' ? '系统' : '用户'}
            </Text>
          </Space>
        </Card>
        
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}>角色性格</Title>
            {collection.attributes.personality && collection.attributes.personality.length > 0 ? (
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {collection.attributes.personality.map((trait, index) => (
                  <li key={index}>{trait}</li>
                ))}
              </ul>
            ) : (
              <Text type="secondary">暂无性格描述</Text>
            )}
          </Space>
        </Card>
        
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}>角色内容</Title>
            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {collection.attributes.content}
            </Paragraph>
          </Space>
        </Card>
        
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}>使用说明</Title>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>角色设定用于定义AI助手的性格和行为特征</li>
              <li>可以在聊天中激活角色设定以获得一致的回应风格</li>
              <li>系统角色设定不可编辑，用户可创建自定义角色</li>
            </ul>
          </Space>
        </Card>
      </Space>
    </Card>
  );
};

export default SimplifiedPersonasDetail;