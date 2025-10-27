import { hybridStorageService } from '@/services/hybridStorageService';
import { parserServices } from '@/services/parsers';
import { extractTagsFromAIContent, syncTagsToElement, normalizeTags } from '@/utils/tagSyncUtils';
import { WorldSettingType, SyncResult } from '@/types/ai-generation';
import { eventBus } from '@/utils/eventBus';

/**
 * 文化同步服务
 * 专门负责同步文化类型的AI生成内容到创作中心
 */
export class CultureSyncService {
  private getSettingTypeName(type: WorldSettingType): string {
    const typeNames: Partial<Record<WorldSettingType, string>> = {
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
   * 同步文化设定
   */
  async syncCultures(content: string, novelId: string, options?: any): Promise<SyncResult> {
    try {
      // 解析多个文化设定
      const cultures = await this.parseMultipleCultures(content);
      
      let syncedCount = 0;
      let updatedCount = 0;
      let createdCount = 0;
      
      // 为每个文化设定创建世界观元素对象并保存
      for (const cultureData of cultures) {
        // 跳过无效的文化数据
        if (!cultureData) continue;
        
        // 添加额外的保护性检查
        if (!cultureData.name && (!cultureData.tags || cultureData.tags.length === 0)) {
          console.warn('跳过无效的文化数据: 缺少名称和标签');
          continue;
        }
        
        try {
          // 对于所有类型，使用完整的设定数据内容来解析详细信息
          const detailsContent = cultureData?.description || content;
          
          // 解析详细信息
          const details = parserServices.culture.parseCultureDetails(detailsContent);
          
          // 尝试按名称匹配现有设定
          let existingElement = null;
          let shouldCreateNew = true; // 默认创建新条目
          
          try {
            const existingElements = await hybridStorageService.getWorldElements('culture', novelId);
            // 首先尝试按名称匹配
            if (cultureData && cultureData.name) {
              existingElement = existingElements.find((el: any) => el && el.name === cultureData.name);
            }
            
            if (existingElement) {
              // 找到同名设定，更新它
              shouldCreateNew = false;
            } else if (cultureData && cultureData.tags && cultureData.tags.length > 0) {
              // 如果没有找到同名设定，尝试按标签匹配
              const elementsWithTags = await hybridStorageService.getWorldElementsByExactTags(cultureData.tags, 'culture', novelId);
              
              if (elementsWithTags.length > 0) {
                // 使用第一个匹配的元素进行更新
                existingElement = elementsWithTags[0];
                shouldCreateNew = false;
              }
            }
          } catch (error) {
            console.warn('获取现有文化设定时出错:', error);
          }
          
          // 使用标签同步工具确保标签一致性
          const syncedTags = syncTagsToElement(detailsContent, existingElement);
                  
          // 创建世界观元素对象
          const cultureElement: any = {
            // 如果应该创建新条目，则不指定ID让系统生成，否则使用现有元素的ID
            id: shouldCreateNew ? undefined : existingElement?.id,
            novelId,
            name: cultureData.name || `${this.getSettingTypeName('culture')}设定`,
            description: cultureData.description && cultureData.description.length < content.length ? cultureData.description : (cultureData.description || ''),
            type: 'culture',
            tags: normalizeTags(syncedTags), // 使用同步后的标签
            createdAt: shouldCreateNew ? new Date().toISOString() : (existingElement?.createdAt || new Date().toISOString()),
            lastModified: new Date().toISOString(),
          }

          // 确保所有文化特有字段都被正确设置
          cultureElement.traditions = cultureData.traditions || details.traditions || '';
          cultureElement.values = cultureData.values || details.values || '';
          cultureElement.arts = cultureData.arts || details.arts || '';
          cultureElement.language = cultureData.language || details.language || '';
          cultureElement.religion = cultureData.religion || details.religion || '';
          cultureElement.customs = cultureData.customs || details.customs || '';
          cultureElement.festivals = cultureData.festivals || details.festivals || '';
          cultureElement.art = cultureData.art || details.art || '';
          cultureElement.socialStructure = cultureData.socialStructure || details.socialStructure || '';
          cultureElement.education = cultureData.education || details.education || '';
          cultureElement.technology = cultureData.technology || details.technology || '';
          cultureElement.details = cultureData.details || details.details || '';
          cultureElement.cultureInteraction = cultureData.cultureInteraction || details.cultureInteraction || '';
          
          console.log('Debug: 最终设置的cultureInteraction (ByTags) =', cultureElement.cultureInteraction);
          
          // 添加标签字段
          if (cultureData.tags) cultureElement.tags = cultureData.tags;

          await hybridStorageService.saveWorldElement(cultureElement, 'culture');
          syncedCount++;
          if (shouldCreateNew) {
            createdCount++;
          } else {
            updatedCount++;
          }
          console.log(`✅ 成功同步文化设定: ${cultureElement.name}`);
        } catch (settingError) {
          console.error(`同步单个文化设定失败:`, settingError);
          // 继续处理其他设定项，但记录错误
          throw new Error(`同步文化设定失败: ${settingError instanceof Error ? settingError.message : String(settingError)}`);
        }
      }

      console.log(`文化设定同步完成，共同步 ${syncedCount} 个设定（创建 ${createdCount} 个，更新 ${updatedCount} 个）`);
      
      // 如果有更新操作，触发替换内容事件
      if (updatedCount > 0) {
        // 触发世界设定替换事件，用于通知相关组件显示替换警告
        eventBus.emit('worldSettingReplaced', { novelId, type: 'culture', updatedCount });
      }
      
      return {
        success: true,
        message: `成功同步 ${syncedCount} 个文化设定（创建 ${createdCount} 个，更新 ${updatedCount} 个）`,
        syncedItems: syncedCount,
      }
    } catch (error) {
      console.error('文化设定同步失败:', error);
      return {
        success: false,
        message: `文化设定同步失败: ${error instanceof Error ? error.message : String(error)}`,
        errors: [String(error)],
      }
    }
  }

  /**
   * 解析多个文化设定
   */
  private async parseMultipleCultures(content: string): Promise<any[]> {
    const cultures: any[] = [];
    const lines = content.split('\n');
    
    // 检查是否包含多个设定项
    const typePattern = new RegExp(`【${this.getSettingTypeName('culture')}设定\\d*[.、:：]?\\s*([^】]+)】`, 'g');
    const typeMatches = content.match(typePattern);
    
    console.log(`检测到${typeMatches ? typeMatches.length : 0}个文化设定项`);
    
    if (typeMatches && typeMatches.length > 1) {
      // 有多个设定项
      const sections = content.split(typePattern);
      // 移除第一个空元素
      sections.shift();
      
      for (let i = 0; i < typeMatches.length; i++) {
        const match = typeMatches[i].match(new RegExp(`【${this.getSettingTypeName('culture')}设定\\d*[.、:：]?\\s*([^】]+)】`));
        const title = match ? match[1] : `文化设定${i + 1}`;
        
        // 提取设定内容
        const sectionContent = i * 2 + 1 < sections.length ? sections[i * 2 + 1] : '';
        const fullContent = `${typeMatches[i]}\n${sectionContent}`;
        
        // 解析详细信息
        const details = parserServices.culture.parseCultureDetails(fullContent);
        
        // 解析标签（在基本信息部分）
        let tags: string[] = [];
        let inBasicInfo = false;
        const sectionLines = fullContent.split('\n');
        
        for (const line of sectionLines) {
          const trimmedLine = line.trim();
          if (trimmedLine.includes('【基本信息】')) {
            inBasicInfo = true;
            continue;
          } else if (trimmedLine.includes('【') && trimmedLine.includes('】') && !trimmedLine.includes(`${this.getSettingTypeName('culture')}设定`)) {
            inBasicInfo = false;
          }
          
          if (inBasicInfo && trimmedLine.includes('标签')) {
            console.log(`检测到标签行`);
            // 使用标签同步工具解析标签
            const tagsStr = this.extractValue(trimmedLine);
            console.log(`提取的标签值: ${tagsStr}`);
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
          type: 'culture',
          tags: tags,
          ...details
        };
        
        cultures.push(setting);
      }
      console.log(`解析完成，共${cultures.length}个文化设定:`, cultures.map(s => s.name));
      return cultures;
    } else if (typeMatches && typeMatches.length === 1) {
      // 单个设定项
      const match = typeMatches[0].match(new RegExp(`【${this.getSettingTypeName('culture')}设定\\d*[.、:：]?\\s*([^】]+)】`));
      const title = match ? match[1] : `文化设定`;
      
      // 解析详细信息
      const details = parserServices.culture.parseCultureDetails(content);
      
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
        type: 'culture',
        tags: tags,
        ...details
      };
      
      cultures.push(setting);
      console.log(`解析完成，共${cultures.length}个文化设定:`, cultures.map(s => s.name));
      return cultures;
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
        const isSettingStart = sectionTitle.includes('文化') || /^\d+[.、:：]?\s*文化/.test(sectionTitle);
        
        if (isSettingStart) {
          // 如果已经有当前设定项，保存它
          if (currentSetting) {
            // 确保所有必需字段都存在
            if (!currentSetting.tags) {
              currentSetting.tags = [];
            }
            cultures.push(currentSetting);
          }
          
          // 提取设定项名称（从【】标记中）
          let settingName = `文化设定`;
          // 如果名称中包含冒号，提取冒号后的内容作为名称
          const colonIndex = sectionTitle.indexOf('：');
          if (colonIndex > -1) {
            settingName = sectionTitle.substring(colonIndex + 1).trim();
          } else {
            // 否则使用整个内容作为名称，但去掉数字前缀
            const nameWithoutPrefix = sectionTitle.replace(/^\d+[.、:：]?\s*/, '');
            if (nameWithoutPrefix && !nameWithoutPrefix.includes('文化')) {
              settingName = nameWithoutPrefix;
            }
          }
          
          // 开始新的设定项
          currentSetting = {
            name: settingName,
            description: '',
            type: 'culture',
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
      cultures.push(currentSetting);
    }
    
    // 如果没有解析出任何设定项，创建一个默认的
    if (cultures.length === 0) {
      // 解析详细信息
      const details = parserServices.culture.parseCultureDetails(content);
      
      cultures.push({
        name: `文化设定`,
        description: content,
        type: 'culture',
        tags: [], // 添加标签字段
        ...details
      });
    } else if (cultures.length === 1) {
      // 对于文化类型，如果只解析出一个设定项，还需要解析详细信息
      const details = parserServices.culture.parseCultureDetails(content);
      cultures[0] = {
        ...cultures[0],
        ...details
      };
    }
    
    console.log(`解析完成，共${cultures.length}个文化设定:`, cultures.map(s => s.name));
    return cultures;
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

// 创建文化同步服务实例
export const cultureSyncService = new CultureSyncService();