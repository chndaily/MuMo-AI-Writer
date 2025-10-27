import React from 'react';
import { Card, Typography, Tag, Space, Collapse, Divider, Tabs } from 'antd';
import type { PromptCollection, PromptMessage } from '#/promptLibrary';
import { PromptType } from '#/promptLibrary';
import CaseLibraryPreview from '@/components/promptLibrary/CaseLibraryPreview';
import { UserOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

interface SimplifiedPromptDetailProps {
  collection: PromptCollection
}

// 提示词类型映射 - 修改为中文显示
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

const SimplifiedPromptDetail: React.FC<SimplifiedPromptDetailProps> = ({ collection }) => {
  // 获取提示词类型信息
  const promptTypeInfo = promptTypeMap[collection.attributes.type] || { 
    label: collection.attributes.type, 
    color: 'default',
    category: '未知分类'
  };

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }} className="shadow-sm">
      <Tabs defaultActiveKey="basic" size="small">
        <TabPane tab="基本信息" key="basic">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card size="small" className="shadow-sm">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={4} style={{ margin: 0, color: '#1d39c4' }}>
                  {collection.attributes.name}
                </Title>
                <Space size="small">
                  <Tag color={promptTypeInfo.color}>{promptTypeInfo.label}</Tag>
                  <Tag color="blue">{promptTypeInfo.category}</Tag>
                  {collection.relationships.owner.id === 'system' && (
                    <Tag color="green">系统</Tag>
                  )}
                </Space>
                {collection.attributes.description && (
                  <Paragraph type="secondary" style={{ margin: '12px 0 0 0' }}>
                    {collection.attributes.description}
                  </Paragraph>
                )}
              </Space>
            </Card>
            
            <Card size="small" className="shadow-sm">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={5} style={{ margin: '0 0 12px 0' }}>
                  <UserOutlined /> 所有者信息
                </Title>
                <Text type={collection.relationships.owner.id === 'system' ? 'success' : 'secondary'}>
                  {collection.relationships.owner.id === 'system' ? '系统（System）' : '用户（User）'}
                </Text>
              </Space>
            </Card>
            
            <Card size="small" className="shadow-sm">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={5} style={{ margin: '0 0 12px 0' }}>
                  <FileTextOutlined /> 消息内容
                </Title>
                <Divider style={{ margin: '8px 0' }} />
                <Collapse bordered={false} ghost>
                  {collection.attributes.messages.map((message, index) => (
                    <Panel 
                      header={
                        <Space>
                          <Tag color={message.type === 'system' ? 'blue' : message.type === 'user' ? 'green' : 'purple'}>
                            {message.type === 'system' ? '系统（System）' : message.type === 'user' ? '用户（User）' : '助手（Assistant）'}
                          </Tag>
                          <Text ellipsis style={{ maxWidth: '200px' }}>
                            {message.text.substring(0, 50)}{message.text.length > 50 ? '...' : ''}
                          </Text>
                        </Space>
                      }
                      key={index}
                    >
                      <pre style={{ 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word',
                        fontSize: '12px',
                        margin: 0,
                        padding: '12px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px'
                      }}>
                        {message.text}
                      </pre>
                    </Panel>
                  ))}
                </Collapse>
              </Space>
            </Card>
          </Space>
        </TabPane>
        
        {/* 如果是案例库类集合，显示附件预览 */}
        {collection.attributes.type === PromptType.Other && (
          <TabPane tab="附件内容" key="attachments">
            <CaseLibraryPreview collection={collection} />
          </TabPane>
        )}
      </Tabs>
    </Card>
  );
};

export default SimplifiedPromptDetail;