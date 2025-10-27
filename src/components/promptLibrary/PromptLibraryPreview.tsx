import React from 'react';
import { Card, Typography, Tag, Space, List, Collapse, Row, Col } from 'antd';
import type { Collection, ModelCollection, PromptCollection } from '#/promptLibrary';
import { CollectionType, PromptType } from '#/promptLibrary';
import { extractPromptLibraryContext } from '@/utils/promptLibraryUtils';
import { isCaseLibraryCollection } from '@/utils/caseLibraryUtils';
import { TagsOutlined, ThunderboltOutlined, ApiOutlined, DatabaseOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface PromptLibraryPreviewProps {
  collections: Collection[];
}

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

// 提示词类型映射
const promptTypeMap: Record<PromptType, { label: string; color: string; category: string }> = {
  'Other': { label: '案例库（Case Library）', color: 'default', category: '案例库类（Case Library）' },
  'Component': { label: '提示词组件（Prompt Components）', color: 'blue', category: '创作辅助类（Creative Assistance）' },
  'scene-character-detection': { label: '场景角色检测（Scene Character Detection）', color: 'purple', category: '内容处理类（Content Processing）' },
  'scene-summarization': { label: '场景摘要（Scene Summaries）', color: 'cyan', category: '内容处理类（Content Processing）' },
  'scene-beat-completion': { label: '场景补全（Scene Completions）', color: 'green', category: '内容处理类（Content Processing）' },
  'manuscript-completion': { label: '文稿补全（Manuscript Completion）', color: 'orange', category: '文本编辑类（Text Editing）' },
  'manuscript-replacement': { label: '文本替换（Text Replacement）', color: 'red', category: '文本编辑类（Text Editing）' },
  'workshop-chat': { label: '工作坊对话（Workshop Chats）', color: 'magenta', category: '创作辅助类（Creative Assistance）' },
};

const PromptLibraryPreview: React.FC<PromptLibraryPreviewProps> = ({ collections }) => {
  // 获取模型集合
  const modelCollections = collections.filter(collection => collection.type === 'modelBanks') as ModelCollection[];
  
  // 获取推荐模型信息
  const getRecommendedModels = () => {
    const recommendedModels = [];
    
    modelCollections.forEach(collection => {
      collection.attributes.models.forEach(model => {
        const recommendation = modelRecommendations.find(rec => rec.id === model.id);
        if (recommendation) {
          recommendedModels.push({
            name: model.name,
            ...recommendation
          });
        }
      });
    });
    
    return recommendedModels.slice(0, 8); // 只返回前8个推荐模型
  };
  
  // 获取案例库类集合
  const caseLibraryCollections = collections.filter(isCaseLibraryCollection);
  
  // 获取其他提示词集合（非案例库类）
  const otherPromptCollections = collections.filter(collection => 
    collection.type === CollectionType.Prompts && !isCaseLibraryCollection(collection)
  ) as PromptCollection[];
  
  // 按分类对提示词进行分组
  const groupPromptsByCategory = () => {
    const groups: Record<string, { category: string; color: string; collections: PromptCollection[] }> = {};
    
    otherPromptCollections.forEach(collection => {
      const typeInfo = promptTypeMap[collection.attributes.type];
      if (typeInfo) {
        const categoryKey = typeInfo.category;
        if (!groups[categoryKey]) {
          groups[categoryKey] = {
            category: typeInfo.category,
            color: typeInfo.color,
            collections: []
          };
        }
        groups[categoryKey].collections.push(collection);
      }
    });
    
    return groups;
  };
  
  const promptGroups = groupPromptsByCategory();
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={3} style={{ marginBottom: 24, color: '#1d39c4' }}>
        <Space>
          <TagsOutlined />
          <span>提示词库预览</span>
        </Space>
      </Title>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* 推荐模型 */}
        {getRecommendedModels().length > 0 && (
          <Card 
            size="small" 
            style={{ marginBottom: 24 }}
            title={
              <Space>
                <ThunderboltOutlined />
                <span>推荐模型</span>
              </Space>
            }
          >
            <List
              dataSource={getRecommendedModels()}
              renderItem={item => (
                <List.Item>
                  <Card size="small" className="w-full hover:shadow-md transition-shadow">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>{item.name}</Text>
                      <Tag color="blue">{item.strengths}</Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>{item.useCase}</Text>
                    </Space>
                  </Card>
                </List.Item>
              )}
              grid={{ gutter: 16, column: 2 }}
            />
          </Card>
        )}
        
        {/* 提示词集合展示 */}
        {Object.keys(promptGroups).length > 0 && (
          <Card 
            size="small" 
            style={{ marginBottom: 24 }}
            title={
              <Space>
                <ApiOutlined />
                <span>提示词集合</span>
              </Space>
            }
          >
            <Collapse ghost size="small">
              {Object.entries(promptGroups).map(([categoryKey, group]) => (
                <Panel
                  header={
                    <Space>
                      <Text strong>{group.category}</Text>
                      <Tag color={group.color}>{group.collections.length} 个集合</Tag>
                    </Space>
                  }
                  key={categoryKey}
                >
                  <Row gutter={[16, 16]}>
                    {group.collections.map(collection => (
                      <Col span={12} key={collection.id}>
                        <Card size="small" className="hover:shadow-md transition-shadow">
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {collection.attributes.name}
                          </Text>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Panel>
              ))}
            </Collapse>
          </Card>
        )}
        
        {/* 案例库统计 */}
        {caseLibraryCollections.length > 0 && (
          <Card 
            size="small" 
            style={{ marginBottom: 24 }}
            title={
              <Space>
                <DatabaseOutlined />
                <span>案例库统计</span>
              </Space>
            }
          >
            <Text>案例库集合数量: {caseLibraryCollections.length}</Text>
            
            <Collapse ghost size="small" style={{ marginTop: 8 }}>
              {caseLibraryCollections.map((collection: any) => {
                const attachments = collection.attributes.attachments || [];
                return (
                  <Panel
                    header={
                      <Space>
                        <Text strong>{collection.attributes.name}</Text>
                        <Tag color="purple">{attachments.length} 个附件</Tag>
                      </Space>
                    }
                    key={collection.id}
                  >
                    <Row gutter={[16, 16]}>
                      {attachments.length > 0 ? (
                        attachments.map((att: any) => (
                          <Col span={12} key={att.id}>
                            <Card size="small">
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {att.name} ({(att.size / 1024).toFixed(1)}KB)
                              </Text>
                            </Card>
                          </Col>
                        ))
                      ) : (
                        <Col span={24}>
                          <Card size="small">
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              暂无附件
                            </Text>
                          </Card>
                        </Col>
                      )}
                    </Row>
                  </Panel>
                );
              })}
            </Collapse>
          </Card>
        )}
        
        {/* 使用说明 */}
        <Card 
          size="small"
          title={
            <Space>
              <BulbOutlined />
              <span>使用说明</span>
            </Space>
          }
        >
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>
              <Text>提示词库中的内容将作为AI创作的参考上下文</Text>
            </li>
            <li style={{ marginBottom: 8 }}>
              <Text>案例库中的附件内容会在AI聊天时自动作为知识库调用</Text>
            </li>
            <li style={{ marginBottom: 8 }}>
              <Text>可以上传txt文件作为案例库附件，支持整篇小说和长篇经典章节</Text>
            </li>
            <li>
              <Text>AI会根据创作主题自动匹配相关的案例库内容</Text>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default PromptLibraryPreview;