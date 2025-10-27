import React from 'react';
import { Card, Typography, Tag, Space } from 'antd';
import type { PresetCollection } from '#/promptLibrary';

const { Title, Text, Paragraph } = Typography;

interface SimplifiedPresetsDetailProps {
  collection: PresetCollection
}

const SimplifiedPresetsDetail: React.FC<SimplifiedPresetsDetailProps> = ({ collection }) => {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4}>预设详情</Title>
      
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}>{collection.attributes.name}</Title>
            <Tag color="default">预设</Tag>
            <Text type="secondary">{collection.attributes.category}</Text>
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
            <Title level={5} style={{ margin: 0 }}>预设内容</Title>
            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {collection.attributes.content}
            </Paragraph>
          </Space>
        </Card>
        
        <Card size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0 }}>使用说明</Title>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              <li>预设是可重复使用的模板内容</li>
              <li>可以在创作过程中快速插入预设内容</li>
              <li>系统预设不可编辑，用户可创建自定义预设</li>
            </ul>
          </Space>
        </Card>
      </Space>
    </Card>
  );
};

export default SimplifiedPresetsDetail;