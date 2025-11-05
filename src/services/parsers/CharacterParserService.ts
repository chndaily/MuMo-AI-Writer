import { extractTagsFromAIContent, normalizeTags, categorizeTags } from '@/utils/tagSyncUtils';

/**
 * 角色解析服务
 * 专门负责解析角色类型的AI生成内容
 */
export class CharacterParserService {
  /**
   * 解析角色内容（支持多个角色）
   */
  async parseCharacterContent(content: string): Promise<any[]> {
    console.log('parserServices.character.parseCharacterContent 调用');
    
    // 按角色设定分割内容
    const characterSections = this.splitContentByCharacters(content);
    
    if (characterSections.length === 0) {
      // 如果没有找到明确的角色分隔符，尝试解析整个内容作为一个角色
      const singleCharacter = this.parseSingleCharacter(content);
      return singleCharacter ? [singleCharacter] : [];
    }
    
    const characters: any[] = [];
    for (const section of characterSections) {
      const character = this.parseSingleCharacter(section);
      if (character) {
        characters.push(character);
      }
    }
    
    console.log('解析到的角色数组:', characters);
    return characters;
  }
  
  /**
   * 按角色设定分割内容
   */
  private splitContentByCharacters(content: string): string[] {
    // 查找所有【角色设定】标记，支持多种格式
    const characterMarkers = [...content.matchAll(/【角色设定[:：]?\s*[^】]*】/g)];
    
    // 如果没有找到标准格式的角色设定标记，尝试查找其他可能的标记
    if (characterMarkers.length === 0) {
      // 查找"角色"关键词作为分割点
      const roleMarkers = [...content.matchAll(/(^|\n)##?\s*角色\s*\d*[:：]?/g)];
      if (roleMarkers.length > 1) {
        const sections: string[] = [];
        for (let i = 0; i < roleMarkers.length; i++) {
          const start = roleMarkers[i].index!;
          const end = i < roleMarkers.length - 1 ? roleMarkers[i + 1].index! : content.length;
          sections.push(content.substring(start, end).trim());
        }
        return sections;
      }
      
      // 如果还是没有找到分割点，返回整个内容作为一个角色
      return [];
    }
    
    if (characterMarkers.length <= 1) {
      // 如果只有一个或没有角色标记，返回整个内容
      return [];
    }
    
    const sections: string[] = [];
    for (let i = 0; i < characterMarkers.length; i++) {
      const start = characterMarkers[i].index!;
      const end = i < characterMarkers.length - 1 ? characterMarkers[i + 1].index! : content.length;
      sections.push(content.substring(start, end).trim());
    }
    
    return sections;
  }
  
  /**
   * 解析单个角色
   */
  private parseSingleCharacter(content: string): any {
    const lines = content.split('\n');
    const character: any = {
      role: 'supporting' // 默认角色类型
    };

    // 定义各部分的标识
    const sections = {
      basicInfo: false,
      appearance: false,
      personality: false,
      background: false,
      abilities: false,
      relationships: false,
      characterArc: false,
      details: false
    };

    let currentSection: keyof typeof sections | null = null;
    // 用于累积多行内容
    let currentField: string | null = null;
    // 用于累积描述内容
    let descriptionContent: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检查是否进入新的部分
      if (trimmedLine.includes('【基本信息】')) {
        currentSection = 'basicInfo';
        currentField = null;
        continue;
      } else if (trimmedLine.includes('【外貌特征】')) {
        currentSection = 'appearance';
        currentField = 'appearance';
        // 处理同一行的内容，但要排除标签本身
        const appearanceValue = this.extractValue(trimmedLine);
        if (appearanceValue && !appearanceValue.includes('【外貌特征】')) {
          character.appearance = this.normalizeLineBreaks(appearanceValue);
        }
        continue;
      } else if (trimmedLine.includes('【性格特质】')) {
        currentSection = 'personality';
        currentField = 'personality';
        // 处理同一行的内容，但要排除标签本身
        const personalityValue = this.extractValue(trimmedLine);
        if (personalityValue && !personalityValue.includes('【性格特质】')) {
          character.personality = this.normalizeLineBreaks(personalityValue);
        }
        continue;
      } else if (trimmedLine.includes('【背景故事】')) {
        currentSection = 'background';
        currentField = 'background';
        // 处理同一行的内容，但要排除标签本身
        const backgroundValue = this.extractValue(trimmedLine);
        if (backgroundValue && !backgroundValue.includes('【背景故事】')) {
          character.background = this.normalizeLineBreaks(backgroundValue);
        }
        continue;
      } else if (trimmedLine.includes('【能力设定】')) {
        currentSection = 'abilities';
        currentField = 'abilities';
        // 处理同一行的内容，但要排除标签本身
        const abilitiesValue = this.extractValue(trimmedLine);
        if (abilitiesValue && !abilitiesValue.includes('【能力设定】')) {
          character.abilities = this.normalizeLineBreaks(abilitiesValue);
        }
        continue;
      } else if (trimmedLine.includes('【人际关系】')) {
        currentSection = 'relationships';
        currentField = 'relationships';
        // 处理同一行的内容，但要排除标签本身
        const relationshipsValue = this.extractValue(trimmedLine);
        if (relationshipsValue && !relationshipsValue.includes('【人际关系】')) {
          character.relationships = this.normalizeLineBreaks(relationshipsValue);
        }
        continue;
      } else if (trimmedLine.includes('【角色发展弧光】')) {
        currentSection = 'characterArc';
        currentField = 'characterArc';
        // 处理同一行的内容，但要排除标签本身
        const characterArcValue = this.extractValue(trimmedLine);
        if (characterArcValue && !characterArcValue.includes('【角色发展弧光】')) {
          character.characterArc = this.normalizeLineBreaks(characterArcValue);
        }
        continue;
      } else if (trimmedLine.includes('【细节补充】')) {
        currentSection = 'details';
        currentField = 'details';
        // 处理同一行的内容，但要排除标签本身
        const detailsValue = this.extractValue(trimmedLine);
        if (detailsValue && !detailsValue.includes('【细节补充】')) {
          character.details = this.normalizeLineBreaks(detailsValue);
        }
        continue;
      }
      
      // 处理各部分内容
      if (currentSection) {
        switch (currentSection) {
          case 'basicInfo':
            if (trimmedLine.includes('姓名') || trimmedLine.includes('名字') || trimmedLine.includes('名称')) {
              const nameValue = this.extractValue(trimmedLine);
              character.name = nameValue;
            } else if (trimmedLine.includes('角色类型')) {
              const roleValue = this.extractValue(trimmedLine).toLowerCase().trim();
              // 直接使用AI生成的角色类型，而不是映射到预设值
              character.role = roleValue;
              
              // 修复：确保customRole字段正确设置，保存原始的角色类型值
              // 不管是否包含括号，都保存到customRole字段以确保显示
              character.customRole = this.extractValue(trimmedLine).trim();
            } else if (trimmedLine.includes('标签')) {
              // 统一使用 extractTagsFromAIContent 和 normalizeTags 处理标签
              const tagsStr = this.extractValue(trimmedLine);
              if (tagsStr) {
                // 为extractTagsFromAIContent函数构造合适的输入格式
                const formattedContent = `标签：${tagsStr}`;
                const extractedTags = extractTagsFromAIContent(formattedContent);
                character.tags = normalizeTags(extractedTags);
                
                // 分析标签类型并分类存储
                const categorizedTags = categorizeTags(extractedTags);
                character.professionTags = categorizedTags.professionTags || [];
                character.personalityTags = categorizedTags.personalityTags || [];
                character.functionTags = categorizedTags.functionTags || [];
              }
            } else if (trimmedLine.includes('【描述】') || trimmedLine.includes('【简介】')) {
              // 精确提取描述字段内容，只提取【描述】标签后的内容
              const descMatch = trimmedLine.match(/【描述】[:：]\s*(.*)/) || trimmedLine.match(/【简介】[:：]\s*(.*)/);
              if (descMatch && descMatch[1]) {
                const descValue = descMatch[1].trim();
                character.description = this.normalizeLineBreaks(descValue);
              }
            } else if (trimmedLine.includes('描述') || trimmedLine.includes('简介')) {
              // 备用方案，处理没有【】标记的描述
              const descValue = this.extractValue(trimmedLine);
              if (descValue && !character.description) {
                character.description = this.normalizeLineBreaks(descValue);
              }
            }
            break;
          case 'appearance':
          case 'personality':
          case 'background':
          case 'abilities':
          case 'relationships':
          case 'characterArc':
          case 'details':
            // 处理多行内容，累积所有非空行和非标题行的内容
            if (trimmedLine && !trimmedLine.includes('【')) {
              // 处理列表项（以-或数字开头的行）
              if (trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
                if (!character[currentField]) {
                  character[currentField] = this.normalizeLineBreaks(trimmedLine);
                } else {
                  character[currentField] += '\n' + this.normalizeLineBreaks(trimmedLine);
                }
              } else if (!trimmedLine.startsWith('---')) {
                // 处理普通文本行，但排除分隔符
                if (!character[currentField]) {
                  character[currentField] = this.normalizeLineBreaks(trimmedLine);
                } else {
                  character[currentField] += '\n' + this.normalizeLineBreaks(trimmedLine);
                }
              }
            }
            break;
        }
      } else {
        // 处理没有明确部分的内容，作为描述
        if (trimmedLine.includes('姓名') || trimmedLine.includes('名字') || trimmedLine.includes('名称')) {
          if (!character.name) {
            character.name = this.extractValue(trimmedLine);
          }
        } else if (trimmedLine.includes('【描述】') || trimmedLine.includes('【简介】')) {
          if (!character.description) {
            // 精确提取描述字段内容
            const descMatch = trimmedLine.match(/【描述】[:：]\s*(.*)/) || trimmedLine.match(/【简介】[:：]\s*(.*)/);
            if (descMatch && descMatch[1]) {
              const descValue = descMatch[1].trim();
              character.description = this.normalizeLineBreaks(descValue);
            }
          }
        } else if (trimmedLine.includes('描述') || trimmedLine.includes('简介')) {
          if (!character.description) {
            // 备用方案，处理没有【】标记的描述
            character.description = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('外貌') || trimmedLine.includes('外表')) {
          if (!character.appearance) {
            character.appearance = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            character.appearance += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('性格') || trimmedLine.includes('个性')) {
          if (!character.personality) {
            character.personality = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            character.personality += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('背景') || trimmedLine.includes('经历')) {
          if (!character.background) {
            character.background = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            character.background += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('能力')) {
          if (!character.abilities) {
            character.abilities = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            character.abilities += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('关系')) {
          if (!character.relationships) {
            character.relationships = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            character.relationships += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('发展')) {
          if (!character.characterArc) {
            character.characterArc = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            character.characterArc += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('细节补充')) {
          if (!character.details) {
            character.details = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            character.details += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('标签')) {
          // 解析标签，统一使用工具函数
          const tagsStr = this.extractValue(trimmedLine);
          if (tagsStr) {
            const extractedTags = extractTagsFromAIContent(`标签：${tagsStr}`);
            if (!character.tags) {
              character.tags = normalizeTags(extractedTags);
            } else {
              // 合并标签，去重
              character.tags = [...new Set([...character.tags, ...normalizeTags(extractedTags)])];
            }
            
            // 分析标签类型并分类存储
            const categorizedTags = categorizeTags(extractedTags);
            if (!character.professionTags) character.professionTags = [];
            if (!character.personalityTags) character.personalityTags = [];
            if (!character.functionTags) character.functionTags = [];
            
            character.professionTags = [...new Set([...character.professionTags, ...categorizedTags.professionTags])];
            character.personalityTags = [...new Set([...character.personalityTags, ...categorizedTags.personalityTags])];
            character.functionTags = [...new Set([...character.functionTags, ...categorizedTags.functionTags])];
          }
        } else if (trimmedLine && !trimmedLine.includes('【角色设定')) {
          // 累积纯文本内容作为描述的一部分（排除角色设定标题）
          descriptionContent.push(trimmedLine);
        }
      }
    }

    // 如果没有解析出名字，使用默认值
    if (!character.name) {
      // 尝试从内容中提取名称
      const nameMatch = content.match(/【角色设定\d*[:：]\s*([^】]+)】/);
      if (nameMatch && nameMatch[1]) {
        character.name = nameMatch[1].trim();
      } else {
        // 尝试从标题行提取名称
        const titleMatch = content.match(/【名称】[:：]\s*([^\n]+)/);
        if (titleMatch && titleMatch[1]) {
          character.name = titleMatch[1].trim();
        } else {
          character.name = 'AI生成角色';
        }
      }
    }

    // 如果没有描述，从累积的内容中提取或使用完整内容
    if (!character.description) {
      // 过滤掉空行和标题行，将累积的内容作为描述
      const filteredContent = descriptionContent.filter(line => 
        line.trim() && 
        !line.includes('【') && 
        !line.startsWith('---') &&
        !line.includes('---') &&
        !line.includes('角色设定') &&
        !line.includes('基本信息') &&
        line.trim() !== '```' // 过滤掉代码块标记
      );
      
      if (filteredContent.length > 0) {
        // 从累积的内容中提取真正的描述部分
        // 查找"描述"或"简介"关键词后的文本
        let descStartIndex = -1;
        for (let i = 0; i < filteredContent.length; i++) {
          if (filteredContent[i].includes('描述') || filteredContent[i].includes('简介')) {
            descStartIndex = i;
            break;
          }
        }
        
        if (descStartIndex !== -1) {
          // 提取描述内容（从关键词后的下一行开始）
          const descLines = filteredContent.slice(descStartIndex + 1);
          // 过滤掉明显的字段标识
          const cleanDescLines = descLines.filter(line => 
            !line.includes('角色类型') && 
            !line.includes('标签') && 
            !line.includes('外貌') && 
            !line.includes('性格') && 
            !line.includes('背景') && 
            !line.includes('能力') && 
            !line.includes('关系') && 
            !line.includes('发展') && 
            !line.includes('细节') &&
            !line.includes('：') && // 过滤掉带有冒号的行，这些通常是字段标识
            line.trim() !== '' && // 过滤掉空行
            line.trim() !== '```' // 过滤掉代码块标记
          );
          
          if (cleanDescLines.length > 0) {
            character.description = this.normalizeLineBreaks(cleanDescLines.join('\n'));
          }
        } else {
          // 如果找不到明确的描述部分，尝试查找第一个不包含字段标识的连续文本块
          let startIndex = -1;
          let endIndex = -1;
          
          // 查找第一个不包含字段标识的行
          for (let i = 0; i < filteredContent.length; i++) {
            const line = filteredContent[i];
            if (!line.includes('角色类型') && 
                !line.includes('标签') && 
                !line.includes('外貌') && 
                !line.includes('性格') && 
                !line.includes('背景') && 
                !line.includes('能力') && 
                !line.includes('关系') && 
                !line.includes('发展') && 
                !line.includes('细节') &&
                !line.includes('：')) {
              startIndex = i;
              break;
            }
          }
          
          // 如果找到了起始行，继续查找直到遇到字段标识为止
          if (startIndex !== -1) {
            for (let i = startIndex; i < filteredContent.length; i++) {
              const line = filteredContent[i];
              if (line.includes('角色类型') || 
                  line.includes('标签') || 
                  line.includes('外貌') || 
                  line.includes('性格') || 
                  line.includes('背景') || 
                  line.includes('能力') || 
                  line.includes('关系') || 
                  line.includes('发展') || 
                  line.includes('细节') ||
                  line.includes('：')) {
                endIndex = i;
                break;
              }
            }
            
            // 如果没有找到结束标识，则取到末尾
            if (endIndex === -1) {
              endIndex = filteredContent.length;
            }
            
            // 提取文本块
            const textBlock = filteredContent.slice(startIndex, endIndex);
            const cleanTextBlock = textBlock.filter(line => 
              line.trim() !== '' && 
              line.trim() !== '```'
            );
            
            if (cleanTextBlock.length > 0) {
              character.description = this.normalizeLineBreaks(cleanTextBlock.join('\n'));
            }
          }
        }
      }
      
      // 如果仍然没有内容，使用完整内容作为最后的备选
      if (!character.description) {
        // 从AI生成的内容中精确提取描述部分
        // 查找【描述】或【简介】字段后的内容
        const descMatch = content.match(/【描述】[:：]\s*([^\n]+)/) || content.match(/【简介】[:：]\s*([^\n]+)/);
        if (descMatch && descMatch[1]) {
          character.description = this.normalizeLineBreaks(descMatch[1].trim());
        } else {
          // 如果找不到明确的描述字段，使用完整内容作为最后的备选
          // 但要过滤掉其他字段内容
          const lines = content.split('\n');
          const cleanLines = lines.filter(line => {
            const trimmedLine = line.trim();
            return trimmedLine && 
              !trimmedLine.includes('【角色设定') &&
              !trimmedLine.includes('【基本信息】') &&
              !trimmedLine.includes('【名称】') &&
              !trimmedLine.includes('【角色类型】') &&
              !trimmedLine.includes('【标签】') &&
              !trimmedLine.includes('【外貌特征】') &&
              !trimmedLine.includes('【性格特质】') &&
              !trimmedLine.includes('【背景故事】') &&
              !trimmedLine.includes('【能力设定】') &&
              !trimmedLine.includes('【人际关系】') &&
              !trimmedLine.includes('【角色发展弧光】') &&
              !trimmedLine.includes('【细节补充】') &&
              !trimmedLine.startsWith('---');
          });
          
          if (cleanLines.length > 0) {
            character.description = this.normalizeLineBreaks(cleanLines.join('\n').trim());
          } else {
            character.description = this.normalizeLineBreaks(content);
          }
        }
      }
    }

    // 确保tags字段存在
    if (!character.tags) {
      character.tags = [];
    }
    
    // 如果没有解析到有效数据，返回null
    if (!character.name && (!character.tags || character.tags.length === 0)) {
      console.log('未解析到有效角色');
      return null;
    }
    
    console.log('解析到的单个角色数据:', character);
    return character;
  }

  /**
   * 解析角色类型
   * @param roleText 角色类型文本
   * @returns 标准化的角色类型
   */
  private parseRole(roleText: string): string {
    if (!roleText) return 'supporting';
    
    // 转换为小写并去除首尾空格
    const normalizedRole = roleText.toLowerCase().trim();
    
    // 定义角色类型映射
    const roleMap: Record<string, string> = {
      // 主角相关
      '主角': 'protagonist',
      '主人公': 'protagonist',
      '主要角色': 'protagonist',
      'protagonist': 'protagonist',
      'main character': 'protagonist',
      '主角（核心推动者）': 'protagonist',
      '主角（关键人物）': 'protagonist',
      
      // 反派相关
      '反派': 'antagonist',
      '反角': 'antagonist',
      '敌对角色': 'antagonist',
      'antagonist': 'antagonist',
      'villain': 'antagonist',
      '反派（主要对手）': 'antagonist',
      '反派（核心敌对者）': 'antagonist',
      
      // 配角相关
      '配角': 'supporting',
      '重要配角': 'supporting',
      'supporting': 'supporting',
      'supporting character': 'supporting',
      '配角（关键支持者）': 'supporting',
      '配角（重要辅助者）': 'supporting',
      '配角（医疗线核心成员）': 'supporting',
      '配角（情报线关键人物）': 'supporting',
      '配角（情感线推动者）': 'supporting',
      
      // 次要角色相关
      '次要角色': 'minor',
      'minor': 'minor',
      'minor character': 'minor',
      '次要': 'minor',
      '次要角色（背景人物）': 'minor',
      '次要角色（临时出现）': 'minor',
      
      // 侧面角色相关
      '侧面角色': 'side',
      'side': 'side',
      'side character': 'side',
      '侧面角色（辅助视角）': 'side',
      
      // 对照角色相关
      '对照角色': 'foil',
      'foil': 'foil',
      'foil character': 'foil',
      '对照角色（对比人物）': 'foil',
      
      // 导师角色相关
      '导师角色': 'mentor',
      '老师': 'mentor',
      'mentor': 'mentor',
      'teacher': 'mentor',
      '导师': 'mentor',
      '导师（指导者）': 'mentor',
      
      // 恋爱对象相关
      '恋爱对象': 'loveInterest',
      '恋人': 'loveInterest',
      'loveinterest': 'loveInterest',
      'love interest': 'loveInterest',
      '恋爱对象（情感线核心）': 'loveInterest',
      
      // 竞争对手相关
      '竞争对手': 'rival',
      '对手': 'rival',
      'rival': 'rival',
      'competitor': 'rival',
      '竞争对手（敌对关系）': 'rival',
      
      // 中立角色相关
      '中立角色': 'neutral',
      '中立': 'neutral',
      'neutral': 'neutral',
      'neutral character': 'neutral',
      '中立角色（第三方）': 'neutral',
      
      // 重要配角相关
      'keysupporting': 'keySupporting',
      'key supporting': 'keySupporting',
      '重要配角（核心辅助）': 'keySupporting',
      
      // 次要配角相关
      'minorsupporting': 'minorSupporting',
      'minor supporting': 'minorSupporting',
      '次要配角（背景辅助）': 'minorSupporting',
      
      // 复杂配角相关
      '复杂配角': 'complexSupporting',
      'complexsupporting': 'complexSupporting',
      'complex supporting': 'complexSupporting',
      '复杂配角（多面性）': 'complexSupporting'
    };
    
    // 首先尝试精确匹配
    if (roleMap[normalizedRole]) {
      return roleMap[normalizedRole];
    }
    
    // 如果没有精确匹配，尝试模糊匹配
    // 检查是否包含主角关键词
    if (normalizedRole.includes('主角') || normalizedRole.includes('主人公') || normalizedRole.includes('主要')) {
      return 'protagonist';
    }
    
    // 检查是否包含反派关键词
    if (normalizedRole.includes('反派') || normalizedRole.includes('反角') || normalizedRole.includes('敌对') || normalizedRole.includes(' villain') || normalizedRole.includes(' antagonist')) {
      return 'antagonist';
    }
    
    // 检查是否包含配角关键词
    if (normalizedRole.includes('配角') || normalizedRole.includes('supporting')) {
      return 'supporting';
    }
    
    // 检查是否包含次要角色关键词
    if (normalizedRole.includes('次要') || normalizedRole.includes('minor')) {
      return 'minor';
    }
    
    // 检查是否包含导师关键词
    if (normalizedRole.includes('导师') || normalizedRole.includes('老师') || normalizedRole.includes('mentor') || normalizedRole.includes(' teacher')) {
      return 'mentor';
    }
    
    // 检查是否包含恋爱对象关键词
    if (normalizedRole.includes('恋人') || normalizedRole.includes('恋爱') || normalizedRole.includes('love')) {
      return 'loveInterest';
    }
    
    // 检查是否包含竞争对手关键词
    if (normalizedRole.includes('对手') || normalizedRole.includes('竞争') || normalizedRole.includes('rival') || normalizedRole.includes(' competitor')) {
      return 'rival';
    }
    
    // 默认返回配角
    return 'supporting';
  }

  /**
   * 统一处理换行符
   */
  private normalizeLineBreaks(text: string): string {
    if (!text) return '';
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * 从文本行中提取值
   */
  private extractValue(line: string): string {
    // 处理中文冒号和英文冒号
    const colonIndex = line.indexOf('：');
    if (colonIndex > -1) {
      // 检查行是否包含标记（如【时间线】），如果是，则只提取冒号后的内容
      const value = line.substring(colonIndex + 1).trim();
      // 如果值以【开头，说明可能是标记，需要进一步处理
      if (value.startsWith('【')) {
        // 查找下一个】的位置
        const closingBracketIndex = value.indexOf('】');
        if (closingBracketIndex > -1) {
          // 如果】后面还有内容，则返回】后面的内容
          if (closingBracketIndex + 1 < value.length) {
            return value.substring(closingBracketIndex + 1).trim();
          } else {
            // 如果】是最后一个字符，则返回空字符串
            return '';
          }
        }
      }
      return value;
    }

    const englishColonIndex = line.indexOf(':');
    if (englishColonIndex > -1) {
      // 检查行是否包含标记（如【时间线】），如果是，则只提取冒号后的内容
      const value = line.substring(englishColonIndex + 1).trim();
      // 如果值以【开头，说明可能是标记，需要进一步处理
      if (value.startsWith('【')) {
        // 查找下一个】的位置
        const closingBracketIndex = value.indexOf('】');
        if (closingBracketIndex > -1) {
          // 如果】后面还有内容，则返回】后面的内容
          if (closingBracketIndex + 1 < value.length) {
            return value.substring(closingBracketIndex + 1).trim();
          } else {
            // 如果】是最后一个字符，则返回空字符串
            return '';
          }
        }
      }
      return value;
    }

    return line.trim();
  }
}

// 添加默认导出
export default new CharacterParserService();