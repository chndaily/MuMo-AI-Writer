import { WorldSettingType } from '@/types/ai-generation';
// 导入标签同步工具函数
import { extractTagsFromAIContent, syncTagsToElement, normalizeTags, areTagsEqual, categorizeTags } from '@/utils/tagSyncUtils';

/**
 * 世界设定解析服务
 * 专门负责解析各种世界设定类型的AI生成内容
 */
export class WorldSettingParserService {
  /**
   * 解析设定详细信息
   */
  parseSettingDetails(content: string, type: WorldSettingType): any {
    const lines = content.split('\n');
    const details: any = {};
    
    // 用于累积多行内容
    let currentField: string | null = null;
    let inBasicInfo = false; // 标记是否在基本信息部分

    // 根据不同类型解析不同的字段
    switch (type) {
      case 'character':
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 检查是否进入新的部分
          if (trimmedLine.includes('【基本信息】')) {
            inBasicInfo = true;
            currentField = null;
            continue;
          } else if (trimmedLine.includes('【外貌特征】')) {
            inBasicInfo = false;
            currentField = 'appearance';
            continue;
          } else if (trimmedLine.includes('【性格特质】')) {
            currentField = 'personality';
            continue;
          } else if (trimmedLine.includes('【背景故事】')) {
            currentField = 'background';
            continue;
          } else if (trimmedLine.includes('【人际关系】')) {
            currentField = 'relationships';
            continue;
          } else if (trimmedLine.includes('【细节补充】')) {
            currentField = 'details';
            continue;
          } else if (trimmedLine.includes('【能力设定】')) {
            currentField = 'abilities';
            continue;
          } else if (trimmedLine.includes('【角色发展弧光】')) {
            currentField = 'characterArc';
            continue;
          }
          
          // 处理各部分内容
          if (inBasicInfo) {
            // 处理基本信息部分
            if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
              details.name = this.extractValue(trimmedLine);
            } else if (trimmedLine.includes('标签')) {
              const tagsStr = this.extractValue(trimmedLine);
              if (tagsStr) {
                // 支持多种分隔符：逗号、顿号、中文顿号
                const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
                // 使用已导入的normalizeTags函数
                details.tags = normalizeTags(extractedTags);
              }
            } else if (trimmedLine.includes('描述')) {
              details.description = this.extractValue(trimmedLine);
            }
          } else if (currentField) {
            // 忽略空行和分隔符
            if (trimmedLine && !trimmedLine.includes('【') && !trimmedLine.startsWith('---')) {
              // 处理列表项（以-开头的行）
              if (trimmedLine.startsWith('-')) {
                if (!details[currentField]) {
                  details[currentField] = this.extractValue(trimmedLine);
                } else {
                  details[currentField] += '\n' + this.extractValue(trimmedLine);
                }
              } else {
                // 处理普通文本行，如果行中包含冒号，则提取冒号后的内容，否则直接使用整行
                let valueToUse = trimmedLine;
                if (trimmedLine.includes('：') || trimmedLine.includes(':')) {
                  valueToUse = this.extractValue(trimmedLine);
                }
                // 修复：确保即使没有冒号的内容也能被正确处理
                if (!details[currentField]) {
                  details[currentField] = valueToUse;
                } else {
                  details[currentField] += '\n' + valueToUse;
                }
              }
            }
          } else {
            // 处理没有明确部分的内容
            if (trimmedLine.includes('外貌') || trimmedLine.includes('外表')) {
              if (!details.appearance) {
                details.appearance = this.extractValue(trimmedLine);
              } else {
                details.appearance += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('性格') || trimmedLine.includes('个性')) {
              if (!details.personality) {
                details.personality = this.extractValue(trimmedLine);
              } else {
                details.personality += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('背景') || trimmedLine.includes('经历')) {
              if (!details.background) {
                details.background = this.extractValue(trimmedLine);
              } else {
                details.background += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('能力')) {
              if (!details.abilities) {
                details.abilities = this.extractValue(trimmedLine);
              } else {
                details.abilities += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('关系')) {
              if (!details.relationships) {
                details.relationships = this.extractValue(trimmedLine);
              } else {
                details.relationships += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('发展') || trimmedLine.includes('弧光')) {
              if (!details.characterArc) {
                details.characterArc = this.extractValue(trimmedLine);
              } else {
                details.characterArc += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('细节')) {
              if (!details.details) {
                details.details = this.extractValue(trimmedLine);
              } else {
                details.details += '\n' + this.extractValue(trimmedLine);
              }
            }
          }
        }
        break;
      case 'location':
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 检查是否进入新的部分
          if (trimmedLine.includes('【基本信息】')) {
            inBasicInfo = true;
            currentField = null;
            continue;
          } else if (trimmedLine.includes('【类型】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'type';
            continue;
          } else if (trimmedLine.includes('【重要性】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'importance';
            continue;
          } else if (trimmedLine.includes('【地理位置】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'geography';
            continue;
          } else if (trimmedLine.includes('【气候特征】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'climate';
            continue;
          } else if (trimmedLine.includes('【地形特征】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'terrain';
            continue;
          } else if (trimmedLine.includes('【自然资源】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'naturalResources';
            continue;
          } else if (trimmedLine.includes('【生态环境】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'ecosystem';
            continue;
          } else if (trimmedLine.includes('【建筑风格】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'architecture';
            continue;
          } else if (trimmedLine.includes('【社会结构】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'socialStructure';
            continue;
          } else if (trimmedLine.includes('【文化特色】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'culture';
            continue;
          } else if (trimmedLine.includes('【历史背景】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'historyBackground';
            continue;
          } else if (trimmedLine.includes('【政治环境】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'politics';
            continue;
          } else if (trimmedLine.includes('【统治体系】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'governance';
            continue;
          } else if (trimmedLine.includes('【法律法规】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'laws';
            continue;
          } else if (trimmedLine.includes('【经济状况】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'economy';
            continue;
          } else if (trimmedLine.includes('【主要产业】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'mainIndustries';
            continue;
          } else if (trimmedLine.includes('【贸易情况】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'trade';
            continue;
          } else if (trimmedLine.includes('【财富水平】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'wealth';
            continue;
          } else if (trimmedLine.includes('【细节补充】')) {
            inBasicInfo = false;  // 修复：确保离开基本信息部分
            currentField = 'details';
            continue;
          }
          
          // 处理各部分内容
          if (inBasicInfo) {
            // 处理基本信息部分
            if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
              details.name = this.extractValue(trimmedLine);
            } else if (trimmedLine.includes('标签')) {
              const tagsStr = this.extractValue(trimmedLine);
              if (tagsStr) {
                // 支持多种分隔符：逗号、顿号、中文顿号
                const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
                // 使用已导入的normalizeTags函数
                details.tags = normalizeTags(extractedTags);
              }
            } else if (trimmedLine.includes('描述')) {
              details.description = this.extractValue(trimmedLine);
            } else if (trimmedLine.includes('类型')) {
              details.type = this.extractValue(trimmedLine);  // 修复：使用type字段
            } else if (trimmedLine.includes('重要性')) {
              details.importance = this.extractValue(trimmedLine);
            }
          } else if (currentField) {
            // 重构：正确处理字段内容
            // 忽略空行和分隔符
            if (trimmedLine && !trimmedLine.includes('【') && !trimmedLine.startsWith('---')) {
              // 处理列表项（以-开头的行）
              if (trimmedLine.startsWith('-')) {
                if (!details[currentField]) {
                  details[currentField] = this.extractValue(trimmedLine);
                } else {
                  details[currentField] += '\n' + this.extractValue(trimmedLine);
                }
              } else {
                // 处理普通文本行，如果行中包含冒号，则提取冒号后的内容，否则直接使用整行
                let valueToUse = trimmedLine;
                if (trimmedLine.includes('：') || trimmedLine.includes(':')) {
                  valueToUse = this.extractValue(trimmedLine);
                }
                // 修复：确保即使没有冒号的内容也能被正确处理
                if (!details[currentField]) {
                  details[currentField] = valueToUse;
                } else {
                  details[currentField] += '\n' + valueToUse;
                }
              }
            }
          } else {
            // 处理没有明确部分的内容
            if (trimmedLine.includes('位置') || trimmedLine.includes('地理')) {
              if (!details.geography) {
                details.geography = this.extractValue(trimmedLine);
              } else {
                details.geography += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('气候')) {
              if (!details.climate) {
                details.climate = this.extractValue(trimmedLine);
              } else {
                details.climate += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('地形')) {
              if (!details.terrain) {
                details.terrain = this.extractValue(trimmedLine);
              } else {
                details.terrain += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('政治') && !trimmedLine.includes('标签')) {
              // 只有在不是标签行的情况下才处理政治环境
              if (!details.politics) {
                details.politics = this.extractValue(trimmedLine);
              } else {
                details.politics += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('经济') && !trimmedLine.includes('标签')) {
              // 只有在不是标签行的情况下才处理经济状况
              if (!details.economy) {
                details.economy = this.extractValue(trimmedLine);
              } else {
                details.economy += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('类型')) {
              if (!details.type) {  // 修复：使用type字段
                // 添加类型映射处理
                const rawType = this.extractValue(trimmedLine);
                details.type = this.mapLocationType(rawType);
              } else {
                // 添加类型映射处理
                const rawType = this.extractValue(trimmedLine);
                details.type += '\n' + this.mapLocationType(rawType);
              }
            } else if (trimmedLine.includes('重要性')) {
              if (!details.importance) {
                // 添加重要性映射处理
                const rawImportance = this.extractValue(trimmedLine);
                details.importance = this.mapLocationImportance(rawImportance);
              } else {
                // 添加重要性映射处理
                const rawImportance = this.extractValue(trimmedLine);
                details.importance += '\n' + this.mapLocationImportance(rawImportance);
              }
            } else if (trimmedLine.includes('细节')) {
              if (!details.details) {
                details.details = this.extractValue(trimmedLine);
              } else {
                details.details += '\n' + this.extractValue(trimmedLine);
              }
            }
          }
        }
        break;
      case 'culture':
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 检查是否进入新的部分
          if (trimmedLine.includes('【基本信息】')) {
            inBasicInfo = true;
            currentField = null;
            continue;
          } else if (trimmedLine.includes('【传统习俗】')) {
            inBasicInfo = false;
            currentField = 'customs';
            continue;
          } else if (trimmedLine.includes('【价值观念】')) {
            currentField = 'values';
            continue;
          } else if (trimmedLine.includes('【艺术表现】')) {
            currentField = 'art';
            continue;
          } else if (trimmedLine.includes('【宗教信仰】')) {
            currentField = 'religion';
            continue;
          } else if (trimmedLine.includes('【语言文字】')) {
            currentField = 'language';
            continue;
          } else if (trimmedLine.includes('【文化互动】')) {
            currentField = 'cultureInteraction';
            continue;
          } else if (trimmedLine.includes('【细节补充】')) {
            currentField = 'details';
            continue;
          }
          
          // 处理各部分内容
          if (inBasicInfo) {
            // 处理基本信息部分
            if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
              details.name = this.extractValue(trimmedLine);
            } else if (trimmedLine.includes('标签')) {
              const tagsStr = this.extractValue(trimmedLine);
              if (tagsStr) {
                // 支持多种分隔符：逗号、顿号、中文顿号
                const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
                // 使用已导入的normalizeTags函数
                details.tags = normalizeTags(extractedTags);
              }
            } else if (trimmedLine.includes('描述')) {
              details.description = this.extractValue(trimmedLine);
            }
          } else if (currentField) {
            // 忽略空行和分隔符
            if (trimmedLine && !trimmedLine.includes('【') && !trimmedLine.startsWith('---')) {
              // 修复：保留完整的行内容，包括子项标题
              if (!details[currentField]) {
                details[currentField] = trimmedLine;
              } else {
                details[currentField] += '\n' + trimmedLine;
              }
            }
          }
        }
        break;
      case 'technology':
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 检查是否进入新的部分
          if (trimmedLine.includes('【基本信息】')) {
            inBasicInfo = true;
            currentField = null;
            continue;
          } else if (trimmedLine.includes('【科技水平】')) {
            inBasicInfo = false;
            currentField = 'level';
            continue;
          } else if (trimmedLine.includes('【应用场景】')) {
            currentField = 'applications';
            continue;
          } else if (trimmedLine.includes('【使用限制】')) {
            currentField = 'limitations';
            continue;
          } else if (trimmedLine.includes('【社会影响】')) {
            currentField = 'impact';
            continue;
          } else if (trimmedLine.includes('【细节补充】')) {
            currentField = 'details';
            continue;
          }
          
          // 处理各部分内容
          if (inBasicInfo) {
            // 处理基本信息部分
            if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
              details.name = this.extractValue(trimmedLine);
            } else if (trimmedLine.includes('标签')) {
              const tagsStr = this.extractValue(trimmedLine);
              if (tagsStr) {
                // 支持多种分隔符：逗号、顿号、中文顿号
                const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
                // 使用已导入的normalizeTags函数
                details.tags = normalizeTags(extractedTags);
              }
            } else if (trimmedLine.includes('描述')) {
              details.description = this.extractValue(trimmedLine);
            }
          } else if (currentField) {
            // 忽略空行和分隔符
            if (trimmedLine && !trimmedLine.includes('【') && !trimmedLine.startsWith('---')) {
              // 修复：保留内容标识，不丢弃冒号前的部分
              if (!details[currentField]) {
                details[currentField] = trimmedLine;
              } else {
                details[currentField] += '\n' + trimmedLine;
              }
            }
          } else {
            // 处理没有明确部分的内容
            if (trimmedLine.includes('标签')) {
              if (!details.tags) {
                details.tags = this.extractValue(trimmedLine);
              } else {
                details.tags += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('科技水平')) {
              if (!details.level) {
                details.level = this.extractValue(trimmedLine);
              } else {
                details.level += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('应用场景')) {
              if (!details.applications) {
                details.applications = this.extractValue(trimmedLine);
              } else {
                details.applications += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('使用限制')) {
              if (!details.limitations) {
                details.limitations = this.extractValue(trimmedLine);
              } else {
                details.limitations += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('社会影响')) {
              if (!details.impact) {
                details.impact = this.extractValue(trimmedLine);
              } else {
                details.impact += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('细节')) {
              if (!details.details) {
                details.details = this.extractValue(trimmedLine);
              } else {
                details.details += '\n' + this.extractValue(trimmedLine);
              }
            }
          }
        }
        break;
      case 'magic':
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 检查是否进入新的部分
          if (trimmedLine.includes('【基本信息】')) {
            inBasicInfo = true;
            currentField = null;
            continue;
          } else if (trimmedLine.includes('【魔法系统】')) {
            inBasicInfo = false;
            currentField = 'system';
            continue;
          } else if (trimmedLine.includes('【能量源泉】')) {
            currentField = 'sources';
            continue;
          } else if (trimmedLine.includes('【施法规则】')) {
            currentField = 'rules';
            continue;
          } else if (trimmedLine.includes('【法术示例】')) {
            currentField = 'spells';
            continue;
          } else if (trimmedLine.includes('【魔法物品】')) {
            currentField = 'artifacts';
            continue;
          } else if (trimmedLine.includes('【世界观关联】')) {
            currentField = 'worldRelation';
            continue;
          } else if (trimmedLine.includes('【细节补充】')) {
            currentField = 'details';
            continue;
          }
          
          // 处理各部分内容
          if (inBasicInfo) {
            // 处理基本信息部分
            if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
              details.name = this.extractValue(trimmedLine);
            } else if (trimmedLine.includes('标签')) {
              const tagsStr = this.extractValue(trimmedLine);
              if (tagsStr) {
                // 支持多种分隔符：逗号、顿号、中文顿号
                const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
                // 使用已导入的normalizeTags函数
                details.tags = normalizeTags(extractedTags);
              }
            } else if (trimmedLine.includes('描述')) {
              details.description = this.extractValue(trimmedLine);
            }
          } else if (currentField) {
            // 忽略空行和分隔符
            if (trimmedLine && !trimmedLine.includes('【') && !trimmedLine.startsWith('---')) {
              // 修复：保留内容标识，不丢弃冒号前的部分
              if (!details[currentField]) {
                details[currentField] = trimmedLine;
              } else {
                details[currentField] += '\n' + trimmedLine;
              }
            }
          } else {
            // 处理没有明确部分的内容
            if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
              if (!details.name) {
                details.name = this.extractValue(trimmedLine);
              } else {
                details.name += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('标签')) {
              if (!details.tags) {
                details.tags = this.extractValue(trimmedLine);
              } else {
                details.tags += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('描述')) {
              if (!details.description) {
                details.description = this.extractValue(trimmedLine);
              } else {
                details.description += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('系统') || trimmedLine.includes('体系')) {
              if (!details.system) {
                details.system = this.extractValue(trimmedLine);
              } else {
                details.system += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('源泉') || trimmedLine.includes('来源')) {
              if (!details.sources) {
                details.sources = this.extractValue(trimmedLine);
              } else {
                details.sources += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('规则') || trimmedLine.includes('条件')) {
              if (!details.rules) {
                details.rules = this.extractValue(trimmedLine);
              } else {
                details.rules += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('法术') || trimmedLine.includes('示例')) {
              if (!details.spells) {
                details.spells = this.extractValue(trimmedLine);
              } else {
                details.spells += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('物品') || trimmedLine.includes('法器')) {
              if (!details.artifacts) {
                details.artifacts = this.extractValue(trimmedLine);
              } else {
                details.artifacts += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('关联') || trimmedLine.includes('关系')) {
              if (!details.worldRelation) {
                details.worldRelation = this.extractValue(trimmedLine);
              } else {
                details.worldRelation += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('细节')) {
              if (!details.details) {
                details.details = this.extractValue(trimmedLine);
              } else {
                details.details += '\n' + this.extractValue(trimmedLine);
              }
            }
          }
        }
        break;
      case 'history':
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // 检查是否进入新的部分
          if (trimmedLine.includes('【基本信息】')) {
            inBasicInfo = true;
            currentField = null;
            continue;
          } else if (trimmedLine.includes('【时间线】')) {
            inBasicInfo = false;
            currentField = 'timeline';
            // 处理同一行的内容，但要排除标记本身
            if (trimmedLine !== '【时间线】') {
              const content = this.extractValue(trimmedLine);
              if (content) {
                details.timeline = content;
              }
            }
            continue;
          } else if (trimmedLine.includes('【重要事件】')) {
            currentField = 'events';
            // 处理同一行的内容，但要排除标记本身
            if (trimmedLine !== '【重要事件】') {
              const content = this.extractValue(trimmedLine);
              if (content) {
                details.events = content;
              }
            }
            continue;
          } else if (trimmedLine.includes('【历史人物】')) {
            currentField = 'figures';
            // 处理同一行的内容，但要排除标记本身
            if (trimmedLine !== '【历史人物】') {
              const content = this.extractValue(trimmedLine);
              if (content) {
                details.figures = content;
              }
            }
            continue;
          } else if (trimmedLine.includes('【历史后果】')) {
            currentField = 'consequences';
            // 处理同一行的内容，但要排除标记本身
            if (trimmedLine !== '【历史后果】') {
              const content = this.extractValue(trimmedLine);
              if (content) {
                details.consequences = content;
              }
            }
            continue;
          } else if (trimmedLine.includes('【细节补充】')) {
            currentField = 'details';
            // 处理同一行的内容，但要排除标记本身
            if (trimmedLine !== '【细节补充】') {
              const content = this.extractValue(trimmedLine);
              if (content) {
                details.details = content;
              }
            }
            continue;
          }
          
          // 处理各部分内容
          if (inBasicInfo) {
            // 处理基本信息部分
            if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
              details.name = this.extractValue(trimmedLine);
            } else if (trimmedLine.includes('标签')) {
              const tagsStr = this.extractValue(trimmedLine);
              if (tagsStr) {
                // 支持多种分隔符：逗号、顿号、中文顿号
                const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
                // 使用已导入的normalizeTags函数
                details.tags = normalizeTags(extractedTags);
              }
            } else if (trimmedLine.includes('描述')) {
              details.description = this.extractValue(trimmedLine);
            }
          } else if (currentField) {
            // 忽略空行和分隔符
            if (trimmedLine && !trimmedLine.includes('【') && !trimmedLine.startsWith('---')) {
              // 处理基本信息字段
              if (currentField === 'basicInfo') {
                if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
                  details.name = this.extractValue(trimmedLine);
                } else if (trimmedLine.includes('标签')) {
                  details.tags = this.extractValue(trimmedLine);
                } else if (trimmedLine.includes('描述')) {
                  details.description = this.extractValue(trimmedLine);
                }
              } 
              // 处理列表项（以-开头的行）
              else if (trimmedLine.startsWith('-')) {
                if (!details[currentField]) {
                  details[currentField] = this.extractValue(trimmedLine);
                } else {
                  details[currentField] += '\n' + this.extractValue(trimmedLine);
                }
              } else {
                // 处理普通文本行，对于历史设定类型，需要保留具体的字段标签
                if (type === 'history') {
                  // 对于历史设定，在各个字段内部也需要保留具体的字段标签
                  if (currentField === 'timeline' && (trimmedLine.includes('重要时期：') || trimmedLine.includes('时间节点：') || trimmedLine.includes('年代跨度：'))) {
                    const valueToUse = this.extractValue(trimmedLine);
                    const labeledValue = trimmedLine.includes('重要时期：') ? '重要时期：' + valueToUse : 
                                       trimmedLine.includes('时间节点：') ? '时间节点：' + valueToUse : 
                                       '年代跨度：' + valueToUse;
                    if (!details[currentField]) {
                      details[currentField] = labeledValue;
                    } else {
                      details[currentField] += '\n' + labeledValue;
                    }
                  } else if (currentField === 'events' && (trimmedLine.includes('重大事件：') || trimmedLine.includes('影响：') || trimmedLine.includes('战争冲突：') || trimmedLine.includes('政治变迁：') || trimmedLine.includes('文化交融：'))) {
                    const valueToUse = this.extractValue(trimmedLine);
                    const labeledValue = trimmedLine.includes('重大事件：') ? '重大事件：' + valueToUse : 
                                       trimmedLine.includes('影响：') ? '影响：' + valueToUse : 
                                       trimmedLine.includes('战争冲突：') ? '战争冲突：' + valueToUse : 
                                       trimmedLine.includes('政治变迁：') ? '政治变迁：' + valueToUse : 
                                       '文化交融：' + valueToUse;
                    if (!details[currentField]) {
                      details[currentField] = labeledValue;
                    } else {
                      details[currentField] += '\n' + labeledValue;
                    }
                  } else if (currentField === 'figures' && (trimmedLine.includes('关键人物：') || trimmedLine.includes('贡献：') || trimmedLine.includes('英雄豪杰：') || trimmedLine.includes('奸臣恶徒：') || trimmedLine.includes('普通民众：'))) {
                    const valueToUse = this.extractValue(trimmedLine);
                    const labeledValue = trimmedLine.includes('关键人物：') ? '关键人物：' + valueToUse : 
                                       trimmedLine.includes('贡献：') ? '贡献：' + valueToUse : 
                                       trimmedLine.includes('英雄豪杰：') ? '英雄豪杰：' + valueToUse : 
                                       trimmedLine.includes('奸臣恶徒：') ? '奸臣恶徒：' + valueToUse : 
                                       '普通民众：' + valueToUse;
                    if (!details[currentField]) {
                      details[currentField] = labeledValue;
                    } else {
                      details[currentField] += '\n' + labeledValue;
                    }
                  } else if (currentField === 'consequences' && (trimmedLine.includes('对后世的影响：') || trimmedLine.includes('遗产传承：') || trimmedLine.includes('未解之谜：'))) {
                    const valueToUse = this.extractValue(trimmedLine);
                    const labeledValue = trimmedLine.includes('对后世的影响：') ? '对后世的影响：' + valueToUse : 
                                       trimmedLine.includes('遗产传承：') ? '遗产传承：' + valueToUse : 
                                       '未解之谜：' + valueToUse;
                    if (!details[currentField]) {
                      details[currentField] = labeledValue;
                    } else {
                      details[currentField] += '\n' + labeledValue;
                    }
                  } else if (currentField === 'details' && (trimmedLine.includes('社会状况：') || trimmedLine.includes('经济发展：') || trimmedLine.includes('科技水平：') || trimmedLine.includes('其他相关信息：'))) {
                    const valueToUse = this.extractValue(trimmedLine);
                    const labeledValue = trimmedLine.includes('社会状况：') ? '社会状况：' + valueToUse : 
                                       trimmedLine.includes('经济发展：') ? '经济发展：' + valueToUse : 
                                       trimmedLine.includes('科技水平：') ? '科技水平：' + valueToUse : 
                                       '其他相关信息：' + valueToUse;
                    if (!details[currentField]) {
                      details[currentField] = labeledValue;
                    } else {
                      details[currentField] += '\n' + labeledValue;
                    }
                  } else {
                    // 对于不匹配特定标签的普通文本行，直接使用extractValue方法提取内容
                    const valueToUse = this.extractValue(trimmedLine);
                    if (!details[currentField]) {
                      details[currentField] = valueToUse;
                    } else {
                      details[currentField] += '\n' + valueToUse;
                    }
                  }
                } else {
                  // 对于非历史设定类型，直接使用extractValue方法提取内容
                  const valueToUse = this.extractValue(trimmedLine);
                  if (!details[currentField]) {
                    details[currentField] = valueToUse;
                  } else {
                    details[currentField] += '\n' + valueToUse;
                  }
                }
              }
            }
          } else {
            // 处理没有明确部分的内容
            if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
              if (!details.name) {
                details.name = this.extractValue(trimmedLine);
              } else {
                details.name += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('标签')) {
              if (!details.tags) {
                details.tags = this.extractValue(trimmedLine);
              } else {
                details.tags += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('描述')) {
              if (!details.description) {
                details.description = this.extractValue(trimmedLine);
              } else {
                details.description += '\n' + this.extractValue(trimmedLine);
              }
            } else if (trimmedLine.includes('重要时期：') || trimmedLine.includes('时间节点：') || trimmedLine.includes('年代跨度：')) {
              // 更精确地匹配时间线相关的具体内容字段，使用extractValue提取冒号后的内容
              const valueToUse = this.extractValue(trimmedLine);
              if (!details.timeline) {
                details.timeline = trimmedLine.includes('重要时期：') ? '重要时期：' + valueToUse : 
                                 trimmedLine.includes('时间节点：') ? '时间节点：' + valueToUse : 
                                 '年代跨度：' + valueToUse;
              } else {
                details.timeline += '\n' + (trimmedLine.includes('重要时期：') ? '重要时期：' + valueToUse : 
                                           trimmedLine.includes('时间节点：') ? '时间节点：' + valueToUse : 
                                           '年代跨度：' + valueToUse);
              }
            } else if (trimmedLine.includes('重大事件：') || trimmedLine.includes('影响：') || trimmedLine.includes('战争冲突：') || trimmedLine.includes('政治变迁：') || trimmedLine.includes('文化交融：')) {
              // 更精确地匹配重要事件相关的具体内容字段，使用extractValue提取冒号后的内容
              const valueToUse = this.extractValue(trimmedLine);
              if (!details.events) {
                details.events = trimmedLine.includes('重大事件：') ? '重大事件：' + valueToUse : 
                               trimmedLine.includes('影响：') ? '影响：' + valueToUse : 
                               trimmedLine.includes('战争冲突：') ? '战争冲突：' + valueToUse : 
                               trimmedLine.includes('政治变迁：') ? '政治变迁：' + valueToUse : 
                               '文化交融：' + valueToUse;
              } else {
                details.events += '\n' + (trimmedLine.includes('重大事件：') ? '重大事件：' + valueToUse : 
                                         trimmedLine.includes('影响：') ? '影响：' + valueToUse : 
                                         trimmedLine.includes('战争冲突：') ? '战争冲突：' + valueToUse : 
                                         trimmedLine.includes('政治变迁：') ? '政治变迁：' + valueToUse : 
                                         '文化交融：' + valueToUse);
              }
            } else if (trimmedLine.includes('关键人物：') || trimmedLine.includes('贡献：') || trimmedLine.includes('英雄豪杰：') || trimmedLine.includes('奸臣恶徒：') || trimmedLine.includes('普通民众：')) {
              // 更精确地匹配历史人物相关的具体内容字段，使用extractValue提取冒号后的内容
              const valueToUse = this.extractValue(trimmedLine);
              if (!details.figures) {
                details.figures = trimmedLine.includes('关键人物：') ? '关键人物：' + valueToUse : 
                                 trimmedLine.includes('贡献：') ? '贡献：' + valueToUse : 
                                 trimmedLine.includes('英雄豪杰：') ? '英雄豪杰：' + valueToUse : 
                                 trimmedLine.includes('奸臣恶徒：') ? '奸臣恶徒：' + valueToUse : 
                                 '普通民众：' + valueToUse;
              } else {
                details.figures += '\n' + (trimmedLine.includes('关键人物：') ? '关键人物：' + valueToUse : 
                                          trimmedLine.includes('贡献：') ? '贡献：' + valueToUse : 
                                          trimmedLine.includes('英雄豪杰：') ? '英雄豪杰：' + valueToUse : 
                                          trimmedLine.includes('奸臣恶徒：') ? '奸臣恶徒：' + valueToUse : 
                                          '普通民众：' + valueToUse);
              }
            } else if (trimmedLine.includes('对后世的影响：') || trimmedLine.includes('遗产传承：') || trimmedLine.includes('未解之谜：')) {
              // 更精确地匹配历史后果相关的具体内容字段，使用extractValue提取冒号后的内容
              const valueToUse = this.extractValue(trimmedLine);
              if (!details.consequences) {
                details.consequences = trimmedLine.includes('对后世的影响：') ? '对后世的影响：' + valueToUse : 
                                     trimmedLine.includes('遗产传承：') ? '遗产传承：' + valueToUse : 
                                     '未解之谜：' + valueToUse;
              } else {
                details.consequences += '\n' + (trimmedLine.includes('对后世的影响：') ? '对后世的影响：' + valueToUse : 
                                               trimmedLine.includes('遗产传承：') ? '遗产传承：' + valueToUse : 
                                               '未解之谜：' + valueToUse);
              }
            } else if (trimmedLine.includes('社会状况：') || trimmedLine.includes('经济发展：') || trimmedLine.includes('科技水平：') || trimmedLine.includes('其他相关信息：')) {
              // 更精确地匹配细节补充相关的具体内容字段，使用extractValue提取冒号后的内容
              const valueToUse = this.extractValue(trimmedLine);
              if (!details.details) {
                details.details = trimmedLine.includes('社会状况：') ? '社会状况：' + valueToUse : 
                                 trimmedLine.includes('经济发展：') ? '经济发展：' + valueToUse : 
                                 trimmedLine.includes('科技水平：') ? '科技水平：' + valueToUse : 
                                 '其他相关信息：' + valueToUse;
              } else {
                details.details += '\n' + (trimmedLine.includes('社会状况：') ? '社会状况：' + valueToUse : 
                                          trimmedLine.includes('经济发展：') ? '经济发展：' + valueToUse : 
                                          trimmedLine.includes('科技水平：') ? '科技水平：' + valueToUse : 
                                          '其他相关信息：' + valueToUse);
              }
            }
          }
        }
        break;
    }

    return details;
  }

  /**
   * 解析多个世界观设定内容
   */
  async parseMultipleWorldSettings(content: string, type: WorldSettingType): Promise<any[]> {
    const settings: any[] = [];
    const lines = content.split('\n');
    
    // 对于角色类型，我们需要特殊处理，因为AI生成的角色内容格式是固定的
    if (type === 'character') {
      // 按照分隔符分割内容，获取每个角色的独立内容块
      const characterBlocks = content.split('---').filter(block => block.trim());
      
      // 处理每个角色块
      for (let i = 0; i < characterBlocks.length; i++) {
        const block = characterBlocks[i].trim();
        if (!block) continue;
        
        // 解析单个角色内容
        const characterData = await this.parseCharacterContent(block);
        
        // 创建角色设定项
        const characterSetting = {
          name: characterData.name || `角色设定${i + 1}`,
          description: characterData.description || block,
          type: type,
          tags: characterData.tags || [],
          role: characterData.role || 'supporting',
          // 添加详细字段
          appearance: characterData.appearance,
          personality: characterData.personality,
          background: characterData.background,
          abilities: characterData.abilities,
          relationships: characterData.relationships,
          characterArc: characterData.characterArc,
          details: characterData.details,
          professionTags: characterData.professionTags,
          personalityTags: characterData.personalityTags,
          functionTags: characterData.functionTags
        };
        
        settings.push(characterSetting);
      }
      
      return settings;
    }
    
    // 对于地点类型，使用专门的解析方法
    if (type === 'location') {
      // 按照分隔符分割内容，获取每个地点的独立内容块
      const locationBlocks = content.split('---').filter(block => block.trim());
      
      // 处理每个地点块
      for (let i = 0; i < locationBlocks.length; i++) {
        const block = locationBlocks[i].trim();
        if (!block) continue;
        
        // 解析单个地点内容
        const locationData = await this.parseLocationContent(block);
        
        // 创建地点设定项
        const locationSetting = {
          name: locationData.name || `地点设定${i + 1}`,
          description: locationData.description || block,
          type: type,
          tags: locationData.tags || [],
          // 添加详细字段
          locationType: locationData.locationType,
          importance: locationData.importance,
          geography: locationData.geography,
          climate: locationData.climate,
          terrain: locationData.terrain,
          naturalResources: locationData.naturalResources,
          ecosystem: locationData.ecosystem,
          architecture: locationData.architecture,
          socialStructure: locationData.socialStructure,
          culture: locationData.culture,
          historyBackground: locationData.historyBackground,
          politics: locationData.politics,
          governance: locationData.governance,
          laws: locationData.laws,
          economy: locationData.economy,
          mainIndustries: locationData.mainIndustries,
          trade: locationData.trade,
          wealth: locationData.wealth,
          details: locationData.details
        };
        
        settings.push(locationSetting);
      }
      
      return settings;
    }
    
    // 对于历史类型，使用专门的解析方法
    if (type === 'history') {
      // 按照分隔符分割内容，获取每个历史的独立内容块
      const historyBlocks = content.split('---').filter(block => block.trim());
      
      // 处理每个历史块
      for (let i = 0; i < historyBlocks.length; i++) {
        const block = historyBlocks[i].trim();
        if (!block) continue;
        
        // 解析单个历史内容
        const historyData = this.parseSettingDetails(block, type);
        
        // 创建历史设定项
        const historySetting = {
          name: historyData.name || `历史设定${i + 1}`,
          description: historyData.description || block,
          type: type,
          tags: historyData.tags || [],
          // 添加详细字段
          timeline: historyData.timeline,
          events: historyData.events,
          figures: historyData.figures,
          consequences: historyData.consequences,
          details: historyData.details
        };
        
        settings.push(historySetting);
      }
      
      return settings;
    }
    
    // 对于其他类型，检查是否包含多个设定项
    const typePattern = new RegExp(`【${this.getSettingTypeName(type)}设定\\d*[.、:：]?\\s*([^】]+)】`, 'g');
    const typeMatches = content.match(typePattern);
    
    if (typeMatches && typeMatches.length > 1) {
      // 有多个设定项
      const sections = content.split(typePattern);
      // 移除第一个空元素
      sections.shift();
      
      for (let i = 0; i < typeMatches.length; i++) {
        const match = typeMatches[i].match(new RegExp(`【${this.getSettingTypeName(type)}设定\\d*[.、:：]?\\s*([^】]+)】`));
        const title = match ? match[1] : `${this.getSettingTypeName(type)}设定${i + 1}`;
        
        // 提取设定内容
        const sectionContent = i * 2 + 1 < sections.length ? sections[i * 2 + 1] : '';
        const fullContent = `${typeMatches[i]}\n${sectionContent}`;
        
        // 解析详细信息
        const details = this.parseSettingDetails(fullContent, type);
        
        // 解析标签（在基本信息部分）
        let tags: string[] = [];
        let inBasicInfo = false;
        const sectionLines = fullContent.split('\n');
        
        for (const line of sectionLines) {
          const trimmedLine = line.trim();
          if (trimmedLine.includes('【基本信息】')) {
            inBasicInfo = true;
            continue;
          } else if (trimmedLine.includes('【') && trimmedLine.includes('】') && !trimmedLine.includes(`${this.getSettingTypeName(type)}设定`)) {
            inBasicInfo = false;
          }
          
          if (inBasicInfo && trimmedLine.includes('标签')) {
            // 使用标签同步工具解析标签
            const tagsStr = this.extractValue(trimmedLine);
            if (tagsStr) {
              // 支持多种分隔符：逗号、顿号、中文顿号
              const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
              // 使用已导入的normalizeTags函数
              const normalizedTags = normalizeTags(extractedTags);
              tags = normalizedTags;
            }
          }
        }
        
        // 创建设定项
        const setting = {
          name: title.trim(),
          description: fullContent,
          type: type,
          tags: tags,
          ...details
        };
        
        settings.push(setting);
      }
      return settings;
    } else if (typeMatches && typeMatches.length === 1) {
      // 单个设定项
      const match = typeMatches[0].match(new RegExp(`【${this.getSettingTypeName(type)}设定\\d*[.、:：]?\\s*([^】]+)】`));
      const title = match ? match[1] : `${this.getSettingTypeName(type)}设定`;
      
      // 解析详细信息
      const details = this.parseSettingDetails(content, type);
      
      // 解析标签（在基本信息部分）
      let tags: string[] = [];
      let inBasicInfo = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('【基本信息】')) {
          inBasicInfo = true;
          continue;
        } else if (trimmedLine.includes('【') && trimmedLine.includes('】') && trimmedLine !== typeMatches[0]) {
          inBasicInfo = false;
        }
        
        if (inBasicInfo && trimmedLine.includes('标签')) {
          const tagsStr = this.extractValue(trimmedLine);
          if (tagsStr) {
            const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
            // 使用已导入的normalizeTags函数
            tags = normalizeTags(extractedTags);
          }
          break;
        }
      }
      
      // 创建设定项
      const setting = {
        name: title.trim(),
        description: content,
        type: type,
        tags: tags,
        ...details
      };
      
      settings.push(setting);
      console.log(`解析完成，共${settings.length}个${this.getSettingTypeName(type)}设定:`, settings.map(s => s.name));
      return settings;
    }
    
    // 如果没有匹配到标准格式，使用原有逻辑
    let currentSetting: any = null;
    let inSettingBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // 跳过空行
      if (!trimmedLine) continue;
      
      // 检查是否是新的设定项开始（以【】标记）
      if (trimmedLine.includes('【') && trimmedLine.includes('】')) {
        // 检查是否是新的设定项开始（包含类型关键词或序号）
        const sectionTitle = trimmedLine.replace(/【|】/g, '').trim();
        const isSettingStart = 
          ((type as string) === 'location' && (sectionTitle.includes('地点') || /^\d+[.、:：]?\s*地点/.test(sectionTitle))) ||
          ((type as string) === 'culture' && (sectionTitle.includes('文化') || /^\d+[.、:：]?\s*文化/.test(sectionTitle))) ||
          ((type as string) === 'technology' && (sectionTitle.includes('科技') || /^\d+[.、:：]?\s*科技/.test(sectionTitle))) ||
          ((type as string) === 'magic' && (sectionTitle.includes('魔法') || /^\d+[.、:：]?\s*魔法/.test(sectionTitle))) ||
          ((type as string) === 'history' && (sectionTitle.includes('历史') || /^\d+[.、:：]?\s*历史/.test(sectionTitle)));
        
        if (isSettingStart) {
          // 如果已经有当前设定项，保存它
          if (currentSetting) {
            // 确保所有必需字段都存在
            if (!currentSetting.tags) {
              currentSetting.tags = [];
            }
            settings.push(currentSetting);
          }
          
          // 提取设定项名称（从【】标记中）
          let settingName = `${this.getSettingTypeName(type)}设定`;
          // 如果名称中包含冒号，提取冒号后的内容作为名称
          const colonIndex = sectionTitle.indexOf('：');
          if (colonIndex > -1) {
            settingName = sectionTitle.substring(colonIndex + 1).trim();
          } else {
            // 否则使用整个内容作为名称，但去掉数字前缀
            const nameWithoutPrefix = sectionTitle.replace(/^\d+[.、:：]?\s*/, '');
            if (nameWithoutPrefix && !nameWithoutPrefix.includes(this.getSettingTypeName(type))) {
              settingName = nameWithoutPrefix;
            }
          }
          
          // 开始新的设定项
          currentSetting = {
            name: settingName,
            description: '',
            type: type,
            tags: [] // 添加标签字段
          };
          
          inSettingBlock = true;
          continue;
        }
      }
      
      // 如果在设定项中，解析内容
      if (inSettingBlock && currentSetting) {
        if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
          currentSetting.name = this.extractValue(trimmedLine);
        } else if (trimmedLine.includes('标签')) {
          // 使用标签同步工具解析标签
          const tagsStr = this.extractValue(trimmedLine);
          if (tagsStr) {
            const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
            // 使用已导入的normalizeTags函数
            currentSetting.tags = normalizeTags(extractedTags);
          }
        } else if (trimmedLine.includes('描述') || trimmedLine.includes('简介')) {
          currentSetting.description = this.extractValue(trimmedLine);
        } else if (trimmedLine && !trimmedLine.startsWith('#')) {
          // 将其他内容添加到描述中
          if (currentSetting.description) {
            currentSetting.description += '\n' + trimmedLine;
          } else {
            currentSetting.description = trimmedLine;
          }
        }
      }
    }
    
    // 保存最后一个设定项
    if (currentSetting) {
      // 确保所有必需字段都存在
      if (!currentSetting.tags) {
        currentSetting.tags = [];
      }
      settings.push(currentSetting);
    }
    
    // 如果没有解析出任何设定项，创建一个默认的
    if (settings.length === 0) {
      // 解析详细信息
      const details = this.parseSettingDetails(content, type);
      
      settings.push({
        name: `${this.getSettingTypeName(type)}设定`,
        description: content,
        type: type,
        tags: [], // 添加标签字段
        ...details
      });
    } else if ((type as string) === 'location' && settings.length === 1) {
      // 对于地点类型，如果只解析出一个设定项，还需要解析详细信息
      const details = this.parseSettingDetails(content, type);
      settings[0] = {
        ...settings[0],
        ...details
      };
    } else if ((type as string) === 'culture' && settings.length === 1) {
      // 对于文化类型，如果只解析出一个设定项，还需要解析详细信息
      const details = this.parseSettingDetails(content, type);
      settings[0] = {
        ...settings[0],
        ...details
      };
    } else if ((type as string) === 'technology' && settings.length === 1) {
      // 对于科技类型，如果只解析出一个设定项，还需要解析详细信息
      const details = this.parseSettingDetails(content, type);
      settings[0] = {
        ...settings[0],
        ...details
      };
    } else if ((type as string) === 'magic' && settings.length === 1) {
      // 对于魔法类型，如果只解析出一个设定项，还需要解析详细信息
      const details = this.parseSettingDetails(content, type);
      settings[0] = {
        ...settings[0],
        ...details
      };
    } else if ((type as string) === 'history' && settings.length === 1) {
      // 对于历史类型，如果只解析出一个设定项，还需要解析详细信息
      const details = this.parseSettingDetails(content, type);
      settings[0] = {
        ...settings[0],
        ...details
      };
    }
    
    return settings;
  }

  /**
   * 解析角色内容
   */
  async parseCharacterContent(content: string): Promise<any> {
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
        continue;
      } else if (trimmedLine.includes('【性格特质】')) {
        currentSection = 'personality';
        currentField = 'personality';
        continue;
      } else if (trimmedLine.includes('【背景故事】')) {
        currentSection = 'background';
        currentField = 'background';
        continue;
      } else if (trimmedLine.includes('【能力设定】')) {
        currentSection = 'abilities';
        currentField = 'abilities';
        continue;
      } else if (trimmedLine.includes('【人际关系】')) {
        currentSection = 'relationships';
        currentField = 'relationships';
        continue;
      } else if (trimmedLine.includes('【角色发展弧光】')) {
        currentSection = 'characterArc';
        currentField = 'characterArc';
        continue;
      } else if (trimmedLine.includes('【细节补充】')) {
        currentSection = 'details';
        currentField = 'details';
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
              // 映射角色类型，增加更多匹配规则
              const roleMap: Record<string, any> = {
                '主角': 'protagonist',
                '主人公': 'protagonist',
                '主要角色': 'protagonist',
                'protagonist': 'protagonist',
                'main character': 'protagonist',
                '反派': 'antagonist',
                '反角': 'antagonist',
                '敌对角色': 'antagonist',
                'antagonist': 'antagonist',
                'villain': 'antagonist',
                '配角': 'supporting',
                '重要配角': 'supporting',
                'supporting': 'supporting',
                'supporting character': 'supporting',
                '次要角色': 'minor',
                'minor': 'minor',
                'minor character': 'minor',
                '次要': 'minor',
                '侧面角色': 'side',
                'side': 'side',
                'side character': 'side',
                '对照角色': 'foil',
                'foil': 'foil',
                'foil character': 'foil',
                '导师角色': 'mentor',
                '老师': 'mentor',
                'mentor': 'mentor',
                'teacher': 'mentor',
                '导师': 'mentor',
                '恋爱对象': 'loveInterest',
                '恋人': 'loveInterest',
                'loveinterest': 'loveInterest',
                'love interest': 'loveInterest',
                '竞争对手': 'rival',
                '对手': 'rival',
                'rival': 'rival',
                'competitor': 'rival',
                '中立角色': 'neutral',
                '中立': 'neutral',
                'neutral': 'neutral',
                'neutral character': 'neutral',
                'keysupporting': 'keySupporting',
                'key supporting': 'keySupporting',
                'minorsupporting': 'minorSupporting',
                'minor supporting': 'minorSupporting',
                '复杂配角': 'complexSupporting',
                'complexsupporting': 'complexSupporting',
                'complex supporting': 'complexSupporting'
              };
              character.role = roleMap[roleValue] || 'supporting';
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
          character.description = content;
        }
      }
    }

    // 确保tags字段存在
    if (!character.tags) {
      character.tags = [];
    }

    return character;
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

  /**
   * 获取设定类型中文名称
   */
  private getSettingTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      character: '角色',
      location: '地点',
      culture: '文化',
      technology: '科技',
      magic: '魔法',
      history: '历史',
    };
    return typeNames[type] || type;
  }

  /**
   * 映射地点类型
   */
  private mapLocationType(type: string): string {
    // 这里可以添加地点类型的映射逻辑
    return type;
  }

  /**
   * 映射地点重要性
   */
  private mapLocationImportance(importance: string): string {
    // 这里可以添加地点重要性的映射逻辑
    return importance;
  }

  /**
   * 解析地点内容
   */
  async parseLocationContent(content: string): Promise<any> {
    const lines = content.split('\n');
    const location: any = {};

    // 定义各部分的标识
    let inBasicInfo = false;
    let currentField: string | null = null;
    let descriptionContent: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检查是否进入新的部分
      if (trimmedLine.includes('【基本信息】')) {
        inBasicInfo = true;
        currentField = null;
        continue;
      } else if (trimmedLine.includes('【类型】') && !trimmedLine.includes('【描述】')) {
        inBasicInfo = false;
        currentField = 'locationType';
        // 处理同一行的内容
        if (trimmedLine.includes('：')) {
          const rawType = this.extractValue(trimmedLine);
          location.locationType = rawType;
        }
        continue;
      } else if (trimmedLine.includes('【重要性】')) {
        currentField = 'importance';
        // 处理同一行的内容
        if (trimmedLine.includes('：')) {
          const rawImportance = this.extractValue(trimmedLine);
          location.importance = rawImportance;
        }
        continue;
      } else if (trimmedLine.includes('【地理环境】')) {
        currentField = 'geography';
        continue;
      } else if (trimmedLine.includes('【文化背景】')) {
        currentField = 'culture';
        continue;
      } else if (trimmedLine.includes('【政治环境】')) {
        currentField = 'politics';
        continue;
      } else if (trimmedLine.includes('【经济状况】')) {
        currentField = 'economy';
        continue;
      } else if (trimmedLine.includes('【细节补充】')) {
        currentField = 'details';
        continue;
      } else if (trimmedLine.includes('【') && trimmedLine.includes('】') && 
                 !trimmedLine.includes('【名称】') && 
                 !trimmedLine.includes('【标签】') && 
                 !trimmedLine.includes('【描述】') && 
                 !trimmedLine.includes('【类型】') && 
                 !trimmedLine.includes('【重要性】') &&
                 !trimmedLine.includes('【基本信息】')) {
        // 遇到其他标题，重置当前字段，但不在基本信息部分内
        if (!inBasicInfo) {
          currentField = null;
        }
        continue;
      }
      
      // 处理各部分内容
      if (inBasicInfo) {
        // 处理基本信息部分
        if ((trimmedLine.includes('【名称】') || trimmedLine.includes('名称') || trimmedLine.includes('名字')) && trimmedLine.includes('：')) {
          const nameValue = this.extractValue(trimmedLine);
          location.name = nameValue;
        } else if (trimmedLine.includes('【标签】') && trimmedLine.includes('：')) {
          const tagsStr = this.extractValue(trimmedLine);
          if (tagsStr) {
            const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
            location.tags = extractedTags;
          }
        } else if ((trimmedLine.includes('【描述】') || trimmedLine.includes('【简介】')) && trimmedLine.includes('：')) {
          const descMatch = trimmedLine.match(/【描述】[:：]\s*(.*)/) || trimmedLine.match(/【简介】[:：]\s*(.*)/);
          if (descMatch && descMatch[1]) {
            const descValue = descMatch[1].trim();
            location.description = this.normalizeLineBreaks(descValue);
          }
        } else if (trimmedLine.includes('描述') || trimmedLine.includes('简介')) {
          const descValue = this.extractValue(trimmedLine);
          if (descValue && !location.description) {
            location.description = this.normalizeLineBreaks(descValue);
          }
        } else if (trimmedLine.includes('【类型】') && trimmedLine.includes('：')) {
          const rawType = this.extractValue(trimmedLine);
          location.locationType = rawType;
        } else if (trimmedLine.includes('【重要性】') && trimmedLine.includes('：')) {
          const rawImportance = this.extractValue(trimmedLine);
          location.importance = rawImportance;
        } else if (trimmedLine.includes('类型') && trimmedLine.includes('：') && !trimmedLine.includes('【类型】')) {
          const rawType = this.extractValue(trimmedLine);
          location.locationType = rawType;
        } else if (trimmedLine.includes('重要性') && trimmedLine.includes('：') && !trimmedLine.includes('【重要性】')) {
          const rawImportance = this.extractValue(trimmedLine);
          location.importance = rawImportance;
        }
      } else if (currentField) {
        // 处理各部分内容字段
        if (trimmedLine && !trimmedLine.includes('【') && !trimmedLine.startsWith('---')) {
          // 处理列表项（以-或数字开头的行）
          if (trimmedLine.startsWith('-') || /^\d+\./.test(trimmedLine)) {
            if (!location[currentField]) {
              location[currentField] = this.normalizeLineBreaks(trimmedLine);
            } else {
              location[currentField] += '\n' + this.normalizeLineBreaks(trimmedLine);
            }
          } else if (!trimmedLine.startsWith('---')) {
            // 处理普通文本行，但排除分隔符
            // 特别处理字段值，如果行包含冒号，则提取冒号后的内容
            let valueToUse = trimmedLine;
            // 修复：累积所有内容到当前字段，保持完整信息和字段标识
            // 不再使用extractValue方法，而是保留整行内容以保持字段标识
            if (!location[currentField]) {
              location[currentField] = this.normalizeLineBreaks(trimmedLine);  // 保留完整行
            } else {
              location[currentField] += '\n' + this.normalizeLineBreaks(trimmedLine);  // 累积完整行
            }
          }
        }
      } else {
        // 处理没有明确部分的内容，作为描述
        if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
          if (!location.name) {
            location.name = this.extractValue(trimmedLine);
          }
        } else if (trimmedLine.includes('【描述】') || trimmedLine.includes('【简介】')) {
          if (!location.description) {
            const descMatch = trimmedLine.match(/【描述】[:：]\s*(.*)/) || trimmedLine.match(/【简介】[:：]\s*(.*)/);
            if (descMatch && descMatch[1]) {
              const descValue = descMatch[1].trim();
              location.description = this.normalizeLineBreaks(descValue);
            }
          }
        } else if (trimmedLine.includes('描述') || trimmedLine.includes('简介')) {
          if (!location.description) {
            location.description = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('类型')) {
          if (!location.locationType) {
            const rawType = this.extractValue(trimmedLine);
            location.locationType = rawType;
          }
        } else if (trimmedLine.includes('重要性')) {
          if (!location.importance) {
            const rawImportance = this.extractValue(trimmedLine);
            location.importance = rawImportance;
          }
        } else if (trimmedLine.includes('位置') || trimmedLine.includes('地理')) {
          if (!location.geography) {
            location.geography = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            location.geography += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('文化') && !trimmedLine.includes('标签')) {
          // 只有在不是标签行的情况下才处理文化背景
          if (!location.culture) {
            location.culture = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            location.culture += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('政治') && !trimmedLine.includes('标签')) {
          // 只有在不是标签行的情况下才处理政治环境
          if (!location.politics) {
            location.politics = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            location.politics += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('经济') && !trimmedLine.includes('标签')) {
          // 只有在不是标签行的情况下才处理经济状况
          if (!location.economy) {
            location.economy = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            location.economy += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('标签')) {
          const tagsStr = this.extractValue(trimmedLine);
          if (tagsStr) {
            const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
            if (!location.tags) {
              location.tags = extractedTags;
            } else {
              location.tags = [...new Set([...location.tags, ...extractedTags])];
            }
          }
        } else if (trimmedLine && !trimmedLine.includes('【地点设定')) {
          descriptionContent.push(trimmedLine);
        }
      }
    }

    // 如果没有解析出名字，使用默认值
    if (!location.name) {
      const nameMatch = content.match(/【地点设定\d*[:：]\s*([^】]+)】/);
      if (nameMatch && nameMatch[1]) {
        location.name = nameMatch[1].trim();
      } else {
        const titleMatch = content.match(/【名称】[:：]\s*([^\n]+)/);
        if (titleMatch && titleMatch[1]) {
          location.name = titleMatch[1].trim();
        } else {
          location.name = 'AI生成地点';
        }
      }
    }

    // 如果没有描述，从累积的内容中提取或使用完整内容
    if (!location.description) {
      const filteredContent = descriptionContent.filter(line => 
        line.trim() && 
        !line.includes('【') && 
        !line.startsWith('---') &&
        !line.includes('地点设定') &&
        !line.includes('基本信息') &&
        line.trim() !== '```'
      );
      
      if (filteredContent.length > 0) {
        let descStartIndex = -1;
        for (let i = 0; i < filteredContent.length; i++) {
          if (filteredContent[i].includes('描述') || filteredContent[i].includes('简介')) {
            descStartIndex = i;
            break;
          }
        }
        
        if (descStartIndex !== -1) {
          const descLines = filteredContent.slice(descStartIndex + 1);
          const cleanDescLines = descLines.filter(line => 
            !line.includes('类型') && 
            !line.includes('重要性') && 
            !line.includes('标签') && 
            !line.includes('位置') && 
            !line.includes('地理') && 
            !line.includes('文化') && 
            !line.includes('政治') && 
            !line.includes('经济') && 
            !line.includes('：') && 
            line.trim() !== '' && 
            line.trim() !== '```'
          );
          
          if (cleanDescLines.length > 0) {
            location.description = this.normalizeLineBreaks(cleanDescLines.join('\n'));
          }
        } else {
          let startIndex = -1;
          let endIndex = -1;
          
          for (let i = 0; i < filteredContent.length; i++) {
            const line = filteredContent[i];
            if (!line.includes('类型') && 
                !line.includes('重要性') && 
                !line.includes('标签') && 
                !line.includes('位置') && 
                !line.includes('地理') && 
                !line.includes('文化') && 
                !line.includes('政治') && 
                !line.includes('经济') && 
                !line.includes('：')) {
              startIndex = i;
              break;
            }
          }
          
          if (startIndex !== -1) {
            for (let i = startIndex; i < filteredContent.length; i++) {
              const line = filteredContent[i];
              if (line.includes('类型') || 
                  line.includes('重要性') || 
                  line.includes('标签') || 
                  line.includes('位置') || 
                  line.includes('地理') || 
                  line.includes('文化') || 
                  line.includes('政治') || 
                  line.includes('经济') || 
                  line.includes('：')) {
                endIndex = i;
                break;
              }
            }
            
            if (endIndex === -1) {
              endIndex = filteredContent.length;
            }
            
            const textBlock = filteredContent.slice(startIndex, endIndex);
            const cleanTextBlock = textBlock.filter(line => 
              line.trim() !== '' && 
              line.trim() !== '```'
            );
            
            if (cleanTextBlock.length > 0) {
              location.description = this.normalizeLineBreaks(cleanTextBlock.join('\n'));
            }
          }
        }
      }
      
      if (!location.description) {
        const descMatch = content.match(/【描述】[:：]\s*([^\n]+)/) || content.match(/【简介】[:：]\s*([^\n]+)/);
        if (descMatch && descMatch[1]) {
          location.description = this.normalizeLineBreaks(descMatch[1].trim());
        } else {
          location.description = '';
        }
      }
    }

    // 确保tags字段存在
    if (!location.tags) {
      location.tags = [];
    }

    return location;
  }
}

// 添加默认导出
export default new WorldSettingParserService();
