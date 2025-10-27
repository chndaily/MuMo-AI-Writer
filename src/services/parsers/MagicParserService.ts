import { extractTagsFromAIContent, normalizeTags } from '@/utils/tagSyncUtils';

/**
 * 魔法解析服务
 * 专门负责解析魔法类型的AI生成内容
 */
export class MagicParserService {
  /**
   * 解析魔法设定详细信息
   */
  parseMagicDetails(content: string): any {
    const lines = content.split('\n');
    const details: any = {};
    
    // 用于累积多行内容
    let currentField: string | null = null;
    let inBasicInfo = false; // 标记是否在基本信息部分

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
      }
    }

    return details;
  }

  /**
   * 从文本行中提取值
   */
  private extractValue(line: string): string {
    // 处理中文冒号和英文冒号
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
}

// 添加默认导出
export default new MagicParserService();