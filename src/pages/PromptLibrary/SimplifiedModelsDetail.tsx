import React from 'react';
import { Card, Typography, Tag, Descriptions, Space, List } from 'antd';
import { ModelCollection, PromptModel } from '#/promptLibrary';

const { Title, Text } = Typography;

interface SimplifiedModelsDetailProps {
  collection: ModelCollection
}

// 经典模型推荐配置
const modelRecommendations = [
  {
    id: "openai/gpt-4o-mini-2024-07-18",
    name: "GPT-4o mini（聊天模型）",
    strengths: "快速、经济高效，适合大多数日常任务",
    temperature: 0.7,
    useCase: "通用写作、快速生成"
  },
  {
    id: "openai/gpt-4o-2024-05-13",
    name: "GPT-4o（全能模型）",
    strengths: "强大的理解和生成能力，优秀的多语言支持",
    temperature: 0.7,
    useCase: "复杂创作、深度分析"
  },
  {
    id: "anthropic/claude-3.7-sonnet:beta",
    name: "Claude 3.7 Sonnet（长文模型）",
    strengths: "出色的上下文理解，优秀的长文本处理能力",
    temperature: 1.0,
    useCase: "长篇创作、复杂对话"
  },
  {
    id: "anthropic/claude-3.5-sonnet:beta",
    name: "Claude 3.5 Sonnet（创意模型）",
    strengths: "平衡的性能，良好的创意写作能力",
    temperature: 1.0,
    useCase: "创意写作、角色对话"
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini 1.5 Pro（逻辑模型）",
    strengths: "强大的多模态能力，优秀的逻辑推理",
    temperature: 0.7,
    useCase: "技术写作、逻辑分析"
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini 1.5 Flash（快速模型）",
    strengths: "快速响应，良好的多语言支持",
    temperature: 0.7,
    useCase: "快速生成、多语言内容"
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large（多语模型）",
    strengths: "优秀的法语支持，良好的代码生成能力",
    temperature: 0.7,
    useCase: "多语言写作、代码辅助"
  },
  {
    id: "cohere/command-r-plus-04-2024",
    name: "Cohere Command R+（检索模型）",
    strengths: "强大的检索增强生成能力，优秀的事实准确性",
    temperature: 0.7,
    useCase: "事实性内容、研究写作"
  }
];

const SimplifiedModelsDetail: React.FC<SimplifiedModelsDetailProps> = ({ collection }) => {
  // 获取模型的推荐信息
  const getModelRecommendation = (model: PromptModel) => {
    return modelRecommendations.find(rec => rec.id === model.id);
  };

  // 修改模型名称显示逻辑
  const getDisplayName = (modelName: string) => {
    switch (modelName) {
      case "Default Chat Models":
        return "聊天模型（Chat Models）";
      case "Default Summarization":
        return "摘要模型（Summarization Models）";
      case "Default Text Replacements":
        return "文本替换模型（Text Replacement Models）";
      case "Default Writing Models":
        return "写作模型（Writing Models）";
      default:
        return modelName;
    }
  };

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4}>模型集合详情（Model Collection Details）</Title>
      <Text type="secondary" style={{ marginBottom: 16 }}>
        {getDisplayName(collection.attributes.name)}
      </Text>
      
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="模型数量（Model Count）">{collection.attributes.models.length}</Descriptions.Item>
        <Descriptions.Item label="所有者（Owner）">
          <Text type={collection.relationships.owner.id === 'system' ? 'success' : 'secondary'}>
            {collection.relationships.owner.id === 'system' ? '系统（System）' : '用户（User）'}
          </Text>
        </Descriptions.Item>
      </Descriptions>
      
      <Title level={5} style={{ marginTop: 16 }}>模型列表（Model List）</Title>
      <List
        dataSource={collection.attributes.models}
        renderItem={(model) => {
          const recommendation = getModelRecommendation(model);
          return (
            <List.Item>
              <Card size="small" style={{ width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>{model.name}</Text>
                    {collection.relationships.owner.id === 'system' && (
                      <Tag color="success">系统（System）</Tag>
                    )}
                  </Space>
                  
                  {model.id && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      ID: {model.id}
                    </Text>
                  )}
                  
                  {recommendation ? (
                    <>
                      <Text type="secondary">
                        <strong>特点（Strengths）:</strong> {recommendation.strengths}
                      </Text>
                      <Text type="secondary">
                        <strong>推荐用途（Recommended Use）:</strong> {recommendation.useCase}
                      </Text>
                      <Text type="secondary">
                        <strong>建议温度（Suggested Temperature）:</strong> {recommendation.temperature}
                      </Text>
                    </>
                  ) : (
                    <>
                      {model.temperature !== undefined && (
                        <Text type="secondary">
                          <strong>Temperature:</strong> {model.temperature}
                        </Text>
                      )}
                      {model.topP !== undefined && (
                        <Text type="secondary">
                          <strong>Top P:</strong> {model.topP}
                        </Text>
                      )}
                      {model.maxTokens !== undefined && (
                        <Text type="secondary">
                          <strong>Max Tokens:</strong> {model.maxTokens}
                        </Text>
                      )}
                    </>
                  )}
                </Space>
              </Card>
            </List.Item>
          );
        }}
      />
      
      <Title level={5} style={{ marginTop: 16 }}>使用建议（Usage Recommendations）</Title>
      <Card size="small">
        <ul style={{ paddingLeft: 20 }}>
          <li>选择模型时考虑任务类型和性能要求（Consider task type and performance requirements when selecting models）</li>
          <li>Temperature参数控制创造性：值越高越随机，越低越确定（Temperature controls creativity: higher values are more random, lower values are more deterministic）</li>
          <li>对于创意写作，建议使用较高Temperature值（0.8-1.0）（For creative writing, use higher Temperature values (0.8-1.0)）</li>
          <li>对于技术文档，建议使用较低Temperature值（0.2-0.5）（For technical documents, use lower Temperature values (0.2-0.5)）</li>
        </ul>
      </Card>
    </Card>
  );
};

export default SimplifiedModelsDetail;