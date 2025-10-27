import React from 'react';
import { Card, Typography, Tag } from 'antd';

const { Text } = Typography;

interface WritingStatsProps {
  content: string;
  isAIGenerating: boolean;
}

const WritingStats: React.FC<WritingStatsProps> = ({ content, isAIGenerating }) => {
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;
  const paragraphCount = content.split('\n\n').filter(p => p.trim().length > 0).length;
  
  return (
    <div className="writing-stats">
      <Card size="small">
        <Text strong>字数</Text>
        <div>{wordCount.toLocaleString()}</div>
      </Card>
      <Card size="small">
        <Text strong>字符</Text>
        <div>{charCount.toLocaleString()}</div>
      </Card>
      <Card size="small">
        <Text strong>段落</Text>
        <div>{paragraphCount}</div>
      </Card>
      <Card size="small">
        <Text strong>AI状态</Text>
        <div className="ai-status">
          {isAIGenerating ? (
            <Tag color="green">生成中</Tag>
          ) : (
            <Tag>空闲</Tag>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WritingStats;