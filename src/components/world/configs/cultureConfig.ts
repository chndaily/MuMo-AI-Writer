import React from 'react';
import { BookOutlined } from '@ant-design/icons';
import type { WorldElementPanelProps } from '../WorldElementPanel';

export const cultureConfig: Omit<WorldElementPanelProps, 'novelId' | 'aiSyncData'> = {
  type: 'culture',
  typeName: '文化',
  icon: React.createElement(BookOutlined),
  fields: [
    {
      name: 'name',
      label: '名称',
      type: 'input',
      placeholder: '请输入文化的完整名称...'
    },
    {
      name: 'tags',
      label: '标签',
      type: 'input',
      placeholder: '请输入标签，多个标签请用中文顿号"、"分隔，如：东方、西方、古代、现代等'
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
      placeholder: '简要描述这个文化的特点和背景...',
      rows: 3
    },
    // 传统习俗主项
    {
      name: 'customs',
      label: '传统习俗',
      type: 'textarea',
      placeholder: '描述文化中的传统习俗，包括节日庆典、礼仪规范等...',
      rows: 3
    },
    // 价值观念主项
    {
      name: 'values',
      label: '价值观念',
      type: 'textarea',
      placeholder: '描述文化中的价值观念，包括核心价值、道德标准等...',
      rows: 3
    },
    // 艺术表现主项
    {
      name: 'art',
      label: '艺术表现',
      type: 'textarea',
      placeholder: '描述文化中的艺术表现，包括文学形式、音乐舞蹈、视觉艺术等...',
      rows: 3
    },
    // 宗教信仰主项
    {
      name: 'religion',
      label: '宗教信仰',
      type: 'textarea',
      placeholder: '描述文化中的宗教信仰，包括主要宗教、神话传说等...',
      rows: 3
    },
    // 语言文字主项
    {
      name: 'language',
      label: '语言文字',
      type: 'textarea',
      placeholder: '描述文化中的语言文字，包括主要语言、文字系统等...',
      rows: 3
    },
    // 文化互动主项
    {
      name: 'cultureInteraction',
      label: '文化互动',
      type: 'textarea',
      placeholder: '描述文化间的互动情况，包括文化冲突和文化融合...',
      rows: 3
    },
    // 细节补充
    {
      name: 'details',
      label: '细节补充',
      type: 'textarea',
      placeholder: '其他关于文化的细节信息...',
      rows: 3
    }
  ]
};