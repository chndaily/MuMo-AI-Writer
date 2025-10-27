import type { Collection, PromptCollection, ModelCollection, PersonaCollection } from '#/promptLibrary';
import { CollectionType, PromptType } from '#/promptLibrary';
import { isCaseLibraryCollection, extractAllCaseLibraryContent, formatAttachmentsForPrompt, chunkLargeContent } from './caseLibraryUtils';

/**
 * 从提示词库中提取AI知识库内容
 * @param collections 提示词库集合数组
 * @returns 格式化的知识库内容
 */
export const extractAIKnowledgeBase = async (collections: Collection[]): Promise<string> => {
  const knowledgeBaseSections: string[] = [];
  
  // 筛选出案例库类集合
  const caseLibraryCollections = collections.filter(isCaseLibraryCollection) as PromptCollection[];
  
  // 为每个案例库集合提取内容
  for (const collection of caseLibraryCollections) {
    const contents = await extractAllCaseLibraryContent(collection);
    
    if (contents.length > 0) {
      const formattedContent = formatAttachmentsForPrompt(contents, collection.attributes.name);
      knowledgeBaseSections.push(formattedContent);
    }
  }
  
  // 如果没有案例库内容，返回空字符串
  if (knowledgeBaseSections.length === 0) {
    return '';
  }
  
  // 组合所有知识库内容
  return [
    '以下是从案例库中提取的参考内容，可用于指导创作：',
    ...knowledgeBaseSections
  ].join('\n\n');
};

/**
 * 根据关键词筛选相关的案例库内容
 * @param collections 提示词库集合数组
 * @param keywords 关键词数组
 * @returns 相关的知识库内容
 */
export const extractRelevantKnowledgeBase = async (collections: Collection[], keywords: string[]): Promise<string> => {
  const relevantSections: string[] = [];
  
  // 筛选出案例库类集合
  const caseLibraryCollections = collections.filter(isCaseLibraryCollection) as PromptCollection[];
  
  // 为每个案例库集合检查是否包含关键词
  for (const collection of caseLibraryCollections) {
    const contents = await extractAllCaseLibraryContent(collection);
    const allContent = contents.join(' ').toLowerCase();
    
    // 检查是否包含任何关键词
    const hasRelevantKeyword = keywords.some(keyword => 
      allContent.includes(keyword.toLowerCase())
    );
    
    if (hasRelevantKeyword && contents.length > 0) {
      const formattedContent = formatAttachmentsForPrompt(contents, collection.attributes.name);
      relevantSections.push(formattedContent);
    }
  }
  
  // 如果没有相关的内容，返回空字符串
  if (relevantSections.length === 0) {
    return '';
  }
  
  // 组合所有相关知识库内容
  return [
    '以下是从案例库中提取的相关参考内容：',
    ...relevantSections
  ].join('\n\n');
};

/**
 * 获取特定名称的案例库内容
 * @param collections 提示词库集合数组
 * @param collectionName 集合名称
 * @returns 指定集合的内容
 */
export const getCaseLibraryByName = async (collections: Collection[], collectionName: string): Promise<string> => {
  // 查找指定名称的案例库集合
  const targetCollection = collections.find(collection => 
    isCaseLibraryCollection(collection) && 
    collection.attributes.name === collectionName
  ) as PromptCollection | undefined;
  
  if (!targetCollection) {
    return '';
  }
  
  const contents = await extractAllCaseLibraryContent(targetCollection);
  
  if (contents.length === 0) {
    return '';
  }
  
  return formatAttachmentsForPrompt(contents, targetCollection.attributes.name);
};

/**
 * 构建完整的AI上下文，包括提示词库内容
 * @param collections 提示词库集合数组
 * @param userInput 用户输入
 * @returns 完整的AI上下文
 */
export const buildAIContext = async (collections: Collection[], userInput: string): Promise<string> => {
  // 提取关键词（简单实现，可以进一步优化）
  const keywords = userInput.split(/\s+/).filter(word => word.length > 2);
  
  // 获取相关知识库内容
  const relevantKnowledge = await extractRelevantKnowledgeBase(collections, keywords);
  
  // 如果没有找到相关的内容，返回所有案例库内容
  const knowledgeBase = relevantKnowledge || await extractAIKnowledgeBase(collections);
  
  // 如果知识库内容过长，进行截断处理（限制在10000字符以内）
  if (knowledgeBase.length > 10000) {
    // 保留前9000字符，并添加提示信息
    return knowledgeBase.substring(0, 9000) + '\n\n... (内容已截断以适应上下文长度限制)';
  }
  
  return knowledgeBase;
};

