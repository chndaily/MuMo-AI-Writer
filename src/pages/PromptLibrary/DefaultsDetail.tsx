import React from 'react';
import { Card, Typography, Descriptions, Tag, Space } from 'antd';
import type { DefaultPromptCollection } from '#/promptLibrary';

const { Title, Text } = Typography;

interface DefaultsDetailProps {
  collection: DefaultPromptCollection
}

const DefaultsDetail: React.FC<DefaultsDetailProps> = ({ collection }) => {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4}>默认设置详情</Title>
      <Text type="secondary" style={{ marginBottom: 16 }}>
        {collection.attributes.name}
      </Text>
      
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="类型">
          <Tag color="blue">默认设置</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="分类">{collection.attributes.category}</Descriptions.Item>
        <Descriptions.Item label="所有者">
          <Text type={collection.relationships.owner.id === 'system' ? 'success' : 'secondary'}>
            {collection.relationships.owner.id === 'system' ? '系统' : '用户'}
          </Text>
        </Descriptions.Item>
      </Descriptions>
      
      <Title level={5} style={{ marginTop: 16 }}>内容</Title>
      <Card size="small">
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
          {collection.attributes.content}
        </pre>
      </Card>
      
      <Title level={5} style={{ marginTop: 16 }}>使用说明</Title>
      <Card size="small">
        <ul style={{ paddingLeft: 20 }}>
          <li>默认设置用于定义新聊天/节拍等使用的默认提示词</li>
          <li>可以根据不同场景创建多个默认设置</li>
          <li>系统默认设置不可编辑，用户可创建自定义默认设置</li>
        </ul>
      </Card>
    </Card>
  );
};

export default DefaultsDetail;