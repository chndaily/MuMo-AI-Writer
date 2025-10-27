import React from 'react';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { WorldElementPanelProps } from '../WorldElementPanel';

export const magicConfig: Omit<WorldElementPanelProps, 'novelId' | 'aiSyncData'> = {
  type: 'magic',
  typeName: '魔法',
  icon: React.createElement(ThunderboltOutlined),
  fields: [
    {
      name: 'name',
      label: '名称',
      type: 'input',
      placeholder: '请输入魔法体系的名称...'
    },
    {
      name: 'tags',
      label: '标签',
      type: 'input',
      placeholder: '添加标签，用中文顿号"、"分隔，如：元素、召唤、治愈...'
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
      placeholder: '简要描述这个魔法体系的特点和背景...',
      rows: 3
    },
    {
      name: 'system',
      label: '魔法系统',
      type: 'textarea',
      placeholder: '描述魔法体系的主要特点、修行方式、等级体系等...',
      rows: 4
    },
    {
      name: 'sources',
      label: '能量源泉',
      type: 'textarea',
      placeholder: '描述魔法力量的来源、获取方式、储存方式等...',
      rows: 4
    },
    {
      name: 'rules',
      label: '施法规则',
      type: 'textarea',
      placeholder: '描述施法所需的条件、限制因素、消耗机制等...',
      rows: 4
    },
    {
      name: 'spells',
      label: '法术示例',
      type: 'textarea',
      placeholder: '描述基础法术、中级法术、高级法术、禁忌法术等...',
      rows: 4
    },
    {
      name: 'artifacts',
      label: '魔法物品',
      type: 'textarea',
      placeholder: '描述主要的魔法物品类型、制作方法、使用方式等...',
      rows: 4
    },
    // 添加世界观关联字段
    {
      name: 'worldRelation',
      label: '世界观关联',
      type: 'textarea',
      placeholder: '描述该魔法体系与世界观中其他元素的关联，如与科技、文化、历史事件等的关系...',
      rows: 4
    },
    {
      name: 'details',
      label: '细节补充',
      type: 'textarea',
      placeholder: '其他关于魔法的细节信息...',
      rows: 4
    }
  ]
};