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
      type: 'select',
      placeholder: '请选择角色类型',
      options: [
        { value: 'protagonist', label: '主角 (protagonist)' },
        { value: 'antagonist', label: '反角 (antagonist)' },
        { value: 'supporting', label: '配角 (supporting)' },
        { value: 'minor', label: '次要角色 (minor)' },
        { value: 'side', label: '侧面角色 (side)' },
        { value: 'foil', label: '对照角色 (foil)' },
        { value: 'mentor', label: '导师角色 (mentor)' },
        { value: 'loveInterest', label: '恋爱对象 (loveInterest)' },
        { value: 'rival', label: '竞争对手 (rival)' },
        { value: 'neutral', label: '中立角色 (neutral)' },
        { value: 'keySupporting', label: '重要配角 (keySupporting)' },
        { value: 'minorSupporting', label: '次要配角 (minorSupporting)' },
        { value: 'complexSupporting', label: '复杂配角 (complexSupporting)' }
      ]
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
      placeholder: '描述角色的性格特质，包括核心性格特点、优点和缺点、习惯动作、口头禅、恐惧和弱点等...',
      rows: 3
    },
    {
      name: 'background',
      label: '背景故事',
      type: 'textarea',
      placeholder: '描述角色的背景故事，包括出生背景、家庭环境、成长经历、关键事件、教育背景、重要人际关系等...',
      rows: 3
    },
    {
      name: 'abilities',
      label: '能力设定',
      type: 'textarea',
      placeholder: '描述角色的特殊能力或技能，包括超能力、战斗技能、专业知识、技能等级等...',
      rows: 3
    },
    {
      name: 'relationships',
      label: '人际关系',
      type: 'textarea',
      placeholder: '描述角色的重要人际关系，包括与主要角色的关系、社会地位、盟友和敌人等...',
      rows: 3
    },
    {
      name: 'characterArc',
      label: '角色发展弧光',
      type: 'textarea',
      placeholder: '描述角色的成长和变化过程，包括初始状态、目标、面临的挑战、成长过程、最终转变等...',
      rows: 3
    },
    {
      name: 'details',
      label: '细节补充',
      type: 'textarea',
      placeholder: '其他关于角色的细节信息...',
      rows: 3
    }
  ]
};