/**
 * 智能提取相关章节内容
 * @param collections 提示词库集合数组
 * @param keywords 关键词数组
 * @param maxChars 最大字符数
 * @returns 精简的相关内容
 */
export const extractSmartKnowledgeBase = async (collections: Collection[], keywords: string[], maxChars: number = 8000): Promise<string> => {
  // 筛选出案例库类集合
  const caseLibraryCollections = collections.filter(isCaseLibraryCollection) as PromptCollection[];
  
  // 存储所有相关内容
  const relevantContents: { content: string; relevance: number; collectionName: string }[] = [];
  
  // 为每个案例库集合检查是否包含关键词
  for (const collection of caseLibraryCollections) {
    const contents = await extractAllCaseLibraryContent(collection);
    
    for (const content of contents) {
      // 计算相关性分数（基于关键词匹配数量）
      const relevance = keywords.reduce((score, keyword) => {
        const matches = (content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        return score + matches;
      }, 0);
      
      if (relevance > 0) {
        relevantContents.push({
          content,
          relevance,
          collectionName: collection.attributes.name
        });
      }
    }
  }
  
  // 按相关性排序
  relevantContents.sort((a, b) => b.relevance - a.relevance);
  
  // 选择最相关的内容，直到达到字符限制
  let result = '以下是从案例库中提取的相关参考内容：\n\n';
  let currentLength = result.length;
  
  for (const item of relevantContents) {
    const formattedItem = `来自"${item.collectionName}"的内容:\n${item.content}\n\n`;
    
    if (currentLength + formattedItem.length <= maxChars) {
      result += formattedItem;
      currentLength += formattedItem.length;
    } else {
      // 如果添加完整内容会超限，尝试添加部分内容
      const remainingChars = maxChars - currentLength - 100; // 保留一些空间用于提示
      if (remainingChars > 100) {
        const truncatedContent = item.content.substring(0, remainingChars);
        result += `来自"${item.collectionName}"的内容 (已截断):
${truncatedContent}

... (内容已截断)

`;
      }
      break;
    }
  }
  
  return result;
};

/**
 * 提取完整的提示词库上下文（包括所有类型的提示词）
 * @param collections 提示词库集合数组
 * @param maxChars 最大字符数
 * @returns 完整的提示词库上下文
 */
export const extractFullPromptLibraryContext = async (collections: Collection[], maxChars: number = 8000): Promise<string> => {
  let context = '以下是从提示词库中提取的参考内容，可用于指导创作：\n\n';
  let currentLength = context.length;
  
  // 按类型分组处理不同的集合
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
    let modelSection = '模型集合：\n';
    groupedCollections['modelBanks'].forEach(collection => {
      const modelCollection = collection as ModelCollection;
      modelSection += `  ${modelCollection.attributes.name}:\n`;
      if (modelCollection.attributes.models && modelCollection.attributes.models.length > 0) {
        modelCollection.attributes.models.forEach(model => {
          modelSection += `    - ${model.name} (${model.id})\n`;
        });
      }
    });
    modelSection += '\n';
    
    if (currentLength + modelSection.length <= maxChars) {
      context += modelSection;
      currentLength += modelSection.length;
    }
  }

  // 处理角色设定
  if (groupedCollections['promptPersonas'].length > 0) {
    let personaSection = '角色设定：\n';
    for (const collection of groupedCollections['promptPersonas']) {
      const personaCollection = collection as PersonaCollection;
      personaSection += `  ${personaCollection.attributes.name}:\n`;
      personaSection += `    内容: ${personaCollection.attributes.content.substring(0, 200)}${personaCollection.attributes.content.length > 200 ? '...' : ''}\n`;
      if (personaCollection.attributes.personality && personaCollection.attributes.personality.length > 0) {
        personaSection += `    性格特征: ${personaCollection.attributes.personality.join(', ')}\n`;
      }
      personaSection += '\n';
    }
    
    if (currentLength + personaSection.length <= maxChars) {
      context += personaSection;
      currentLength += personaSection.length;
    }
  }

  // 处理案例库类集合
  const caseLibraryCollections = collections.filter(isCaseLibraryCollection) as PromptCollection[];
  if (caseLibraryCollections.length > 0) {
    let caseLibrarySection = '案例库内容：\n';
    for (const collection of caseLibraryCollections) {
      const contents = await extractAllCaseLibraryContent(collection);
      if (contents.length > 0) {
        const formattedContent = formatAttachmentsForPrompt(contents, collection.attributes.name);
        caseLibrarySection += `${formattedContent}\n\n`;
      }
    }
    
    if (currentLength + caseLibrarySection.length <= maxChars) {
      context += caseLibrarySection;
      currentLength += caseLibrarySection.length;
    }
  }

  // 处理其他提示词集合
  const otherPromptCollections = collections.filter(collection => 
    collection.type === CollectionType.Prompts && !isCaseLibraryCollection(collection)
  ) as PromptCollection[];
  
  if (otherPromptCollections.length > 0) {
    let promptSection = '提示词集合：\n';
    for (const collection of otherPromptCollections) {
      promptSection += `  ${collection.attributes.name} (${collection.attributes.type}):\n`;
      if (collection.attributes.messages && collection.attributes.messages.length > 0) {
        collection.attributes.messages.forEach((msg, index) => {
          if (msg.text) {
            promptSection += `    消息${index + 1} (${msg.type}): ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}\n`;
          }
        });
      }
      promptSection += '\n';
    }
    
    if (currentLength + promptSection.length <= maxChars) {
      context += promptSection;
      currentLength += promptSection.length;
    }
  }

  return context;
};

