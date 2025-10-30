import { extractTagsFromAIContent, normalizeTags } from '@/utils/tagSyncUtils';

/**
 * 地点解析服务
 * 专门负责解析地点类型的AI生成内容
 */
export class LocationParserService {
  /**
   * 解析地点内容（支持多个地点）
   */
  async parseLocationContent(content: string): Promise<any[]> {
    console.log('parserServices.location.parseLocationContent 调用');
    
    // 按地点设定分割内容
    const locationSections = this.splitContentByLocations(content);
    
    if (locationSections.length === 0) {
      // 如果没有找到明确的地点分隔符，尝试解析整个内容作为一个地点
      const singleLocation = this.parseSingleLocation(content);
      return singleLocation ? [singleLocation] : [];
    }
    
    const locations: any[] = [];
    for (const section of locationSections) {
      const location = this.parseSingleLocation(section);
      if (location) {
        locations.push(location);
      }
    }
    
    console.log('解析到的地点数组:', locations);
    return locations;
  }
  
  /**
   * 按地点设定分割内容
   */
  private splitContentByLocations(content: string): string[] {
    // 查找所有【地点设定】标记，支持多种格式
    const locationMarkers = [...content.matchAll(/【地点设定[:：]?\s*[^】]*】/g)];
    
    // 如果没有找到标准格式的地点设定标记，尝试查找其他可能的标记
    if (locationMarkers.length === 0) {
      // 查找"地点"关键词作为分割点
      const placeMarkers = [...content.matchAll(/(^|\n)##?\s*地点\s*\d*[:：]?/g)];
      if (placeMarkers.length > 1) {
        const sections: string[] = [];
        for (let i = 0; i < placeMarkers.length; i++) {
          const start = placeMarkers[i].index!;
          const end = i < placeMarkers.length - 1 ? placeMarkers[i + 1].index! : content.length;
          sections.push(content.substring(start, end).trim());
        }
        return sections;
      }
      
      // 如果还是没有找到分割点，返回整个内容作为一个地点
      return [];
    }
    
    if (locationMarkers.length <= 1) {
      // 如果只有一个或没有地点标记，返回整个内容
      return [];
    }
    
    const sections: string[] = [];
    for (let i = 0; i < locationMarkers.length; i++) {
      const start = locationMarkers[i].index!;
      const end = i < locationMarkers.length - 1 ? locationMarkers[i + 1].index! : content.length;
      sections.push(content.substring(start, end).trim());
    }
    
    return sections;
  }
  
  /**
   * 解析单个地点
   */
  private parseSingleLocation(content: string): any {
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
        } else if (trimmedLine.includes('文化')) {
          if (!location.culture) {
            location.culture = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            location.culture += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('政治')) {
          if (!location.politics) {
            location.politics = this.normalizeLineBreaks(this.extractValue(trimmedLine));
          } else {
            location.politics += '\n' + this.normalizeLineBreaks(this.extractValue(trimmedLine));
          }
        } else if (trimmedLine.includes('经济')) {
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

    // 如果没有解析到有效数据，返回null
    if (!location.name && (!location.tags || location.tags.length === 0)) {
      console.log('未解析到有效地点');
      return null;
    }
    
    return location;
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
export default new LocationParserService();