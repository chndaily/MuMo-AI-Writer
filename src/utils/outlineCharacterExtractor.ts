import { NovelOutline } from '#/novel';

/**
 * 从大纲内容中提取提及的角色信息
 * @param outlines 大纲内容数组
 * @returns 提取到的角色名称数组
 */
export async function extractCharactersFromOutline(outlines: NovelOutline[]): Promise<string[]> {
  const characterNames: string[] = [];
  const characterNameSet = new Set<string>();
  
  // 遍历所有大纲内容
  for (const outline of outlines) {
    if (outline.content) {
      // 使用正则表达式提取可能的角色名称
      // 查找类似"主角：嬴政"、"人物：赵姬"、"角色：王翦"等模式
      const characterPatterns = [
        /主角[:：]\s*([^\n\r,，、]+)/gi,
        /人物[:：]\s*([^\n\r,，、]+)/gi,
        /角色[:：]\s*([^\n\r,，、]+)/gi,
        /主要人物[:：]\s*([^\n\r,，、]+)/gi,
        /关键人物[:：]\s*([^\n\r,，、]+)/gi,
        /重要角色[:：]\s*([^\n\r,，、]+)/gi,
        /核心人物[:：]\s*([^\n\r,，、]+)/gi,
        /登场人物[:：]\s*([^\n\r,，、]+)/gi,
        /出场角色[:：]\s*([^\n\r,，、]+)/gi,
        // 添加对列表格式的支持
        /[\d一二三四五六七八九十][\.、]\s*([^\n\r,，、]+)/gi
      ];
      
      for (const pattern of characterPatterns) {
        let match;
        while ((match = pattern.exec(outline.content)) !== null) {
          // 对于列表格式，需要特殊处理
          let namesStr = match[1];
          if (pattern.toString().includes('[\d一二三四五六七八九十]')) {
            // 列表格式，直接使用匹配到的内容
            namesStr = match[0].replace(/[\d一二三四五六七八九十][\.、]\s*/, '');
          }
          
          const names = namesStr.split(/[,，、]/).map(name => name.trim()).filter(name => name);
          for (const name of names) {
            // 过滤掉一些明显的非角色名称
            if (name.length > 1 && 
                !name.includes('章节') && 
                !name.includes('卷') && 
                !name.includes('情节') && 
                !name.includes('故事') && 
                !name.includes('背景') && 
                !name.includes('设定') &&
                name.length <= 10) { // 限制角色名称长度
              characterNameSet.add(name);
            }
          }
        }
      }
      
      // 查找内容中单独出现的人名（2-4个汉字）
      const namePattern = /[\u4e00-\u9fa5]{2,4}/g;
      let nameMatch;
      while ((nameMatch = namePattern.exec(outline.content)) !== null) {
        const name = nameMatch[0];
        // 如果这个名称在大纲中出现频率较高，可能是重要角色
        const occurrenceCount = (outline.content.match(new RegExp(name, 'g')) || []).length;
        if (occurrenceCount >= 2) { // 至少出现2次
          characterNameSet.add(name);
        }
      }
      
      // 特别处理您提供的大纲格式
      // 查找类似"嬴政 / 始皇：贯穿全文的核心主角"这样的格式
      const specialPattern = /([^\s\/\n\r]+)\s*[\/\-]?\s*([^\s：:]+)?\s*[:：]([^\n\r]+)/g;
      let specialMatch;
      while ((specialMatch = specialPattern.exec(outline.content)) !== null) {
        const name = specialMatch[1].trim();
        // 检查是否是合理的人名（2-4个汉字）
        if (name.length >= 2 && name.length <= 10 && /[\u4e00-\u9fa5]/.test(name)) {
          characterNameSet.add(name);
        }
      }
      
      // 特别处理括号中的角色定义
      // 查找类似"王翦（名将，辅佐嬴政建军、灭楚）"这样的格式
      const bracketPattern = /([^\s\(\)（）]+)\s*[（\(]([^）\)]+)[）\)]/g;
      let bracketMatch;
      while ((bracketMatch = bracketPattern.exec(outline.content)) !== null) {
        const name = bracketMatch[1].trim();
        // 检查是否是合理的人名（2-4个汉字或合理的角色名）
        if (name.length >= 2 && name.length <= 10 && 
            (/[\u4e00-\u9fa5]/.test(name) || /^[A-Za-z""]+$/.test(name))) {
          characterNameSet.add(name);
        }
      }
      
      // 特别处理列表格式中的角色
      // 查找类似"1. 赵高（赵国王族远支，入秦为宦，后期弄权）"这样的格式
      const listPattern = /[\d一二三四五六七八九十][\.、]\s*([^\n\r]+)/g;
      let listMatch;
      while ((listMatch = listPattern.exec(outline.content)) !== null) {
        const listItem = listMatch[1].trim();
        // 检查是否包含括号定义
        if (listItem.includes('（') || listItem.includes('(')) {
          const bracketMatch = listItem.match(/([^\s\(\)（）]+)\s*[（\(]/);
          if (bracketMatch) {
            const name = bracketMatch[1].trim();
            // 检查是否是合理的人名（2-4个汉字或合理的角色名）
            if (name.length >= 2 && name.length <= 10 && 
                (/[\u4e00-\u9fa5]/.test(name) || /^[A-Za-z""]+$/.test(name))) {
              characterNameSet.add(name);
            }
          }
        }
      }
      
      // 特别处理冒号前的角色名（处理大纲中的各种格式）
      // 查找类似"赵国：赵偃（赵国贵族子弟，多次欺凌嬴政）"这样的格式
      const colonPattern = /(?:^|[\n\r])[^：:\n\r]*?[：:]\s*([^\n\r]+)/gm;
      let colonMatch;
      while ((colonMatch = colonPattern.exec(outline.content)) !== null) {
        const lineContent = colonMatch[1].trim();
        // 检查这一行是否包含括号定义
        if (lineContent.includes('（') || lineContent.includes('(')) {
          // 提取括号前的角色名
          const rolePattern = /([^\s\(\)（）]+)\s*[（\(]/g;
          let roleMatch;
          while ((roleMatch = rolePattern.exec(lineContent)) !== null) {
            const name = roleMatch[1].trim();
            // 检查是否是合理的人名（2-4个汉字或合理的角色名）
            if (name.length >= 2 && name.length <= 10 && 
                (/[\u4e00-\u9fa5]/.test(name) || /^[A-Za-z""]+$/.test(name))) {
              characterNameSet.add(name);
            }
          }
        }
      }
      
      // 特别处理特定格式的角色定义（处理大纲中的分组格式）
      // 查找类似"军事核心：王翦（名将，辅佐嬴政建军、灭楚）"这样的格式
      const sectionPattern = /(?:军事核心|政治核心|赵国|韩国|魏国|楚国|齐国|燕国|赵国遗民|韩国遗民|魏国遗民|楚国遗民|齐国遗民|燕国遗民|儒家|道家|法家|墨家|阴阳家|诸子|女儿|妃嫔)[:：]\s*([^\n\r]+)/g;
      let sectionMatch;
      while ((sectionMatch = sectionPattern.exec(outline.content)) !== null) {
        const sectionContent = sectionMatch[1].trim();
        // 查找括号中的角色定义
        const rolePattern = /([^\s\(\)（）]+)\s*[（\(]/g;
        let roleMatch;
        while ((roleMatch = rolePattern.exec(sectionContent)) !== null) {
          const name = roleMatch[1].trim();
          // 检查是否是合理的人名（2-4个汉字或合理的角色名）
          if (name.length >= 2 && name.length <= 10 && 
              (/[\u4e00-\u9fa5]/.test(name) || /^[A-Za-z""]+$/.test(name))) {
            characterNameSet.add(name);
          }
        }
      }
    }
  }
  
  // 转换为数组并去重
  characterNames.push(...characterNameSet);
  
  // 进一步过滤，移除一些明显不是角色名称的词
  const filteredNames = characterNames.filter(name => {
    const excludeKeywords = [
      '故事', '情节', '背景', '设定', '章节', '卷', '内容', '描述', '介绍',
      '人物', '角色', '主角', '配角', '反派', '重要', '关键', '核心', '登场',
      '出场', '主要', '次要', '相关', '有关', '涉及', '包含', '包括',
      '军事', '政治', '核心', '重要', '关键', '主要', '辅助', '象征', '下属',
      '名将', '贵族', '子弟', '成员', '体系', '制度', '体系', '代表', '水工',
      '术士', '游侠', '门客', '领袖', '学者', '之女', '之子', '远支', '近支',
      '后代', '祖先', '先祖', '后人', '后裔', '家族', '王朝', '帝国', '国家',
      '民族', '部落', '群体', '组织', '机构', '部门', '单位', '系统', '机制',
      '模式', '方法', '技术', '工艺', '艺术', '文化', '文明', '思想', '理念',
      '观念', '观点', '看法', '态度', '立场', '位置', '地位', '身份', '资格',
      '能力', '技能', '技巧', '方法', '手段', '工具', '武器', '装备', '设施',
      '设备', '建筑', '工程', '项目', '计划', '方案', '策略', '战略', '战术',
      '方法', '途径', '道路', '路径', '路线', '方向', '目标', '目的', '意图',
      '愿望', '梦想', '理想', '希望', '期望', '期待', '渴望', '追求', '奋斗',
      '努力', '拼搏', '军事核心', '政治核心', '核心人物', '重要人物', '关键人物',
      '主要人物', '登场人物', '出场人物', '辅助者', '关键辅助', '核心辅助',
      '重要辅助', '主要辅助', '人）', '、', '：', '：', '（', '）', '(', ')',
      '赵国', '韩国', '魏国', '楚国', '齐国', '燕国', '秦国', '秦帝国', '大秦',
      '嬴政母亲', '嬴政之子', '嬴政爱女', '嬴政少子', '嬴政长子', '赵国王族',
      '韩相国', '燕国游侠', '赵国平原君', '楚国王族', '齐地', '魏国降将',
      '秦国丞相', '赵国贵族', '燕国贵族', '齐国王族', '燕国王族', '韩国水工',
      '法家代表', '博士', '方士', '术士', '墨家领袖', '稷下学宫', '三公九卿',
      '皇室', '宫廷', '边军', '贵族子弟', '末代君主', '水工', '将领', '名将',
      '游侠', '门客', '领袖', '学者', '术士', '降将', '远支', '近支', '后人',
      '后裔', '家族', '王朝', '帝国', '国家', '民族', '部落', '群体', '组织',
      '机构', '部门', '单位', '系统', '机制', '模式', '方法', '技术', '工艺',
      '艺术', '文化', '文明', '思想', '理念', '观念', '观点', '看法', '态度',
      '立场', '位置', '地位', '身份', '资格', '能力', '技能', '技巧', '方法',
      '手段', '工具', '武器', '装备', '设施', '设备', '建筑', '工程', '项目',
      '计划', '方案', '策略', '战略', '战术', '途径', '道路', '路径', '路线',
      '方向', '目标', '目的', '意图', '愿望', '梦想', '理想', '希望', '期望',
      '期待', '渴望', '追求', '奋斗', '努力', '拼搏', '核心主角与关键辅助者',
      '秦国重要臣子与亲信', '六国敌对势力与反抗者', '六国遗民与新秦人',
      '思想界与宗教人士', '嬴政诸子与女性亲属', '虚构人物与象征性角色',
      '军事核心', '政治核心', '赵国遗民', '韩国遗民', '魏国遗民', '楚国遗民',
      '齐国遗民', '燕国遗民', '助者', '战死', '丞相', '君主', '投降', '成长',
      '分封', '法家', '墨家', '诸子', '新秦人', '抗秦军'
    ];
    
    // 检查是否包含排除关键词
    const hasExcludeKeyword = excludeKeywords.some(keyword => name.includes(keyword));
    
    // 检查是否是合理的角色名称（主要由汉字组成，或者合理的英文名）
    const isChineseName = /^[\u4e00-\u9fa5]+$/.test(name);
    const isEnglishName = /^[A-Za-z""]+$/.test(name);
    
    // 如果包含排除关键词，则过滤掉
    if (hasExcludeKeyword) {
      return false;
    }
    
    // 如果名称长度小于2或大于10，则过滤掉
    if (name.length < 2 || name.length > 10) {
      return false;
    }
    
    // 如果是中文名或英文名，则保留
    if (isChineseName || isEnglishName) {
      return true;
    }
    
    return false;
  });
  
  return [...new Set(filteredNames)];
}

/**
 * 从大纲内容中提取详细的角色信息（包括上下文）
 * @param outlines 大纲内容数组
 * @returns 提取到的角色信息对象数组
 */
export async function extractDetailedCharactersFromOutline(outlines: NovelOutline[]): Promise<Array<{name: string, context: string}>> {
  const characters: Array<{name: string, context: string}> = [];
  const characterMap = new Map<string, {name: string, contexts: string[]}>();
  
  // 遍历所有大纲内容
  for (const outline of outlines) {
    if (outline.content) {
      // 查找包含角色信息的段落
      const lines = outline.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // 查找可能包含角色信息的行
        if (line.includes('：') || line.includes(':')) {
          const parts = line.split(/[:：]/);
          if (parts.length >= 2) {
            const potentialName = parts[0].trim();
            const description = parts.slice(1).join('：').trim();
            
            // 检查是否可能是角色名称
            if (potentialName.length >= 2 && 
                potentialName.length <= 10 && 
                /[\u4e00-\u9fa5]{2,10}/.test(potentialName) &&
                !['故事', '情节', '背景', '设定', '章节', '卷', '内容', '描述', '介绍'].some(keyword => potentialName.includes(keyword))) {
              
              // 获取上下文（前后几行）
              const contextStart = Math.max(0, i - 1);
              const contextEnd = Math.min(lines.length, i + 2);
              const context = lines.slice(contextStart, contextEnd).join('\n').trim();
              
              if (characterMap.has(potentialName)) {
                // 如果角色已存在，添加上下文
                const existing = characterMap.get(potentialName)!;
                existing.contexts.push(context);
              } else {
                // 添加新角色
                characterMap.set(potentialName, {
                  name: potentialName,
                  contexts: [context]
                });
              }
            }
          }
        }
      }
    }
  }
  
  // 转换为数组格式
  characterMap.forEach((value, key) => {
    characters.push({
      name: value.name,
      context: value.contexts.join('\n---\n') // 用分隔符连接多个上下文
    });
  });
  
  return characters;
}

/**
 * 从大纲内容中提取已提及但未详细设定的角色
 * @param outlines 大纲内容数组
 * @param existingCharacterNames 已存在的角色名称数组
 * @returns 未详细设定的角色名称数组
 */
export async function extractUndetailedCharactersFromOutline(
  outlines: NovelOutline[], 
  existingCharacterNames: string[]
): Promise<string[]> {
  // 提取所有提及的角色
  const allMentionedCharacters = await extractCharactersFromOutline(outlines);
  
  // 过滤出未详细设定的角色（只在大纲中提及但没有详细信息的角色）
  const undetailedCharacters: string[] = [];
  const existingNameSet = new Set(existingCharacterNames);
  
  for (const character of allMentionedCharacters) {
    // 如果角色不在已存在角色列表中，则认为是未详细设定的角色
    if (!existingNameSet.has(character)) {
      undetailedCharacters.push(character);
    }
  }
  
  return undetailedCharacters;
}

export default {
  extractCharactersFromOutline,
  extractDetailedCharactersFromOutline,
  extractUndetailedCharactersFromOutline
};