/**
 * 创建知识库索引，用于快速检索
 * @param collections 提示词库集合数组
 * @returns 知识库索引
 */
export const createKnowledgeBaseIndex = async (collections: Collection[]): Promise<any> => {
  const index: any = {
    caseLibraries: [],
    personas: [],
    models: [],
    prompts: []
  };
  
  // 处理案例库
  const caseLibraryCollections = collections.filter(isCaseLibraryCollection) as PromptCollection[];
  for (const collection of caseLibraryCollections) {
    const contents = await extractAllCaseLibraryContent(collection);
    index.caseLibraries.push({
      id: collection.id,
      name: collection.attributes.name,
      contentPreview: contents.join(' ').substring(0, 200) + '...',
      contentLength: contents.join(' ').length
    });
  }
  
  // 处理角色设定
  const personaCollections = collections.filter(c => c.type === CollectionType.Personas) as PersonaCollection[];
  for (const collection of personaCollections) {
    index.personas.push({
      id: collection.id,
      name: collection.attributes.name,
      contentPreview: collection.attributes.content.substring(0, 200) + '...'
    });
  }
  
  // 处理模型集合
  const modelCollections = collections.filter(c => c.type === CollectionType.Models) as ModelCollection[];
  for (const collection of modelCollections) {
    index.models.push({
      id: collection.id,
      name: collection.attributes.name,
      modelCount: collection.attributes.models.length
    });
  }
  
  // 处理其他提示词
  const otherPromptCollections = collections.filter(collection => 
    collection.type === CollectionType.Prompts && !isCaseLibraryCollection(collection)
  ) as PromptCollection[];
  for (const collection of otherPromptCollections) {
    index.prompts.push({
      id: collection.id,
      name: collection.attributes.name,
      type: collection.attributes.type,
      messageCount: collection.attributes.messages.length
    });
  }
  
  return index;
};

/**
 * 根据查询语句智能检索相关知识库内容
 * @param collections 提示词库集合数组
 * @param query 查询语句
 * @param maxChars 最大字符数
 * @returns 相关的知识库内容
 */
