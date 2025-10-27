import React from 'react';
import { Card, Typography, Button } from 'antd';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';

const { Title, Text } = Typography;

const SimpleTest: React.FC = () => {
  const { collections } = usePromptLibraryStore();
  
  // 按类型统计集合
  const typeCounts: Record<string, number> = {};
  collections.forEach(collection => {
    const type = collection.type;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return (
    <Card style={{ height: '100%' }}>
      <Title level={4}>提示词库简单测试</Title>
      <Text>总集合数: {collections.length}</Text>
      
      <div style={{ marginTop: 16 }}>
        <Text strong>按类型统计:</Text>
        <ul>
          {Object.entries(typeCounts).map(([type, count]) => (
            <li key={type}>{type}: {count}</li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginTop: 16 }}>
        <Button 
          onClick={() => window.location.reload()} 
          type="primary"
        >
          刷新页面
        </Button>
      </div>
    </Card>
  );
};

export default SimpleTest;