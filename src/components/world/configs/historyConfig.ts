import React from 'react';
import { HistoryOutlined } from '@ant-design/icons';
import type { WorldElementPanelProps } from '../WorldElementPanel';

export const historyConfig: Omit<WorldElementPanelProps, 'novelId' | 'aiSyncData'> = {
  type: 'history',
  typeName: '历史',
  icon: React.createElement(HistoryOutlined),
  fields: [
    {
      name: 'name',
      label: '名称',
      type: 'input',
      placeholder: '请输入历史时期的名称...'
    },
    {
      name: 'tags',
      label: '标签',
      type: 'textarea',
      placeholder: '添加标签，用逗号或顿号分隔，如：古代、战争、王朝...',
      rows: 2
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
      placeholder: '简要描述这个历史时期的特点和背景...',
      rows: 3
    },
    {
      name: 'timeline',
      label: '时间线',
      type: 'textarea',
      placeholder: '描述历史的重要时期、时间节点、年代跨度等...',
      rows: 4
    },
    {
      name: 'events',
      label: '重要事件',
      type: 'textarea',
      placeholder: '描述影响历史进程的重大事件、战争冲突等...',
      rows: 4
    },
    {
      name: 'figures',
      label: '历史人物',
      type: 'textarea',
      placeholder: '描述影响历史的关键人物、英雄豪杰等...',
      rows: 4
    },
    {
      name: 'consequences',
      label: '历史后果',
      type: 'textarea',
      placeholder: '描述历史对后世的影响、遗产传承等...',
      rows: 4
    },
    {
      name: 'details',
      label: '细节补充',
      type: 'textarea',
      placeholder: '其他关于历史的细节信息...',
      rows: 4
    }
  ]
};