export const searchKnowledgeBase = async (collections: Collection[], query: string, maxChars: number = 3000): Promise<string> => {
  console.log('Searching knowledge base with query:', query);
  console.log('Available collections count:', collections.length);
  
  // 提取查询关键词（允许更短的关键词）
  const keywords = query.split(/\s+/).filter(word => word.length > 0); // 允许单字符关键词
  
  if (keywords.length === 0) {
    return '请提供更具体的查询内容';
  }
  
  let result = `根据查询"${query}"找到的相关知识库内容：\n\n`;
  let currentLength = result.length;
  
  let foundMatch = false;
  
  // 搜索所有类型的集合（排除模型管理类集合）
  for (const collection of collections) {
    // 排除模型管理类集合，因为在章节编辑中无用
    if (collection.type === CollectionType.Models) {
      continue;
    }
    
    console.log('Checking collection:', collection.attributes.name, 'Type:', collection.type);
    
    // 检查集合名称是否完全匹配查询（不区分大小写）
    const nameExactMatch = collection.attributes.name.toLowerCase() === query.toLowerCase();
    
    // 检查集合名称是否包含关键词（不区分大小写）
    const nameContainsKeyword = keywords.some(keyword => 
      collection.attributes.name.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 如果名称完全匹配或包含关键词
    if (nameExactMatch || nameContainsKeyword) {
      let snippet = '';
      
      // 根据集合类型构建不同的信息
      if (isCaseLibraryCollection(collection)) {
        // 案例库类集合
        snippet = `【${collection.attributes.name}】(案例库)\n${nameExactMatch ? '集合名称完全匹配查询关键词' : '集合名称包含查询关键词'}"${query}"\n\n`;
      } else if (collection.type === CollectionType.Personas) {
        // 角色设定集合
        const personaCollection = collection as PersonaCollection;
        snippet = `【${collection.attributes.name}】(角色设定)
${nameExactMatch ? '集合名称完全匹配查询关键词' : '集合名称包含查询关键词'}"${query}"
内容预览: ${personaCollection.attributes.content?.substring(0, 200)}${personaCollection.attributes.content && personaCollection.attributes.content.length > 200 ? '...' : ''}

`;
      } else if (collection.type === CollectionType.Prompts) {
        // 其他提示词集合
        snippet = `【${collection.attributes.name}】(提示词集合)\n${nameExactMatch ? '集合名称完全匹配查询关键词' : '集合名称包含查询关键词'}"${query}"\n\n`;
      } else {
        // 其他类型集合
        snippet = `【${collection.attributes.name}】\n${nameExactMatch ? '集合名称完全匹配查询关键词' : '集合名称包含查询关键词'}"${query}"\n\n`;
      }
      
      if (currentLength + snippet.length <= maxChars) {
        result += snippet;
        currentLength += snippet.length;
        foundMatch = true;
        console.log('Name match found for collection:', collection.attributes.name);
      } else {
        break;
      }
      
      // 对于案例库类集合，还应该提取具体内容
      if (isCaseLibraryCollection(collection)) {
        const caseCollection = collection as PromptCollection;
        const contents = await extractAllCaseLibraryContent(caseCollection);
        console.log('Content items count for case library collection:', contents.length);
        
        for (const content of contents) {
          const contentSnippet = `【${caseCollection.attributes.name}】内容:\n${content.substring(0, 800)}${content.length > 800 ? '...' : ''}\n\n`;
          
          if (currentLength + contentSnippet.length <= maxChars) {
            result += contentSnippet;
            currentLength += contentSnippet.length;
          } else {
            // 添加部分内容
            const remainingChars = maxChars - currentLength - 100;
            if (remainingChars > 100) {
              const truncatedContent = content.substring(0, remainingChars);
              result += `【${caseCollection.attributes.name}】内容 (已截断):\n${truncatedContent}\n\n`;
            }
            break;
          }
        }
      }
    }
    
    // 对于非案例库类集合，搜索其内容（如果有的话）
    if (!isCaseLibraryCollection(collection) && collection.type === CollectionType.Prompts) {
      const promptCollection = collection as PromptCollection;
      if (promptCollection.attributes.messages) {
        for (const message of promptCollection.attributes.messages) {
          if (message.text) {
            // 检查消息内容是否包含关键词（不区分大小写）
            const hasKeyword = keywords.some(keyword => 
              message.text.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (hasKeyword) {
              const snippet = `【${collection.attributes.name}】
消息内容包含查询关键词:
${message.text.substring(0, 500)}${message.text.length > 500 ? '...' : ''}

`;
              
              if (currentLength + snippet.length <= maxChars) {
                result += snippet;
                currentLength += snippet.length;
                foundMatch = true;
                console.log('Message content match found for collection:', collection.attributes.name);
              } else {
                break;
              }
            }
          }
        }
      }
    }
    
    if (currentLength >= maxChars) break;
  }
  
  // 如果没有找到相关内容，提供一些通用信息（排除模型管理类集合）
  if (!foundMatch) {
    result += '未找到与查询直接相关的内容，以下是一些可能相关的知识库信息：\n\n';
    
    // 提供所有集合的索引信息（排除模型管理类集合）
    const filteredCollections = collections.filter(collection => collection.type !== CollectionType.Models);
    
    if (filteredCollections.length > 0) {
      result += '可用的知识库集合：\n';
      filteredCollections.forEach(collection => {
        if (isCaseLibraryCollection(collection)) {
          result += `- ${collection.attributes.name} (案例库)\n`;
        } else if (collection.type === CollectionType.Personas) {
          result += `- ${collection.attributes.name} (角色设定)\n`;
        } else if (collection.type === CollectionType.Prompts) {
          result += `- ${collection.attributes.name} (提示词集合)\n`;
        } else {
          result += `- ${collection.attributes.name}\n`;
        }
      });
      result += '\n';
    }
  }
  
  console.log('Search result length:', result.length);
  return result;
};