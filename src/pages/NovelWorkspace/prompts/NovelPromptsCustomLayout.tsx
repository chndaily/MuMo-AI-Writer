import { Button, Collapse, CollapseProps, Flex, Input, Space, Tag, Typography, Divider, Modal, Card, Row, Col, Statistic, Alert } from 'antd';
import { FilterOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, HomeOutlined, BookOutlined, ApiOutlined, FileTextOutlined, TagsOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import { useNovelPromptLibraryStore } from '@/stores/novelPromptLibraryStore';
import { CollectionType, PromptType, Collection, CollectionState, Tag as PromptTag } from '#/promptLibrary';
import { cn, generateUUID } from '@/utils';
import { useParams, useRouter } from '@/router/hooks';
import dayjs from 'dayjs';
import CollectionDetail from '@/pages/PromptLibrary/Detail';
import PromptLibraryPreview from '@/components/promptLibrary/PromptLibraryPreview';
import { useUserInfoId } from '@/stores/userStore';
import EditPromptForm from '@/pages/PromptLibrary/EditPromptForm'; // 恢复使用正式的编辑表单
import { useNavigate } from 'react-router-dom';

// 定义分组类型
interface GroupItem {
  label: string;
  labelPlural: string;
  labelShort: string;
  group: string;
  type: CollectionType | PromptType | string;
  icon: {
    prefix: string;
    iconName: string;
    icon: (number | string | (number | string)[])[];
  };
  description: string;
  hidden?: boolean;
  // 示例类型标识（可选）
  exampleType?: string;
  // 是否为示例项
  isExample?: boolean;
}

// 优化后的分类结构 - 模型管理组
const featuredGroup: GroupItem[] = [
  {
    label: "模型管理（Model Management）",
    labelPlural: "Model Management",
    labelShort: "Models",
    group: "featured",
    type: CollectionType.Models,
    icon: {
      prefix: "far",
      iconName: "rectangle-history",
      icon: [512, 512, [], "e4a2", "M464 224c0-8.8-7.2-16-16-16L64 208c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-224zm-16-64c35.3 0 64 28.7 64 64l0 224c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 224c0-35.3 28.7-64 64-64l384 0zm-8-80c13.3 0 24 10.7 24 24s-10.7 24-24 24L72 128c-13.3 0-24-10.7-24-24s10.7-24 24-24l368 0zM392 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L120 48c-13.3 0-24-10.7-24-24s10.7-24 24-24L392 0z"]
    },
    description: "模型管理和基础配置"
  }
]

// 优化后的分类结构 - 提示词组
const promptsGroup: GroupItem[] = [
  // 角色设定
  {
    label: "角色设定（Character Settings）",
    labelPlural: "Character Settings",
    labelShort: "Personas",
    group: "prompts",
    type: CollectionType.Personas,
    icon: {
      prefix: "far",
      iconName: "user",
      icon: [512, 512, [], "f007", "M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"]
    },
    description: "角色设定和人物塑造"
  },
  // 创作辅助类
  {
    label: "创作辅助类（Creative Assistance）",
    labelPlural: "Creative Assistance",
    labelShort: "Assistance",
    group: "prompts",
    type: "creative-assistance",
    icon: {
      prefix: "far",
      iconName: "lightbulb",
      icon: [384, 512, [], "f0eb", "M144 32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 128 0c35.3 0 64 28.7 64 64l0 224c0 35.3-28.7 64-64 64L64 416c-35.3 0-64-28.7-64-64L0 128C0 92.7 28.7 64 64 64l32 0 0-32zM64 128L256 128l0 224L64 352l0-224zm80 24c-13.3 0-24 10.7-24 24s10.7 24 24 24l48 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-48 0z"]
    },
    description: "创作过程中的辅助工具"
  },
  // 内容处理类
  {
    label: "内容处理类（Content Processing）",
    labelPlural: "Content Processing",
    labelShort: "Processing",
    group: "prompts",
    type: "content-processing",
    icon: {
      prefix: "far",
      iconName: "file-lines",
      icon: [384, 512, [], "f15c", "M256 64c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 32 64 0c35.3 0 64 28.7 64 64l0 32-256 0 0-32c0-35.3 28.7-64 64-64l64 0 0-32zM32 160l256 0 0 32c0 35.3-28.7 64-64 64l-96 0c-35.3 0-64-28.7-64-64l0-32zM0 320c0-17.7 14.3-32 32-32l320 0c17.7 0 32 14.3 32 32l0 32c0 17.7-14.3 32-32 32L32 384c-17.7 0-32-14.3-32-32l0-32z"]
    },
    description: "内容处理和分析工具"
  },
  // 文本编辑类
  {
    label: "文本编辑类（Text Editing）",
    labelPlural: "Text Editing",
    labelShort: "Editing",
    group: "prompts",
    type: "text-editing",
    icon: {
      prefix: "far",
      iconName: "pen-to-square",
      icon: [512, 512, [], "f044", "M290.7 57.4L416 182.7l30.9-30.9c9.4-9.4 24.6-9.4 33.9 0l64 64c9.4 9.4 9.4 24.6 0 33.9l-90.5 90.5c-5.2 5.2-11.5 8.1-18 8.1l-32 0c-17.7 0-32-14.3-32-32l0-32L290.7 178.3c-9.4-9.4-9.4-24.6 0-33.9zM32 32c17.7 0 32 14.3 32 32l0 96 96 0 0-32c0-17.7 14.3-32 32-32l32 0c17.7 0 32 14.3 32 32l0 96L32 256 32 64c0-17.7 14.3-32 32-32zM160 480c-35.3 0-64-28.7-64-64l0-32 128 0 0 32c0 35.3-28.7 64-64 64zm32-240l96 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32z"]
    },
    description: "文本编辑和优化工具"
  },
  // 案例库类
  {
    label: "案例库类（Case Library）",
    labelPlural: "Case Library",
    labelShort: "Cases",
    group: "prompts",
    type: "case-library",
    icon: {
      prefix: "far",
      iconName: "book",
      icon: [448, 512, [], "f02d", "M0 96C0 43 43 0 96 0l96 0 0 190.7c0 2.7 .3 5.4 .8 8.1L96 192c-17.7 0-32 14.3-32 32l0 224c0 17.7 14.3 32 32 32l256 0c17.7 0 32-14.3 32-32l0-224c0-17.7-14.3-32-32-32l-38.4 0 4.8-24.4c.5-2.7 .8-5.4 .8-8.1L352 0l96 0c53 0 96 43 96 96l0 320c0 53-43 96-96 96L96 512c-53 0-96-43-96-96L0 96zM240 256c0-8.8 7.2-16 16-16l32 0c8.8 0 16 7.2 16 16l0 48 48 0c8.8 0 16 7.2 16 16l0 32c0 8.8-7.2 16-16 16l-48 0 0 48c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-48-48 0c-8.8 0-16-7.2-16-16l0-32c0-8.8 7.2-16 16-16l48 0 0-48z"]
    },
    description: "案例和示例库"
  }
]

const CollectionTag = (type: CollectionType) => {
  switch (type) {
    case CollectionType.Personas:
      return <Tag color='purple' bordered={false}>角色</Tag>
    case CollectionType.Models:
      return <Tag color='green' bordered={false}>模型</Tag>
    case CollectionType.Presets:
      return <Tag color='default' bordered={false}>预设</Tag>
    case CollectionType.Defaults:
      return <Tag color='blue' bordered={false}>默认</Tag>
    default:
      return null;
  }
}

// 模型名称显示逻辑
const getModelDisplayName = (modelName: string) => {
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

// 根据自定义类型获取实际的CollectionType
const getActualCollectionType = (customType: string): CollectionType => {
  switch (customType) {
    case "personas":
      return CollectionType.Personas;
    case "models":
      return CollectionType.Models;
    case "defaults":
      return CollectionType.Defaults;
    case "presets":
      return CollectionType.Presets;
    default:
      // 对于提示词相关的自定义类型，返回Prompts
      return CollectionType.Prompts;
  }
};

// 根据自定义类型获取提示词类型
const getPromptTypeFromCustomType = (customType: string): PromptType | null => {
  switch (customType) {
    case "creative-assistance":
      return PromptType.Component; // 默认使用Component类型
    case "content-processing":
      return PromptType.SceneSummarization; // 默认使用SceneSummarization类型
    case "text-editing":
      return PromptType.ManuscriptReplacement; // 默认使用ManuscriptReplacement类型
    case "case-library":
      return PromptType.Other; // 默认使用Other类型
    default:
      return null;
  }
};

const NovelPromptsCustomLayout: React.FC = () => {
  const { styles } = useStyles();
  const { promptId } = useParams()
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const { collections, addCollection, deleteCollection, updateCollection, novelId, refresh } = useNovelPromptLibraryStore()
  const router = useRouter()
  const [newCollection, setNewCollection] = useState<Collection | null>(null)
  const userInfoId = useUserInfoId()

  const selectCollection = (collection: Collection) => {
    if (newCollection && newCollection.id !== collection.id) {
      setNewCollection(null)
    }
    router.prompts(promptId === collection.id ? '' : `/${collection.id}`)
  }

  const onAddCollection = async (type: CollectionType | PromptType | string, exampleType?: string) => {
    if (!collapsed.includes(type.toString())) {
      setCollapsed((state) => [...state, type.toString()]);
    }
    const createdAt = dayjs().toISOString();
    let data: Collection | null = null;
    
    // 模型管理类型
    if (type === CollectionType.Models) {
      data = {
        type: CollectionType.Models,
        attributes: {
          name: '新模型集合',
          models: [],
          // 添加标签
          tags: [
            { id: 'public', name: 'Public', type: 'public' },
            { id: novelId || '', name: `novel-${novelId}`, type: 'novel' }
          ] as PromptTag[]
        },
        id: generateUUID({ prefix: userInfoId.slice(4, 6), length: 28 }),
        meta: {
          state: CollectionState.Active,
          createdAt,
          updatedAt: createdAt
        },
        relationships: {
          owner: {
            id: userInfoId,
            type: 'users'
          }
        }
      }
    }
    // 角色设定类型
    else if (type === CollectionType.Personas) {
      data = {
        type: CollectionType.Personas,
        attributes: {
          name: '新角色设定',
          content: '',
          personality: [],
          background: '',
          // 添加标签
          tags: [
            { id: 'public', name: 'Public', type: 'public' },
            { id: novelId || '', name: `novel-${novelId}`, type: 'novel' }
          ] as PromptTag[]
        },
        id: generateUUID({ prefix: userInfoId.slice(4, 6), length: 28 }),
        meta: {
          state: CollectionState.Active,
          createdAt,
          updatedAt: createdAt
        },
        relationships: {
          owner: {
            id: userInfoId,
            type: 'users'
          }
        }
      }
    }
    // 其他自定义类型（提示词相关）
    else {
      const actualType = getActualCollectionType(type as string);
      const promptType = getPromptTypeFromCustomType(type as string);
      
      if (actualType === CollectionType.Prompts && promptType) {
        // 根据不同的自定义类型设置不同的默认名称
        let defaultName = '新提示词集合';
        if (type === 'case-library') {
          defaultName = '案例小说库';
        } else if (type === 'creative-assistance') {
          defaultName = '创作辅助集合';
        } else if (type === 'content-processing') {
          defaultName = '内容处理集合';
        } else if (type === 'text-editing') {
          defaultName = '文本编辑集合';
        }
        
        data = {
          type: CollectionType.Prompts,
          attributes: {
            type: promptType,
            name: defaultName,
            nsfw: false,
            messages: [{
              type: 'system',
              text: '',
              format: 'aic2'
            }],
            models: [],
            // 添加标签
            tags: [
              { id: 'public', name: 'Public', type: 'public' },
              { id: novelId || '', name: `novel-${novelId}`, type: 'novel' }
            ] as PromptTag[]
          },
          id: generateUUID({ prefix: userInfoId.slice(4, 6), length: 28 }),
          meta: {
            state: CollectionState.Active,
            createdAt,
            updatedAt: createdAt
          },
          relationships: {
            owner: {
              id: userInfoId,
              type: 'users'
            }
          }
        } as Collection;
      }
    }
    
    if (data) {
      await addCollection(data);
      router.prompts(`/${data.id}`);
      setNewCollection(data);
    }
  }

  const collapseItems = useMemo<CollapseProps['items']>(() => {
    const data_list: CollapseProps['items'] = [...featuredGroup, ...promptsGroup].map(group => {
      // 只显示非隐藏的分组
      if (group.hidden) {
        return null;
      }
      
      let newPrompt: Collection | undefined;
      if (newCollection && newCollection.type === CollectionType.Prompts) {
        // 对于提示词集合，需要根据自定义类型进行匹配
        const customTypes: Record<string, PromptType> = {
          "creative-assistance": PromptType.Component,
          "content-processing": PromptType.SceneSummarization,
          "text-editing": PromptType.ManuscriptReplacement,
          "case-library": PromptType.Other
        };
        
        // 检查group.type是否是自定义类型
        if (customTypes[group.type]) {
          // 对于案例库类，需要特殊处理
          if (group.type === "case-library") {
            // 检查是否为PromptType.Other类型
            if (newCollection.attributes.type === PromptType.Other) {
              newPrompt = newCollection;
            }
          } else {
            // 对于其他自定义类型，检查是否属于该分类
            switch (group.type) {
              case "creative-assistance":
                if (newCollection.attributes.type === PromptType.Component || newCollection.attributes.type === PromptType.WorkshopChat) {
                  newPrompt = newCollection;
                }
                break;
              case "content-processing":
                if (newCollection.attributes.type === PromptType.SceneSummarization || 
                    newCollection.attributes.type === PromptType.SceneBeatCompletion || 
                    newCollection.attributes.type === PromptType.SceneCharacterDetection) {
                  newPrompt = newCollection;
                }
                break;
              case "text-editing":
                if (newCollection.attributes.type === PromptType.ManuscriptReplacement || 
                    newCollection.attributes.type === PromptType.ManuscriptCompletion) {
                  newPrompt = newCollection;
                }
                break;
              default:
                if (newCollection.attributes.type === customTypes[group.type]) {
                  newPrompt = newCollection;
                }
            }
          }
        } else if (newCollection.attributes.type === group.type) {
          newPrompt = newCollection;
        }
      } else if (newCollection && newCollection.type === group.type) {
        newPrompt = newCollection;
      }
      
      // 过滤集合，根据group.type进行匹配
      let filteredCollections = collections.filter(d => {
        if (d.type === CollectionType.Prompts) {
          // 对于提示词集合，需要根据自定义类型进行匹配
          const customTypes: Record<string, PromptType> = {
            "creative-assistance": PromptType.Component,
            "content-processing": PromptType.SceneSummarization,
            "text-editing": PromptType.ManuscriptReplacement,
            "case-library": PromptType.Other
          };
          
          // 检查group.type是否是自定义类型
          if (customTypes[group.type]) {
            // 对于案例库类，需要特殊处理
            if (group.type === "case-library") {
              // 检查是否为PromptType.Other类型
              return d.attributes.type === PromptType.Other;
            }
            // 对于其他自定义类型，检查是否属于该分类下的任意PromptType
            switch (group.type) {
              case "creative-assistance":
                // 创作辅助类包含Component和WorkshopChat
                return d.attributes.type === PromptType.Component || d.attributes.type === PromptType.WorkshopChat;
              case "content-processing":
                // 内容处理类包含SceneSummarization、SceneBeatCompletion和SceneCharacterDetection
                return d.attributes.type === PromptType.SceneSummarization || 
                       d.attributes.type === PromptType.SceneBeatCompletion || 
                       d.attributes.type === PromptType.SceneCharacterDetection;
              case "text-editing":
                // 文本编辑类包含ManuscriptReplacement和ManuscriptCompletion
                return d.attributes.type === PromptType.ManuscriptReplacement || 
                       d.attributes.type === PromptType.ManuscriptCompletion;
              default:
                // 对于其他类型，直接匹配
                return d.attributes.type === customTypes[group.type];
            }
          }
          
          // 对于标准PromptType，直接匹配
          return d.attributes.type === group.type
        }
        // 对于角色设定，显示所有CollectionType.Personas类型
        if (group.type === CollectionType.Personas) {
          return d.type === CollectionType.Personas
        }
        // 对于其他类型，直接匹配type
        return d.type === group.type
      });
      
      const child = filteredCollections.concat(newPrompt ? newPrompt : []).map(d =>
        <div key={d.id} className='cursor-pointer p-[2px] border-t first:border-t-0'>
          <Flex className={cn('collection-item p-2', { 'active': promptId === d.id })} key={d.id} align="center" justify='space-between'>
            <span onClick={() => selectCollection(d)}>
              {getModelDisplayName(d.attributes.name)}
              {/* 如果是示例集合，添加示例标签 */}
              {d.relationships.owner.id === 'system' && d.attributes.name.includes('示例') && (
                <Tag color="green" style={{ marginLeft: 8 }}>示例</Tag>
              )}
            </span>
            <Space>
              {d.relationships.owner.id === 'system' && <Typography.Text className='text-blue-500 text-xs'>系统</Typography.Text>}
              {CollectionTag(d.type)}
              {d.relationships.owner.id !== 'system' && (
                <Space>
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCollection(d);
                      setShowEditForm(true);
                    }}
                    size="small"
                  />
                  <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      Modal.confirm({
                        title: '确认删除',
                        content: `确定要删除"${getModelDisplayName(d.attributes.name)}"吗？`,
                        onOk: async () => {
                          await deleteCollection(d.id);
                          if (promptId === d.id) {
                            router.prompts('');
                          }
                          // 刷新数据
                          if (novelId) {
                            await refresh(novelId);
                          }
                        }
                      });
                    }}
                    size="small"
                    danger
                  />
                </Space>
              )}
            </Space>
          </Flex>
        </div>
      )
      
      // 处理标签显示，将英文部分设置为9号字体
      let displayLabel;
      if (group.label.includes('（') && group.label.includes('）')) {
        const parts = group.label.split('（');
        const chinesePart = parts[0];
        const englishPart = parts[1].replace('）', '');
        displayLabel = (
          <span>
            {chinesePart}
            <span style={{ fontSize: '9px', marginLeft: '4px' }}>({englishPart})</span>
          </span>
        );
      } else {
        displayLabel = group.label;
      }
      
      return {
        key: group.type.toString(),
        label: displayLabel,
        extra: <Space><span>{child.length}条目</span></Space>,
        children: child,
      }
    }).filter(d => d !== null && d.children?.length)
    return data_list;
  }, [collections, promptId, newCollection, novelId, refresh]);

  const selectedCollection = useMemo(() => {
    return collections.find(d => d.id === promptId)
  }, [promptId, collections])

  useEffect(() => {
    if (promptId) {
      const prompt = collections.find(d => d.id === promptId)
      if (prompt) {
        const key = prompt.type === CollectionType.Prompts ? prompt.attributes.type : prompt.type;
        setCollapsed([key.toString()]);
      }
    }
  }, [promptId, collections])

  return (
    <div className="h-full flex flex-col bg-white p-6">
      <div className='flex flex-row overflow-hidden grow'>
        {/* 侧边栏 */}
        <div className='w-1/4 border-r flex flex-col bg-gray-50 mr-6 rounded-lg'>
          <div className='border-b p-3 bg-white rounded-t-lg'>
            <div className='flex gap-2'>
              <Input placeholder='搜索提示词...' allowClear addonAfter={<FilterOutlined />} />
              <Button 
                type="primary"
                icon={<PlusOutlined />} 
                onClick={() => {
                  setEditingCollection(null);
                  setShowEditForm(true);
                }}
              >
                新增
              </Button>
            </div>
          </div>
          <div className='overflow-y-auto flex-1 p-2'>
            <Collapse
              size='small'
              bordered={false}
              expandIconPosition="end"
              activeKey={collapsed}
              onChange={setCollapsed}
              items={collapseItems} />
          </div>
          
          {/* 底部操作按钮 */}
          <div className='border-t p-3 bg-white rounded-b-lg'>
            <Button 
              block
              icon={<EyeOutlined />} 
              onClick={() => setShowPreview(true)}
            >
              预览
            </Button>
          </div>
        </div>
        
        {/* 主内容区 */}
        <div className='flex-1 overflow-auto bg-white rounded-lg' style={{ minHeight: 0 }}>
          {showPreview ? (
            <div className="p-6" style={{ height: '100%' }}>
              <div className="flex justify-between items-center mb-6">
                <Typography.Title level={4}>提示词库预览</Typography.Title>
                <Button 
                  icon={<EyeOutlined />} 
                  onClick={() => setShowPreview(false)}
                >
                  关闭预览
                </Button>
              </div>
              <PromptLibraryPreview collections={collections} />
            </div>
          ) : showEditForm ? (
            <EditPromptForm // 恢复使用正式的编辑表单
              collection={editingCollection as any} 
              onCancel={() => {
                setShowEditForm(false);
                setEditingCollection(null);
              }}
              onSuccess={async () => {
                setShowEditForm(false);
                setEditingCollection(null);
                // 刷新数据
                if (novelId) {
                  await refresh(novelId);
                }
                // 如果当前正在查看被编辑的提示词，重新选择以刷新详情视图
                if (editingCollection && promptId === editingCollection.id) {
                  // 延迟执行以确保数据已更新
                  setTimeout(() => {
                    router.prompts('');
                    setTimeout(() => router.prompts(`/${editingCollection.id}`), 100);
                  }, 100);
                }
                // 如果是新建操作，导航到新创建的集合
                if (!editingCollection) {
                  // 延迟执行以确保数据已更新
                  setTimeout(() => {
                    const { collections } = useNovelPromptLibraryStore.getState();
                    const latestCollection = collections[collections.length - 1];
                    if (latestCollection) {
                      router.prompts(`/${latestCollection.id}`);
                    }
                  }, 100);
                }
              }}
            />
          ) : selectedCollection ? (
            <CollectionDetail collection={selectedCollection} />
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center p-8 max-w-md">
                <div className="mb-6">
                  <TagsOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </div>
                <Typography.Title level={3} style={{ marginBottom: '16px' }}>
                  欢迎使用小说特定提示词库
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginBottom: '24px' }}>
                  请选择左侧的提示词集合进行查看，或创建新的提示词模板来提升您的创作效率。
                </Typography.Paragraph>
                <div className="flex gap-3 justify-center">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingCollection(null);
                      setShowEditForm(true);
                    }}
                  >
                    创建新提示词
                  </Button>
                  <Button 
                    icon={<EyeOutlined />} 
                    onClick={() => setShowPreview(true)}
                  >
                    预览全部
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const useStyles = createStyles(({ css, token }) => css`
.collections-sidebar{
  .ant-collapse-header {
    align-items: center;
    padding: 12px 16px !important;
  }
  .ant-collapse-content{
    background-color: ${token.colorBgContainer};
    border-top: 1px solid ${token.colorBorder};
  }
  .ant-collapse-content-box{
    padding: 0;
  }
  .collection-item{
    transition: all .3s;
    border-radius: ${token.borderRadius}px;
    padding: 12px 16px !important;
    margin: 0 8px;
    .ant-tag{
      margin-right: 0;
    }
    &:hover{
      background-color: ${token.colorBgTextHover};
    }
    &.active{
      box-shadow: 0 0 0 2px ${token.colorPrimary};
      background-color: ${token.colorPrimaryBg};
    }
  }
}
`
)


export default NovelPromptsCustomLayout;