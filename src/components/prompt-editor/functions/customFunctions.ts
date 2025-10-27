import { PromptFunction } from '../types';

/**
 * 创建自定义函数的工厂方法
 * @param name 函数名
 * @param type 函数类型
 * @param description 函数描述
 * @param execute 执行函数
 * @param params 参数定义
 * @returns 自定义函数对象
 */
export const createCustomFunction = (
  name: string,
  type: PromptFunction['type'],
  description: string,
  execute: PromptFunction['execute'],
  params?: PromptFunction['params']
): PromptFunction => ({
  name,
  type,
  description,
  execute,
  params,
  returnType: 'string'
});

/**
 * 创建示例自定义函数
 * @returns 示例自定义函数对象
 */
export const createCustomFunctions = (): Record<string, PromptFunction> => ({
  // 作者信息函数
  authorInfo: createCustomFunction(
    'authorInfo',
    'utility',
    '获取作者信息',
    (context) => `作者：${context.globalContext.author || '未知'}`
  ),

  message: createCustomFunction(
    'message',
    'single',
    '发送给AI的场景节拍或聊天框消息',
    (context) => context.globalContext.message || ''
  ),
  pov: createCustomFunction(
    'pov',
    'single',
    '返回小说POV视角',
    (context) => context.globalContext.pov || 'third-person'
  ),
  povCharacter: createCustomFunction(
    'pov.character',
    'single',
    '返回小说POV视角人物',
    (context) => context.globalContext.povCharacter || ''
  ),
  storySoFar: createCustomFunction(
    'storySoFar',
    'multi',
    '列出所选场景之前的场景摘要',
    (context) => context.globalContext.story?.summary || 'Story summary not available.'
  ),

  hasTextAfter: createCustomFunction(
    'hasTextAfter',
    'multi',
    '检查所选文本后是否有文本',
    (context) => Boolean(context.globalContext.textAfter && context.globalContext.textAfter.trim())
  ),

  hasTextBefore: createCustomFunction(
    'hasTextBefore',
    'multi',
    '检查所选文本前是否有文本',
    (context) => Boolean(context.globalContext.textBefore && context.globalContext.textBefore.trim())
  ),

  wordsBefore: createCustomFunction(
    'wordsBefore',
    'multi',
    '返回场景节拍之前的指定单词数',
    (context, count) => {
      const text = context.globalContext.textBefore || '';
      const words = text.split(/\s+/).filter(w => w.length > 0);
      return words.slice(-count).join(' ');
    }
  ),

  wordsAfter: createCustomFunction(
    'wordsAfter',
    'multi',
    '返回场景节拍之后的指定单词数',
    (context, count) => {
      const text = context.globalContext.textAfter || '';
      const words = text.split(/\s+/).filter(w => w.length > 0);
      return words.slice(0, count).join(' ');
    }
  ),

  // 场景信息函数
  sceneInfo: createCustomFunction(
    'sceneInfo',
    'utility',
    '获取场景信息',
    (context) => {
      const scene = context.globalContext.scene;
      if (!scene) return '场景信息未设置';
      return `地点：${scene.location}，时间：${scene.time}，天气：${scene.weather}`;
    }
  ),

  // 故事统计函数
  storyStats: createCustomFunction(
    'storyStats',
    'utility',
    '获取故事统计信息',
    (context) => {
      const story = context.globalContext.story;
      if (!story) return '故事统计不可用';
      return `类型：${story.genre || '未分类'}，字数：${story.wordCount || 0}`;
    }
  ),
}); 