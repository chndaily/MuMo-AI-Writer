import React, { useMemo } from 'react';
import { Card, Typography, Tag, Space, Collapse } from 'antd';
import type { Collection, PromptCollection, ModelCollection, PersonaCollection } from '#/promptLibrary';
import { CollectionType, PromptType } from '#/promptLibrary';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface PromptLibraryManagerProps {
  collections: Collection[];
}

const PromptLibraryManager: React.FC<PromptLibraryManagerProps> = ({ collections }) => {
  // 按类型分组提示词
  const groupedCollections = useMemo(() => {
    const groups: Record<string, Collection[]> = {
      'modelBanks': [],
      'promptDefaults': [],
      'promptPersonas': [],
      'prompts': [],
    };

    collections.forEach(collection => {
      if (collection.type in groups) {
        groups[collection.type].push(collection);
      }
    });

    return groups;
  }, [collections]);

  // 获取提示词类型标签
  const getPromptTypeTag = (type: PromptType) => {
    const typeMap: Record<PromptType, { label: string; color: string }> = {
      'Other': { label: '其它', color: 'default' },
      'Component': { label: '组件', color: 'blue' },
      'scene-character-detection': { label: '场景角色检测', color: 'purple' },
      'scene-summarization': { label: '场景摘要', color: 'cyan' },
      'scene-beat-completion': { label: '场景补全', color: 'green' },
      'manuscript-completion': { label: '文稿补全', color: 'orange' },
      'manuscript-replacement': { label: '文本替换', color: 'red' },
      'workshop-chat': { label: '工作坊对话', color: 'magenta' },
    };
    
    return <Tag color={typeMap[type]?.color || 'default'}>{typeMap[type]?.label || type}</Tag>;
  };

  // 渲染模型集合
  const renderModelCollections = () => {
    if (groupedCollections['modelBanks'].length === 0) {
      return <Text type="secondary">暂无模型集合</Text>;
    }

    return (
      <Collapse>
        {groupedCollections['modelBanks'].map((collection) => (
          <Panel
            header={
              <Space>
                <Text strong>{collection.attributes.name}</Text>
                {collection.relationships?.owner?.id === 'system' && (
                  <Tag color="success">系统</Tag>
                )}
              </Space>
            }
            key={collection.id}
          >
            <Space wrap>
              {(collection as ModelCollection).attributes.models.map((model) => (
                <Tag key={model.internalId}>
                  {model.name}
                </Tag>
              ))}
            </Space>
          </Panel>
        ))}
      </Collapse>
    );
  };

  // 渲染提示词集合
  const renderPromptCollections = () => {
    if (groupedCollections['prompts'].length === 0) {
      return <Text type="secondary">暂无自定义提示词</Text>;
    }

    return (
      <Collapse>
        {groupedCollections['prompts'].map((collection) => (
          <Panel
            header={
              <Space>
                <Text strong>{collection.attributes.name}</Text>
                {getPromptTypeTag((collection as PromptCollection).attributes.type)}
                {collection.relationships?.owner?.id === 'system' && (
                  <Tag color="success">系统</Tag>
                )}
              </Space>
            }
            key={collection.id}
          >
            <Text type="secondary" ellipsis style={{ maxWidth: '100%' }}>
              {(collection as PromptCollection).attributes.description || '无描述'}
            </Text>
          </Panel>
        ))}
      </Collapse>
    );
  };

  // 渲染角色设定
  const renderPersonaCollections = () => {
    if (groupedCollections['promptPersonas'].length === 0) {
      return <Text type="secondary">暂无角色设定</Text>;
    }

    return (
      <Collapse>
        {groupedCollections['promptPersonas'].map((collection) => (
          <Panel
            header={
              <Space>
                <Text strong>{collection.attributes.name}</Text>
                {collection.relationships?.owner?.id === 'system' && (
                  <Tag color="success">系统</Tag>
                )}
              </Space>
            }
            key={collection.id}
          >
            <Text type="secondary" ellipsis style={{ maxWidth: '100%' }}>
              {(collection as PersonaCollection).attributes.background || '无背景信息'}
            </Text>
          </Panel>
        ))}
      </Collapse>
    );
  };

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4}>提示词库管理</Title>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Typography.Title level={5}>模型集合</Typography.Title>
        {renderModelCollections()}
        
        <Typography.Title level={5} style={{ marginTop: 16 }}>自定义提示词</Typography.Title>
        {renderPromptCollections()}
        
        <Typography.Title level={5} style={{ marginTop: 16 }}>角色设定</Typography.Title>
        {renderPersonaCollections()}
      </div>
    </Card>
  );
};

export default PromptLibraryManager;