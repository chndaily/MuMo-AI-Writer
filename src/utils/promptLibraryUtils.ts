import type { Collection, PromptCollection, ModelCollection, PersonaCollection } from '#/promptLibrary';
import { CollectionType } from '#/promptLibrary';

/**
 * 从提示词库中提取结构化内容，用于AI聊天上下文
 */
export const extractPromptLibraryContext = (collections: Collection[]): string => {
  try {
    let context = '提示词库内容：\n';
    
    // 按类型分组
    const groupedCollections: Record<string, Collection[]> = {
      'modelBanks': [],
      'promptDefaults': [],
      'promptPersonas': [],
      'prompts': [],
    };

    collections.forEach(collection => {
      if (collection.type in groupedCollections) {
        groupedCollections[collection.type].push(collection);
      }
    });

    // 处理模型集合
    if (groupedCollections['modelBanks'].length > 0) {
      context += '  模型集合：\n';
      groupedCollections['modelBanks'].forEach(collection => {
        context += `    ${collection.attributes.name}`;
        if (collection.relationships?.owner?.id === 'system') {
          context += ' (系统)';
        }
        context += '\n';
        
        const modelCollection = collection as ModelCollection;
        if (modelCollection.attributes.models && modelCollection.attributes.models.length > 0) {
          // 只显示前3个模型
          const modelNames = modelCollection.attributes.models
            .slice(0, 3)
            .map(m => m.name)
            .join(', ');
          const moreCount = Math.max(0, modelCollection.attributes.models.length - 3);
          context += `      包含模型：${modelNames}${moreCount > 0 ? ` 等${modelCollection.attributes.models.length}个模型` : ''}\n`;
        }
      });
    }

    // 处理自定义提示词
    if (groupedCollections['prompts'].length > 0) {
      context += '  自定义提示词：\n';
      groupedCollections['prompts'].forEach(collection => {
        context += `    ${collection.attributes.name}`;
        if (collection.relationships?.owner?.id === 'system') {
          context += ' (系统)';
        }
        context += '\n';
        
        const promptCollection = collection as PromptCollection;
        // 显示提示词类型
        if (promptCollection.attributes.type) {
          context += `      类型：${promptCollection.attributes.type}\n`;
        }
        
        // 显示消息内容预览（只显示前1条消息）
        if (promptCollection.attributes.messages && promptCollection.attributes.messages.length > 0) {
          const firstMessage = promptCollection.attributes.messages[0];
          if (firstMessage.text && firstMessage.text.length > 0) {
            const preview = firstMessage.text.length > 80 ? 
              firstMessage.text.substring(0, 80) + '...' : 
              firstMessage.text;
            context += `      ${firstMessage.type === 'system' ? '系统' : '用户'}消息预览：${preview}\n`;
          }
        }
        
        // 显示输入信息
        if (promptCollection.inputs && Object.keys(promptCollection.inputs).length > 0) {
          const inputNames = Object.values(promptCollection.inputs)
            .map((input: any) => `${input.name}${input.required ? '(必填)' : ''}`)
            .join(', ');
          context += `      输入参数：${inputNames}\n`;
        }
      });
    }

    // 处理角色设定
    if (groupedCollections['promptPersonas'].length > 0) {
      context += '  角色设定：\n';
      groupedCollections['promptPersonas'].forEach(collection => {
        context += `    ${collection.attributes.name}`;
        if (collection.relationships?.owner?.id === 'system') {
          context += ' (系统)';
        }
        context += '\n';
        
        const personaCollection = collection as PersonaCollection;
        const contentPreview = personaCollection.attributes.content?.length > 80 ? 
          personaCollection.attributes.content.substring(0, 80) + '...' : 
          personaCollection.attributes.content || '无内容';
        context += `      描述：${contentPreview}\n`;
        
        if (personaCollection.attributes.personality && personaCollection.attributes.personality.length > 0) {
          context += `      性格特征：${personaCollection.attributes.personality.join(', ')}\n`;
        }
      });
    }

    return context + '\n';
  } catch (error) {
    console.error('提取提示词库上下文失败:', error);
    return '';
  }
};

/**
 * 根据提示词类型筛选提示词
 */
export const filterPromptsByType = (collections: Collection[], type: string): Collection[] => {
  return collections.filter(collection => {
    if (type === 'prompts') {
      return collection.type === 'prompts';
    }
    return collection.type === type;
  });
};

/**
 * 获取系统提示词
 */
export const getSystemPrompts = (collections: Collection[]): Collection[] => {
  return collections.filter(collection => 
    collection.relationships?.owner?.id === 'system'
  );
};

/**
 * 获取用户自定义提示词
 */
export const getUserPrompts = (collections: Collection[]): Collection[] => {
  return collections.filter(collection => 
    collection.relationships?.owner?.id !== 'system'
  );
};