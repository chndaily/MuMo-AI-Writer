import { Button, Collapse, CollapseProps, Flex, Input, Space, Tag, Typography, Divider } from 'antd';
import { FilterOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import React, { useEffect, useMemo, useState } from 'react';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';
import { CollectionType, PromptType, Collection, CollectionState } from '#/promptLibrary';
import { cn, generateUUID } from '@/utils';
import { useParams, useRouter } from '@/router/hooks';
import dayjs from 'dayjs';
import CollectionDetail from './Detail';
import PromptLibraryPreview from '@/components/promptLibrary/PromptLibraryPreview';
import { useUserInfoId } from '@/stores/userStore';

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
}

// 优化后的分类结构
const featuredGroup: GroupItem[] = [
  {
    label: "模型管理",
    labelPlural: "Basic Settings",
    labelShort: "Basic",
    group: "featured",
    type: CollectionType.Models,
    icon: {
      prefix: "far",
      iconName: "rectangle-history",
      icon: [512, 512, [], "e4a2", "M464 224c0-8.8-7.2-16-16-16L64 208c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-224zm-16-64c35.3 0 64 28.7 64 64l0 224c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 224c0-35.3 28.7-64 64-64l384 0zm-8-80c13.3 0 24 10.7 24 24s-10.7 24-24 24L72 128c-13.3 0-24-10.7-24-24s10.7-24 24-24l368 0zM392 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L120 48c-13.3 0-24-10.7-24-24s10.7-24 24-24L392 0z"]
    },
    description: "模型管理和基础配置"
  },
  {
    label: "默认设置",
    labelPlural: "Default Settings",
    labelShort: "Defaults",
    group: "featured",
    type: CollectionType.Defaults,
    icon: {
      prefix: "far",
      iconName: "rectangle-history",
      icon: [512, 512, [], "e4a2", "M464 224c0-8.8-7.2-16-16-16L64 208c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-224zm-16-64c35.3 0 64 28.7 64 64l0 224c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 224c0-35.3 28.7-64 64-64l384 0zm-8-80c13.3 0 24 10.7 24 24s-10.7 24-24 24L72 128c-13.3 0-24-10.7-24-24s10.7-24 24-24l368 0zM392 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L120 48c-13.3 0-24-10.7-24-24s10.7-24 24-24L392 0z"]
    },
    description: "定义新聊天/节拍等使用的默认提示词"
  }
]

