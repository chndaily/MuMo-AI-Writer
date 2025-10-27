import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Tag, Descriptions, Space, List } from 'antd';
import type { PromptCollection, PromptMessage, PromptModel } from '#/promptLibrary';
import { PromptType } from '#/promptLibrary';

const { Title, Text } = Typography;

// 经典模型推荐配置
const modelRecommendations = [
  {
    id: "openai/gpt-4o-mini-2024-07-18",
    name: "GPT-4o mini",
    strengths: "快速、经济高效",
    useCase: "通用写作、快速生成"
  },
  {
    id: "openai/gpt-4o-2024-05-13",
    name: "GPT-4o",
    strengths: "强大的理解和生成能力",
    useCase: "复杂创作、深度分析"
  },
  {
    id: "anthropic/claude-3.7-sonnet:beta",
    name: "Claude 3.7 Sonnet",
    strengths: "出色的上下文理解",
    useCase: "长篇创作、复杂对话"
  },
  {
    id: "anthropic/claude-3.5-sonnet:beta",
    name: "Claude 3.5 Sonnet",
    strengths: "平衡的性能，良好的创意写作能力",
    useCase: "创意写作、角色对话"
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini 1.5 Pro",
    strengths: "强大的多模态能力",
    useCase: "技术写作、逻辑分析"
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini 1.5 Flash",
    strengths: "快速响应，良好的多语言支持",
    useCase: "快速生成、多语言内容"
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    strengths: "优秀的法语支持，良好的代码生成能力",
    useCase: "多语言写作、代码辅助"
  },
  {
    id: "cohere/command-r-plus-04-2024",
    name: "Cohere Command R+",
    strengths: "强大的检索增强生成能力",
    useCase: "事实性内容、研究写作"
  }
];

interface PromptDetailProps {
  collection: PromptCollection
}

const PromptDetail: React.FC<PromptDetailProps> = ({ collection }) => {
  const { promptId } = useParams();
  
  // 获取提示词类型标签 - 修改为中文显示
  const getPromptTypeTag = (type: PromptType) => {
    const typeMap: Record<PromptType, { label: string; color: string }> = {
      'Other': { label: '其它（Other）', color: 'default' },
      'Component': { label: '组件（Component）', color: 'blue' },
      'scene-character-detection': { label: '场景角色检测（Scene Character Detection）', color: 'purple' },
      'scene-summarization': { label: '场景摘要（Scene Summary）', color: 'cyan' },
      'scene-beat-completion': { label: '场景补全（Scene Completion）', color: 'green' },
      'manuscript-completion': { label: '文稿补全（Manuscript Completion）', color: 'orange' },
      'manuscript-replacement': { label: '文本替换（Text Replacement）', color: 'red' },
      'workshop-chat': { label: '工作坊对话（Workshop Chat）', color: 'magenta' },
    };
    
    return <Tag color={typeMap[type]?.color || 'default'}>{typeMap[type]?.label || type}</Tag>;
  };
  
  // 渲染消息内容
  const renderMessageContent = (message: PromptMessage) => {
    return (
      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {message.text}
      </div>
    );
  };
  
  // 获取模型的推荐信息
  const getModelRecommendation = (model: PromptModel) => {
    return modelRecommendations.find(rec => rec.id === model.id);
  };
  
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4}>提示词详情（Prompt Details）</Title>
      
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="名称（Name）">{collection.attributes.name}</Descriptions.Item>
        <Descriptions.Item label="类型（Type）">
          {getPromptTypeTag(collection.attributes.type)}
        </Descriptions.Item>
        <Descriptions.Item label="描述（Description）">
          {collection.attributes.description || '无描述（No description）'}
        </Descriptions.Item>
        <Descriptions.Item label="所有者（Owner）">
          <Text type={collection.relationships.owner.id === 'system' ? 'success' : 'secondary'}>
            {collection.relationships.owner.id === 'system' ? '系统（System）' : '用户（User）'}
          </Text>
        </Descriptions.Item>
      </Descriptions>
      
      {/* 模型配置简化展示 */}
      {collection.attributes.models && collection.attributes.models.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Title level={5}>推荐模型配置（Recommended Model Configuration）</Title>
          <List
            dataSource={collection.attributes.models.filter(model => model.id)}
            renderItem={(model) => {
              const recommendation = getModelRecommendation(model);
              return (
                <List.Item>
                  <Space direction="vertical">
                    <Space>
                      <Text strong>{model.name || model.id}</Text>
                      {recommendation && <Tag color="blue">{recommendation.strengths}</Tag>}
                    </Space>
                    {recommendation && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        推荐用途: {recommendation.useCase}
                      </Text>
                    )}
                    {model.temperature !== undefined && (
                      <Text type="secondary">
                        Temperature: {model.temperature}
                      </Text>
                    )}
                    {model.topP !== undefined && (
                      <Text type="secondary">
                        Top P: {model.topP}
                      </Text>
                    )}
                  </Space>
                </List.Item>
              );
            }}
          />
        </div>
      )}
      
      <div style={{ marginTop: 16, flex: 1, overflow: 'auto' }}>
        <Title level={5}>消息内容（Message Content）</Title>
        {collection.attributes.messages.map((message, index) => (
          <Card 
            size="small" 
            title={
              <Space>
                <Tag color={message.type === 'system' ? 'blue' : message.type === 'user' ? 'green' : 'purple'}>
                  {message.type === 'system' ? '系统（System）' : message.type === 'user' ? '用户（User）' : '助手（Assistant）'}
                </Tag>
                <Text ellipsis style={{ maxWidth: 300 }}>
                  {message.text.substring(0, 50)}{message.text.length > 50 ? '...' : ''}
                </Text>
              </Space>
            } 
            key={index}
            style={{ marginBottom: 8 }}
          >
            {renderMessageContent(message)}
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default PromptDetail;