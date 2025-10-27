import { extractTagsFromAIContent, normalizeTags } from '@/utils/tagSyncUtils';

/**
 * 文化解析服务
 * 专门负责解析文化类型的AI生成内容
 */
export class CultureParserService {
  /**
   * 解析文化设定详细信息
   */
  parseCultureDetails(content: string): any {
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
export default new CultureParserService();