const promptsGroup: GroupItem[] = [
  // 创作素材类 - 角色设定组
  {
    label: "角色设定",
    labelPlural: "Character Settings",
    labelShort: "Characters",
    group: "prompts",
    type: CollectionType.Personas,
    icon: {
      prefix: "far",
      iconName: "user",
      icon: [512, 512, [], "f405", "M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zm0 480c-105.9 0-192-86.1-192-192S150.1 64 256 64s192 86.1 192 192s-86.1 192-192 192zM128 352c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32zm160-64c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32zm160 64c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"]
    },
    description: "共享的角色信息和个性特征"
  },
  
  // 创作辅助类
  {
    label: "提示词组件",
    labelPlural: "Prompt Components",
    labelShort: "Components",
    group: "prompts",
    type: PromptType.Component,
    icon: {
      prefix: "far",
      iconName: "puzzle-piece",
      icon: [512, 512, [129513], "f12e", "M201.1 57.3C194.1 62.5 192 68 192 72c0 4.2 2.4 10.1 10.4 15.6c7.8 5.3 13.6 14.6 13.6 25.6c0 17-13.8 30.7-30.7 30.7L56 144c-4.4 0-8 3.6-8 8l0 52.5c7.4-2.9 15.5-4.5 24-4.5c43.1 0 72 39.4 72 80s-28.9 80-72 80c-8.5 0-16.6-1.6-24-4.5L48 456c0 4.4 3.6 8 8 8l100.5 0c-2.9-7.4-4.5-15.5-4.5-24c0-43.1 39.4-72 80-72s80 28.9 80 72c0 8.5-1.6 16.6-4.5 24l52.5 0c4.4 0 8-3.6 8-8l0-129.3c0-17 13.8-30.7 30.7-30.7c11.1 0 20.3 5.8 25.6 13.6c5.5 8 11.4 10.4 15.6 10.4c4 0 9.5-2.1 14.7-9.1s9.3-17.9 9.3-30.9s-4-23.8-9.3-30.9s-10.7-9.1-14.7-9.1c-4.2 0-10.1 2.4-15.6 10.4c-5.3 7.8-14.6 13.6-25.6 13.6c-17 0-30.7-13.8-30.7-30.7l0-81.3c0-4.4-3.6-8-8-8l-81.3 0c-17 0-30.7-13.8-30.7-30.7c0-11.1 5.8-20.3 13.6-25.6c8-5.5 10.4-11.4 10.4-15.6c0-4-2.1-9.5-9.1-14.7S245 48 232 48s-23.8 4-30.9 9.3zM172.3 18.9C188.5 6.8 209.6 0 232 0s43.5 6.8 59.7 18.9S320 49.5 320 72c0 8.6-1.8 16.7-4.9 24L360 96c30.9 0 56 25.1 56 56l0 44.9c7.3-3.1 15.4-4.9 24-4.9c22.5 0 41 12.2 53.1 28.3S512 257.6 512 280s-6.8 43.5-18.9 59.7S462.5 368 440 368c-8.6 0-16.7-1.8-24-4.9l0 92.9c0 30.9-25.1 56-56 56l-78.1 0c-18.7 0-33.9-15.2-33.9-33.9c0-10.1 4.5-18.5 9.9-24.2c4.2-4.3 6.1-9.2 6.1-13.9c0-9.9-10.7-24-32-24s-32 14.1-32 24c0 4.7 1.9 9.5 6.1 13.9c5.5 5.7 9.9 14.1 9.9 24.2c0 18.7-15.2 33.9-33.9 33.9L56 512c-30.9 0-56-25.1-56-56L0 329.9C0 311.2 15.2 296 33.9 296c10.1 0 18.5 4.5 24.2 9.9c4.3 4.2 9.2 6.1 13.9 6.1c9.9 0 24-10.7 24-32s-14.1-32-24-32c-4.7 0-9.5 1.9-13.9 6.1C52.4 259.5 44 264 33.9 264C15.2 264 0 248.8 0 230.1L0 152c0-30.9 25.1-56 56-56l92.9 0c-3.1-7.3-4.9-15.4-4.9-24c0-22.5 12.2-41 28.3-53.1z"]
    },
    description: "可重复使用的提示词模块"
  },
  {
    label: "工作坊对话",
    labelPlural: "Workshop Chats",
    labelShort: "Chats",
    group: "prompts",
    type: PromptType.WorkshopChat,
    icon: {
      prefix: "far",
      iconName: "comments",
      icon: [512, 512, [], "f4b4", "M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zm0 480c-105.9 0-192-86.1-192-192S150.1 64 256 64s192 86.1 192 192s-86.1 192-192 192zM128 352c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32zm160-64c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32zm160 64c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"]
    },
    description: "用于协作讨论的对话模板"
  },
  
  // 内容处理类 - 场景处理组
  {
    label: "场景摘要",
    labelPlural: "Scene Summaries",
    labelShort: "Summarization",
    group: "prompts",
    type: PromptType.SceneSummarization,
    icon: {
      prefix: "far",
      iconName: "file-lines",
      icon: [384, 512, [], "f15c", "M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 288c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128z"]
    },
    description: "生成场景内容摘要"
  },
  {
    label: "场景补全",
    labelPlural: "Scene Completions",
    labelShort: "Scene Completion",
    group: "prompts",
    type: PromptType.SceneBeatCompletion,
    icon: {
      prefix: "far",
      iconName: "wave-pulse",
      icon: [640, 512, ["heart-rate"], "f5f8", "M319.4 0c11.1-.3 21 7.1 23.8 17.9l79.3 303.9 27.1-57.7c9.2-19.6 29-32.2 50.7-32.2L616 232c13.3 0 24 10.7 24 24s-10.7 24-24 24l-115.7 0c-3.1 0-5.9 1.8-7.2 4.6L437.7 402.2c-4.3 9.1-13.9 14.6-23.9 13.7s-18.5-8.1-21-17.8L322.7 129.4 247.5 492.9c-2.2 10.9-11.6 18.8-22.7 19.1s-21-6.9-23.9-17.6L143.3 285.9c-1-3.5-4.1-5.9-7.7-5.9L24 280c-13.3 0-24-10.7-24-24s10.7-24 24-24l111.6 0c25.2 0 47.3 16.8 54 41.1l31 112.6L296.5 19.1C298.8 8.2 308.2 .3 319.4 0z"]
    },
    description: "扩展和完善场景内容"
  },
  {
    label: "场景角色检测",
    labelPlural: "Scene Character Detection",
    labelShort: "Character Detection",
    group: "prompts",
    type: PromptType.SceneCharacterDetection,
    icon: {
      prefix: "far",
      iconName: "user-check",
      icon: [640, 512, [], "f4fc", "M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM472 200l96 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-96 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm-32 128l96 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-96 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"]
    },
    description: "识别场景中的角色信息"
  },
  
  // 文本编辑类
  {
    label: "文本替换",
    labelPlural: "Text Replacements",
    labelShort: "Text Replacement",
    group: "prompts",
    type: PromptType.ManuscriptReplacement,
    icon: {
      prefix: "far",
      iconName: "i-cursor",
      icon: [256, 512, [], "f246", "M.1 22.2c-1 13.2 8.9 24.8 22.1 25.8l15.4 1.2C75 52 104 83.3 104 120.9L104 232l-40 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l40 0 0 111.1c0 37.6-29 68.9-66.5 71.8l-15.4 1.2c13.2 1 24.8-8.9 25.8-22.1s-8.9-24.8-22.1-25.8l-15.4-1.2C181 460 152 428.7 152 391.1L152 280l40 0c13.3 0 24-10.7 24-24s-10.7-24 24-24l-40 0 0-111.1c0-37.6 29-68.9 66.5-71.8l15.4-1.2c13.2-1 23.1-12.6 22.1-25.8S243.4-.9 230.2 .1L214.8 1.3C179.1 4 148.1 22.2 128 48.9C107.9 22.2 76.9 4 41.2 1.3L25.8 .1C12.6-.9 1.1 8.9 .1 22.2z"]
    },
    description: "修改和替换文本内容"
  },
  
  // 案例库类
  {
    label: "案例小说库",
    labelPlural: "Novel Examples",
    labelShort: "Examples",
    group: "prompts",
    type: PromptType.Component,
    icon: {
      prefix: "far",
      iconName: "book",
      icon: [448, 512, [], "f02d", "M0 96C0 43 43 0 96 0L384 0c17.7 0 32 14.3 32 32l0 32c0 17.7-14.3 32-32 32l-32 0 0 352c0 35.3-28.7 64-64 64L128 512c-35.3 0-64-28.7-64-64L64 96 32 96C14.3 96 0 81.7 0 64L0 32C0 14.3 14.3 0 32 0L64 0 64 32 64 64 64 96 0 96z"]
    },
    description: "经典小说案例和创作参考"
  },
  
  {
    label: "经典内容提示库",
    labelPlural: "Classic Prompts",
    labelShort: "Classics",
    group: "prompts",
    type: PromptType.WorkshopChat,
    icon: {
      prefix: "far",
      iconName: "star",
      icon: [576, 512, [], "f005", "M288 0c-12.2 .1-23.3 7-28.6 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 112.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3L288 439.8 417.1 508.3c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.2 329 542.4 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381 150.3 316.7 18c-5.3-11-16.4-17.9-28.6-17.9l-1 .1zM183.6 329.5l-4.2 24.4 17.4-17.9c1.6-1.6 4.1-1.6 5.7 0l17.4 17.9-4.2-24.4c-.9-5.3 1.9-10.4 6.8-13.1l21.5-11.9-22.4-3.3c-5.4-.8-9.3-5.7-9.3-11.1l-2.2-23.4-19.1 18.2c-3.9 3.7-10.1 3.7-14 0L161 254.8l-2.2 23.4c0 5.4-3.9 10.3-9.3 11.1l-22.4 3.3 21.5 11.9c4.9 2.7 7.7 7.8 6.8 13.1z"]
    },
    description: "经过验证的经典提示词模板"
  },
  
  // 其它组（隐藏）
  {
    label: "其它",
    labelPlural: "Other",
    labelShort: "Other",
    group: "prompts",
    type: PromptType.Other,
    icon: {
      prefix: "far",
      iconName: "question-circle",
      icon: [512, 512, [], "f059", "M256 128c35.3 0 64 28.7 64 64s-28.7 64-64 64s-64-28.7-64-64s28.7-64 64-64zm0-128C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zm0 464c-114.7 0-208-93.3-208-208s93.3-208 208-208s208 93.3 208 208s-93.3 208-208 208zm64-304c0-8.8-7.2-16-16-16s-16 7.2-16 16s7.2 16 16 16s16-7.2 16-16zm-96 0c0-8.8-7.2-16-16-16s-16 7.2-16 16s7.2 16 16 16s16-7.2 16-16zm32 128c-26.5 0-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48s-21.5-48-48-48z"]
    },
    description: "其他类型的提示词",
    hidden: true
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

interface FixedPromptsLayoutProps {
  // 可以在这里添加组件需要的props类型定义
}

const FixedPromptsLayout: React.FC<FixedPromptsLayoutProps> = () => {
  const { styles } = useStyles();
  const { promptId } = useParams();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { collections, addCollection } = usePromptLibraryStore();
  const router = useRouter();
  const [newCollection, setNewCollection] = useState<Collection | null>(null);
  const userInfoId = useUserInfoId();

  const selectCollection = (collection: Collection) => {
    if (newCollection && newCollection.id !== collection.id) {
      setNewCollection(null);
    }
    router.prompts(promptId === collection.id ? '' : `/${collection.id}`);
  }

  const onAddCollection = (type: CollectionType | PromptType) => {
    if (!collapsed.includes(type.toString())) {
      setCollapsed((state) => [...state, type.toString()]);
    }
    const createdAt = dayjs().toISOString();
    let data: Collection | null = null;
    if (type === CollectionType.Models) {
      data = {
        type: CollectionType.Models,
        attributes: {
          name: '新模型集合',
          models: [],
        },
        id: generateUUID({ prefix: userInfoId.slice(4, 6), length: 28 }),
        meta: {
          state: CollectionState.Active,
          createdAt,
          updatedAt: createdAt
        },
        relationships: {
          owner: {
            id: 'user_30EbWOl1QqDvn9wVbufNwCJzFdE',
            type: 'users'
          }
        }
      }
    }
    if (data) {
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
      if (newCollection && newCollection.type === CollectionType.Prompts && newCollection.attributes.type === group.type) {
        newPrompt = newCollection;
      } else if (newCollection && newCollection.type === group.type) {
        newPrompt = newCollection;
      }
      const child = collections.filter(d => {
        if (d.type === CollectionType.Prompts) {
          return d.attributes.type === group.type;
        }
        return d.type === group.type;
      }).concat(newPrompt ? newPrompt : []).map(d =>
        <div onClick={() => selectCollection(d)} key={d.id} className='cursor-pointer p-[2px] border-t first:border-t-0'>
          <Flex className={cn('collection-item p-2', { 'active': promptId === d.id })} key={d.id} align="center" justify='space-between'>
            <span>
              {/* 修改模型名称显示逻辑 */}
              {d.attributes.name === "Default Chat Models" && "聊天模型（Chat Models）"}
              {d.attributes.name === "Default Summarization" && "摘要模型（Summarization Models）"}
              {d.attributes.name === "Default Text Replacements" && "文本替换模型（Text Replacement Models）"}
              {d.attributes.name === "Default Writing Models" && "写作模型（Writing Models）"}
              {d.attributes.name !== "Default Chat Models" && 
               d.attributes.name !== "Default Summarization" && 
               d.attributes.name !== "Default Text Replacements" && 
               d.attributes.name !== "Default Writing Models" && d.attributes.name}
            </span>
            <Space>
              {d.relationships.owner.id === 'system' && <Typography.Text className='text-blue-500 text-xs'>系统</Typography.Text>}
              {CollectionTag(d.type)}
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
        extra: <Space><span>{child.length}条目</span><Button onClick={(e) => {
          e.stopPropagation();
          onAddCollection(group.type as CollectionType | PromptType);
        }} type='text' icon={<PlusOutlined />} /></Space>,
        children: child,
      }
    }).filter(d => d !== null && d.children?.length);
    return data_list;
  }, [collections, promptId, newCollection]);

  const selectedCollection = useMemo(() => {
    return collections.find(d => d.id === promptId);
  }, [promptId, collections]);

  useEffect(() => {
    if (promptId) {
      const prompt = collections.find(d => d.id === promptId);
      if (prompt) {
        const key = prompt.type === CollectionType.Prompts ? prompt.attributes.type : prompt.type;
        setCollapsed([key.toString()]);
      }
    }
  }, [promptId, collections]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className='flex flex-row overflow-hidden grow'>
        {/* 侧边栏 */}
        <div className='w-1/4 border-r flex flex-col'>
          <div className='border-b flex gap-2 p-2'>
            <Input placeholder='搜索' allowClear addonAfter={<FilterOutlined />} />
            <Button icon={<PlusOutlined />}>新增</Button>
          </div>
          <div className='overflow-y-auto'>
            <Collapse
              size='small'
              bordered={false}
              expandIconPosition="end"
              activeKey={collapsed}
              onChange={setCollapsed}
              items={collapseItems} />
          </div>
        </div>
        
        {/* 主内容区 */}
        <div className='flex-1 overflow-auto bg-white' style={{ minHeight: 0 }}>
          {showPreview ? (
            <div className="p-4" style={{ height: '100%' }}>
              <div className="flex justify-between items-center mb-4">
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
          ) : selectedCollection ? (
            <CollectionDetail collection={selectedCollection} />
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">请从左侧选择提示词或创建新提示词</div>
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => setShowPreview(true)}
              >
                查看提示词库预览
              </Button>
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
    .ant-tag{
      margin-right: 0;
    }
    &:hover{
      background-color: ${token.colorBgTextHover};
    }
    &.active{
      box-shadow: 0 0 0 2px ${token.colorPrimary};
    }
  }
}
`
);

export default FixedPromptsLayout;