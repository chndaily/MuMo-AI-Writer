import { PromptFunction } from '../types';

/**
 * 创建内置函数库
 * @returns 内置函数对象
 */
export const createBuiltinFunctions = (): Record<string, PromptFunction> => ({
  uppercase: {
    name: 'uppercase',
    type: 'single',
    description: '转换为大写',
    params: [{ name: 'text', type: 'string', required: true }],
    returnType: 'string',
    execute: (context, text) => String(text).toUpperCase()
  },

  lowercase: {
    name: 'lowercase',
    type: 'single',
    description: '转换为小写',
    params: [{ name: 'text', type: 'string', required: true }],
    returnType: 'string',
    execute: (context, text) => String(text).toLowerCase()
  },
  wordCount: {
    name: 'wordCount',
    type: 'multi',
    description: '返回参数的字数',
    params: [{ name: 'text', type: 'string', required: true }],
    returnType: 'number',
    execute: (context, text) => {
      return String(text).split(/\s+/).filter(w => w.length > 0).length;
    }
  },

  either: {
    name: 'either',
    type: 'condition',
    description: '逻辑或操作',
    params: [
      { name: 'condition1', type: 'boolean', required: true },
      { name: 'condition2', type: 'boolean', required: true }
    ],
    returnType: 'boolean',
    execute: (context, cond1, cond2) => Boolean(cond1) || Boolean(cond2)
  },

  include: {
    name: 'include',
    type: 'utility',
    description: '包含外部文件',
    params: [{ name: 'path', type: 'string', required: true }],
    returnType: 'string',
    execute: (context, path) => {
      return `[Included: ${path}]`;
    }
  },

  // 时间相关函数
  currentTime: {
    name: 'currentTime',
    type: 'utility',
    description: '获取当前时间',
    returnType: 'string',
    execute: () => new Date().toLocaleString()
  },

  // 文本处理函数
  reverse: {
    name: 'reverse',
    type: 'utility',
    description: '反转文本',
    params: [{ name: 'text', type: 'string', required: true }],
    returnType: 'string',
    execute: (context, text) => String(text).split('').reverse().join('')
  },

  // 随机函数
  randomChoice: {
    name: 'randomChoice',
    type: 'utility',
    description: '从选项中随机选择',
    params: [{ name: 'options', type: 'string', required: true }],
    returnType: 'string',
    execute: (context, ...options) => {
      if (options.length === 0) return '';
      return options[Math.floor(Math.random() * options.length)];
    }
  },

  // 条件函数
  isEmpty: {
    name: 'isEmpty',
    type: 'condition',
    description: '检查文本是否为空',
    params: [{ name: 'text', type: 'string', required: true }],
    returnType: 'boolean',
    execute: (context, text) => !text || String(text).trim().length === 0
  },

  // 文本格式化函数
  formatText: {
    name: 'formatText',
    type: 'utility',
    description: '格式化文本（首字母大写）',
    params: [{ name: 'text', type: 'string', required: true }],
    returnType: 'string',
    execute: (context, text) => {
      return String(text).charAt(0).toUpperCase() + String(text).slice(1);
    }
  },
}); 