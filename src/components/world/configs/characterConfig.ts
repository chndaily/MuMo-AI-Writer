import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import type { WorldElementPanelProps } from '../WorldElementPanel';

export const characterConfig: Omit<WorldElementPanelProps, 'novelId' | 'aiSyncData'> = {
  type: 'character',
  typeName: '角色',
  icon: React.createElement(UserOutlined),
  fields: [
    {
      name: 'name',
      label: '名称',
      type: 'input',
      placeholder: '请输入角色的完整姓名...'
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
      placeholder: '简要描述这个角色的特点和背景...',
      rows: 3
    },
    {
      name: 'tags',
      label: '标签',
      type: 'input',
      placeholder: '请输入标签，多个标签请用中文顿号"、"分隔，如：剑士、勇敢、推动者'
    },
    {
      name: 'role',
      label: '角色类型',
      type: 'input',
      placeholder: '请输入角色类型，如：主角、配角（医疗线核心成员）等'
    },

    {
      name: 'appearance',
      label: '外貌特征',
      type: 'textarea',
      placeholder: '描述角色的外貌特征，包括年龄、性别、身高、体型、肤色、面部特征、发型、眼睛颜色、穿着风格等...',
      rows: 3
    },
    {
      name: 'personality',
      label: '性格特质',
      type: 'textarea',
      placeholder: '描述角色的性格特质，包括主要性格特点、行为习惯、情绪模式、价值观等...',
      rows: 3
    },
    {
      name: 'background',
      label: '背景故事',
      type: 'textarea',
      placeholder: '描述角色的背景故事，包括出身、成长经历、重要事件、家庭背景等...',
      rows: 3
    },
    {
      name: 'abilities',
      label: '能力技能',
      type: 'textarea',
      placeholder: '描述角色的能力和技能，包括特殊能力、战斗技能、专业知识、天赋等...',
      rows: 3
    },
    {
      name: 'relationships',
      label: '人际关系',
      type: 'textarea',
      placeholder: '描述角色的人际关系，包括家人、朋友、敌人、恋人等重要关系...',
      rows: 3
    },
    {
      name: 'characterArc',
      label: '角色弧光',
      type: 'textarea',
      placeholder: '描述角色的成长变化，包括性格发展、目标转变、内心冲突等...',
      rows: 3
    },
    {
      name: 'details',
      label: '其他细节',
      type: 'textarea',
      placeholder: '其他关于角色的补充信息...',
      rows: 3
    }
  ]
};