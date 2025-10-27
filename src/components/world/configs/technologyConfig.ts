import React from 'react';
import { ExperimentOutlined } from '@ant-design/icons';
import type { WorldElementPanelProps } from '../WorldElementPanel';

export const technologyConfig: Omit<WorldElementPanelProps, 'novelId' | 'aiSyncData'> = {
  type: 'technology',
  typeName: '科技',
  icon: React.createElement(ExperimentOutlined),
  fields: [
    {
      name: 'name',
      label: '名称',
      type: 'input',
      placeholder: '请输入技术的完整名称...'
    },
    {
      name: 'tags',
      label: '标签',
      type: 'textarea',
      placeholder: '添加标签，用逗号或顿号分隔，如：科技、未来、传送...',
      rows: 2
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
      placeholder: '简要描述这项技术的特点和背景...',
      rows: 3
    },
    {
      name: 'level',
      label: '科技水平',
      type: 'textarea',
      placeholder: '描述技术的发展阶段、核心技术等...',
      rows: 3
    },
    {
      name: 'applications',
      label: '应用场景',
      type: 'textarea',
      placeholder: '描述技术的主要用途、应用领域等...',
      rows: 3
    },
    {
      name: 'limitations',
      label: '使用限制',
      type: 'textarea',
      placeholder: '描述技术的能源需求、副作用等...',
      rows: 3
    },
    {
      name: 'impact',
      label: '社会影响',
      type: 'textarea',
      placeholder: '描述技术对社会、文化、经济等方面的影响...',
      rows: 3
    },
    {
      name: 'details',
      label: '细节补充',
      type: 'textarea',
      placeholder: '其他关于科技的细节信息...',
      rows: 3
    }
  ]
};