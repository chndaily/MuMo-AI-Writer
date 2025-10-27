import React from 'react';
import { Card, Typography } from 'antd';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';
import { useParams } from 'react-router-dom';

const { Title, Text } = Typography;

const DebugDetail: React.FC = () => {
  const { promptId } = useParams();
  const { collections } = usePromptLibraryStore();
  
  const selectedCollection = collections.find(d => d.id === promptId);

  return (
    <Card style={{ height: '100%' }}>
      <Title level={4}>调试信息</Title>
      <Text>当前路由参数 promptId: {promptId || '未设置'}</Text>
      <div style={{ marginTop: 16 }}>
        <Text strong>选中的集合:</Text>
        <pre>{JSON.stringify(selectedCollection, null, 2)}</pre>
      </div>
      <div style={{ marginTop: 16 }}>
        <Text strong>所有集合数量:</Text> {collections.length}
      </div>
    </Card>
  );
};

export default DebugDetail;