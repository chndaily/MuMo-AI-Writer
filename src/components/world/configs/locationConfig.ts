import React from 'react';
import { EnvironmentOutlined } from '@ant-design/icons';

interface WorldElementPanelProps {
  type: 'character' | 'location' | 'culture' | 'technology' | 'magic' | 'history';
  typeName: string;
  icon: React.ReactNode;
  novelId?: string;
  aiSyncData?: any;
  fields: Array<{
    name: string;
    label: string;
    type: 'input' | 'textarea' | 'select';
    placeholder?: string;
    rows?: number;
    options?: Array<{ value: string; label: string }>;
  }>;
}

export const locationConfig: Omit<WorldElementPanelProps, 'novelId' | 'aiSyncData'> = {
  type: 'location',
  typeName: '地点',
  icon: React.createElement(EnvironmentOutlined),
  fields: [
    {
      name: 'name',
      label: '名称',
      type: 'input',
      placeholder: '请输入地点的完整名称...'
    },
    {
      name: 'tags',
      label: '标签',
      type: 'input',
      placeholder: '请输入标签，多个标签请用中文顿号"、"分隔，如：城市、村庄、山脉、森林等'
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
      placeholder: '简要描述这个地点的特点和背景...',
      rows: 3
    },
    {
      name: 'locationType',
      label: '类型',
      type: 'textarea',
      placeholder: '由AI生成具体的类型描述...',
      rows: 3
    },
    {
      name: 'importance',
      label: '重要性',
      type: 'textarea',
      placeholder: '由AI生成具体的重要性描述...',
      rows: 3
    },
    {
      name: 'geography',
      label: '地理环境',
      type: 'textarea',
      placeholder: '描述地点的地理环境，包括地理位置、气候特征、地形特征、自然资源、生态环境等...',
      rows: 4
    },
    {
      name: 'culture',
      label: '文化背景',
      type: 'textarea',
      placeholder: '描述地点的文化背景，包括历史背景、文化特色、建筑风格、社会结构等...',
      rows: 4
    },
    {
      name: 'politics',
      label: '政治环境',
      type: 'textarea',
      placeholder: '描述地点的政治环境，包括统治体系、法律法规等...',
      rows: 3
    },
    {
      name: 'economy',
      label: '经济状况',
      type: 'textarea',
      placeholder: '描述地点的经济状况，包括主要产业、贸易情况、财富水平等...',
      rows: 4
    },
    {
      name: 'details',
      label: '细节补充',
      type: 'textarea',
      placeholder: '其他关于地点的细节信息...',
      rows: 3
    }
  ]
};