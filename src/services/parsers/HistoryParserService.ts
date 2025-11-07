import { extractTagsFromAIContent, normalizeTags } from '@/utils/tagSyncUtils';

/**
 * 历史解析服务
 * 专门负责解析历史类型的AI生成内容
 */
export class HistoryParserService {
  /**
   * 解析历史设定详细信息
   */
  parseHistoryDetails(content: string): any {
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
      } else if (trimmedLine.includes('【时间线】')) {
        inBasicInfo = false;
        currentField = 'timeline';
        // 处理同一行的内容，但要排除标记本身
        if (trimmedLine !== '【时间线】') {
          // 修复：保留内容标识，不丢弃冒号前的部分
          if (!details.timeline) {
            details.timeline = trimmedLine;
          } else {
            details.timeline += '\n' + trimmedLine;
          }
        }
        continue;
      } else if (trimmedLine.includes('【重要事件】')) {
        currentField = 'events';
        // 处理同一行的内容，但要排除标记本身
        if (trimmedLine !== '【重要事件】') {
          // 修复：保留内容标识，不丢弃冒号前的部分
          if (!details.events) {
            details.events = trimmedLine;
          } else {
            details.events += '\n' + trimmedLine;
          }
        }
        continue;
      } else if (trimmedLine.includes('【历史人物】')) {
        currentField = 'figures';
        // 处理同一行的内容，但要排除标记本身
        if (trimmedLine !== '【历史人物】') {
          // 修复：保留内容标识，不丢弃冒号前的部分
          if (!details.figures) {
            details.figures = trimmedLine;
          } else {
            details.figures += '\n' + trimmedLine;
          }
        }
        continue;
      } else if (trimmedLine.includes('【历史后果】')) {
        currentField = 'consequences';
        // 处理同一行的内容，但要排除标记本身
        if (trimmedLine !== '【历史后果】') {
          // 修复：保留内容标识，不丢弃冒号前的部分
          if (!details.consequences) {
            details.consequences = trimmedLine;
          } else {
            details.consequences += '\n' + trimmedLine;
          }
        }
        continue;
      } else if (trimmedLine.includes('【细节补充】')) {
        currentField = 'details';
        // 处理同一行的内容，但要排除标记本身
        if (trimmedLine !== '【细节补充】') {
          // 修复：保留内容标识，不丢弃冒号前的部分
          if (!details.details) {
            details.details = trimmedLine;
          } else {
            details.details += '\n' + trimmedLine;
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
          // 处理列表项（以-开头的行）
          if (trimmedLine.startsWith('-')) {
            // 修复：保留内容标识，不丢弃冒号前的部分
            if (!details[currentField]) {
              details[currentField] = trimmedLine;
            } else {
              details[currentField] += '\n' + trimmedLine;
            }
          } else {
            // 处理普通文本行，对于历史设定类型，需要保留具体的字段标签
            if (currentField === 'timeline' && (trimmedLine.includes('重要时期：') || trimmedLine.includes('时间节点：') || trimmedLine.includes('年代跨度：'))) {
              // 修复：保留内容标识，不丢弃冒号前的部分
              if (!details[currentField]) {
                details[currentField] = trimmedLine;
              } else {
                details[currentField] += '\n' + trimmedLine;
              }
            } else if (currentField === 'events' && (trimmedLine.includes('重大事件：') || trimmedLine.includes('影响：') || trimmedLine.includes('战争冲突：') || trimmedLine.includes('政治变迁：') || trimmedLine.includes('文化交融：'))) {
              // 修复：保留内容标识，不丢弃冒号前的部分
              if (!details[currentField]) {
                details[currentField] = trimmedLine;
              } else {
                details[currentField] += '\n' + trimmedLine;
              }
            } else if (currentField === 'figures' && (trimmedLine.includes('关键人物：') || trimmedLine.includes('人物1：')|| trimmedLine.includes('人物2：')|| trimmedLine.includes('人物3：')|| trimmedLine.includes('人物4：')|| trimmedLine.includes('人物5：')|| trimmedLine.includes('贡献：')  || trimmedLine.includes('英雄豪杰：') || trimmedLine.includes('奸臣恶徒：') || trimmedLine.includes('普通民众：'))) {
              // 修复：保留内容标识，不丢弃冒号前的部分
              if (!details[currentField]) {
                details[currentField] = trimmedLine;
              } else {
                details[currentField] += '\n' + trimmedLine;
              }
            } else if (currentField === 'consequences' && (trimmedLine.includes('对后世的影响：') || trimmedLine.includes('遗产传承：') || trimmedLine.includes('未解之谜：'))) {
              // 修复：保留内容标识，不丢弃冒号前的部分
              if (!details[currentField]) {
                details[currentField] = trimmedLine;
              } else {
                details[currentField] += '\n' + trimmedLine;
              }
            } else if (currentField === 'details' && (trimmedLine.includes('社会状况：') || trimmedLine.includes('经济发展：') || trimmedLine.includes('科技水平：') || trimmedLine.includes('其他相关信息：'))) {
              // 修复：保留内容标识，不丢弃冒号前的部分
              if (!details[currentField]) {
                details[currentField] = trimmedLine;
              } else {
                details[currentField] += '\n' + trimmedLine;
              }
            } else {
              // 修复：保留内容标识，不丢弃冒号前的部分
              if (!details[currentField]) {
                details[currentField] = trimmedLine;
              } else {
                details[currentField] += '\n' + trimmedLine;
              }
            }
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
export default new HistoryParserService();