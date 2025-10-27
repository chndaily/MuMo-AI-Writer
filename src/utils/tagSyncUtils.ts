/**
 * 标签同步工具类
 * 用于确保AI生成的内容标签与创作中心保持一致
 */

/**
 * 从AI生成的内容中提取标签
 * @param {string} content AI生成的内容
 * @returns {string[]} 标签数组
 */
export function extractTagsFromAIContent(content: string): string[] {
  const tags: string[] = [];
  
  // 查找标签行
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.includes('标签')) {
      // 解析标签，支持多种分隔符：逗号、顿号、中文顿号
      const tagsStr = extractValue(trimmedLine);
      if (tagsStr) {
        // 修复：使用更全面的正则表达式来匹配可能的分隔符
        const extractedTags = tagsStr.split(/[,，、\s]+/).map(tag => tag.trim()).filter(tag => tag);
        tags.push(...extractedTags);
      }
      // 移除break，确保检查所有可能包含标签的行
    }
  }
  
  return tags;
}

/**
 * 从内容行中提取值
 * @param {string} line 内容行
 * @returns {string} 提取的值
 */
function extractValue(line: string): string {
  // 修复：正确处理中文冒号和英文冒号
  const colonIndex = line.indexOf('：');
  if (colonIndex > -1) {
    return line.substring(colonIndex + 1).trim();
  }

  const englishColonIndex = line.indexOf(':');
  if (englishColonIndex > -1) {
    return line.substring(englishColonIndex + 1).trim();
  }

  return line.trim();
}

/**
 * 同步AI生成内容的标签到创作中心元素
 * @param {string} aiContent AI生成的内容
 * @param {Object} existingElement 创作中心中已存在的元素
 * @returns {string[]} 同步后的标签数组
 */
export function syncTagsToElement(aiContent: string, existingElement: any): string[] {
  // 从AI内容中提取标签
  const aiTags = extractTagsFromAIContent(aiContent);
  
  // 如果创作中心元素已存在，合并标签
  if (existingElement && existingElement.tags) {
    // 合并标签，去重
    const mergedTags = [...new Set([...existingElement.tags, ...aiTags])];
    return mergedTags;
  }
  
  // 如果没有现有元素，直接使用AI生成的标签
  return aiTags;
}

/**
 * 确保标签格式一致性
 * @param {string[]} tags 标签数组
 * @returns {string[]} 格式化后的标签数组
 */
export function normalizeTags(tags: string[]): string[] {
  return tags.map(tag => {
    // 去除首尾空格
    let normalizedTag = tag.trim();
    
    // 统一使用中文顿号分隔（如果标签内包含多个标签）
    // 修复：避免对单独标签进行替换，只处理包含分隔符的情况
    if (normalizedTag.includes(',') || normalizedTag.includes('&')) {
      normalizedTag = normalizedTag.replace(/[,&]/g, '、');
    }
    
    return normalizedTag;
  }).filter(tag => tag.length > 0); // 过滤空标签
}

/**
 * 比较两个标签数组是否相等
 * @param {string[]} tags1 标签数组1
 * @param {string[]} tags2 标签数组2
 * @returns {boolean} 是否相等
 */
export function areTagsEqual(tags1: string[], tags2: string[]): boolean {
  if (tags1.length !== tags2.length) {
    return false;
  }
  
  const sortedTags1 = [...tags1].sort();
  const sortedTags2 = [...tags2].sort();
  
  return sortedTags1.every((tag, index) => tag === sortedTags2[index]);
}

/**
 * 对标签进行分类处理
 * @param {string[]} tags 标签数组
 * @returns {Object} 分类后的标签对象
 */
export function categorizeTags(tags: string[]): {
  professionTags: string[];
  personalityTags: string[];
  functionTags: string[];
  otherTags: string[];
} {
  // 预定义的标签分类
  const professionTags = ['剑士', '骑士', '战士', '格斗家', '刺客', '元素法师', '咒术师', '预言师', '召唤师', '商人', '贸易商', '店主', '企业家', '学者', '研究员', '教师', '图书管理员', '铁匠', '木匠', '裁缝', '炼金师', '农民', '牧民', '渔民', '猎人', '贵族', '领主', '公爵', '伯爵', '盗贼', '小偷', '扒手', '医师', '药师', '治疗师', '画家', '音乐家', '诗人', '演员', '国王', '大臣', '议员', '外交官'];
  
  const personalityTags = ['勇敢', '谨慎', '冲动', '理智', '善良', '邪恶', '忠诚', '背叛', '乐观', '悲观', '自信', '自卑', '主动', '被动', '领导型', '跟随型', '独立型', '依赖型', '热情', '冷漠', '敏感', '麻木', '温柔', '粗暴'];
  
  const functionTags = ['推动者', '阻碍者', '见证者', '催化剂', '牺牲者', '拯救者', '信息提供者', '冲突引发者', '情节转折者', '主题体现者'];
  
  // 初始化分类数组
  const categorizedTags = {
    professionTags: [] as string[],
    personalityTags: [] as string[],
    functionTags: [] as string[],
    otherTags: [] as string[]
  };
  
  // 对标签进行分类
  tags.forEach(tag => {
    if (professionTags.includes(tag)) {
      categorizedTags.professionTags.push(tag);
    } else if (personalityTags.includes(tag)) {
      categorizedTags.personalityTags.push(tag);
    } else if (functionTags.includes(tag)) {
      categorizedTags.functionTags.push(tag);
    } else {
      categorizedTags.otherTags.push(tag);
    }
  });
  
  return categorizedTags;
}