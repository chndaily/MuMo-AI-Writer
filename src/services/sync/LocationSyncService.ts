import { hybridStorageService } from '@/services/hybridStorageService';
import { parserServices } from '@/services/parsers';
import { extractTagsFromAIContent, syncTagsToElement, normalizeTags } from '@/utils/tagSyncUtils';
import { WorldSettingType, SyncResult } from '@/types/ai-generation';
import { eventBus } from '@/utils/eventBus';

/**
 * 地点同步服务
 * 专门负责同步地点类型的AI生成内容到创作中心
 */
export class LocationSyncService {
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
   * 同步地点设定
   */
  async syncLocations(content: string, novelId: string, options?: any): Promise<SyncResult> {
    try {
      // 使用新的地点解析服务解析多个地点设定
      const locations = await parserServices.location.parseLocationContent(content);
      
      let syncedCount = 0;
      let updatedCount = 0;
      let createdCount = 0;
      let modifiedLocations: any[] = []; // 记录真正有修改的地点
      
      // 确保locations是数组格式
      const locationsArray = Array.isArray(locations) ? locations : [locations].filter(Boolean);
      
      // 获取现有的地点列表
      const existingLocations = await hybridStorageService.getWorldElements('location', novelId);
      console.log('获取到的现有地点数量:', existingLocations.length);
      
      // 为每个地点创建或更新地点对象并保存
      for (const locationData of locationsArray) {
        // 跳过无效的地点数据
        if (!locationData) {
          console.warn('跳过无效的地点数据: locationData为空');
          continue;
        }
        
        // 添加额外的保护性检查
        if (!locationData.name && (!locationData.tags || locationData.tags.length === 0)) {
          console.warn('跳过无效的地点数据: 缺少名称和标签');
          continue;
        }
        
        try {
          // 解析详细信息
          const detailsContent = locationData?.description || content;
          const details = locationData; // 使用locationData本身作为details
          
          // 尝试按名称匹配现有地点
          let existingElement = null;
          let shouldCreateNew = true; // 默认创建新条目
          
          try {
            // 首先尝试按名称匹配
            if (locationData && locationData.name) {
              existingElement = existingLocations.find((el: any) => el && el.name === locationData.name);
            }
            
            if (existingElement) {
              // 找到同名地点，检查是否有实际变更
              console.log('找到同名地点:', existingElement.name);
              shouldCreateNew = false;
              
              // 检查地点数据是否有实际变更
              const hasChanges = this.hasLocationChanges(existingElement, locationData);
              if (!hasChanges) {
                console.log(`地点 ${locationData.name} 没有变化，跳过更新`);
                continue;
              }
              
              // 记录有修改的地点
              modifiedLocations.push(locationData.name);
            } else if (locationData && locationData.tags && locationData.tags.length > 0) {
              // 如果没有找到同名地点，尝试按标签匹配
              const elementsWithTags = await hybridStorageService.getWorldElementsByExactTags(locationData.tags, 'location', novelId);
              
              if (elementsWithTags.length > 0) {
                // 使用第一个匹配的元素进行更新
                existingElement = elementsWithTags[0];
                console.log('按标签匹配到地点:', existingElement.name);
                shouldCreateNew = false;
                
                // 检查地点数据是否有实际变更
                const hasChanges = this.hasLocationChanges(existingElement, locationData);
                if (!hasChanges) {
                  console.log(`地点 ${locationData.name} 没有变化，跳过更新`);
                  continue;
                }
                
                // 记录有修改的地点
                modifiedLocations.push(locationData.name);
              }
            }
          } catch (error) {
            console.warn('获取现有地点时出错:', error);
          }
          
          // 使用标签同步工具确保标签一致性
          const syncedTags = syncTagsToElement(detailsContent, existingElement);
                  
          // 创建地点对象
          const locationElement: any = {
            // 如果应该创建新条目，则不指定ID让系统生成，否则使用现有元素的ID
            id: shouldCreateNew ? undefined : existingElement?.id,
            novelId,
            name: locationData.name || 'AI生成地点',
            description: locationData.description && locationData.description.length < content.length ? locationData.description : (locationData.description || ''),
            type: 'location',
            tags: normalizeTags(syncedTags), // 使用同步后的标签
            createdAt: shouldCreateNew ? new Date().toISOString() : (existingElement?.createdAt || new Date().toISOString()),
            lastModified: new Date().toISOString(),
          }

          // 确保所有地点字段都被正确设置
          // 使用AI生成的类型内容作为type字段的值
          locationElement.type = locationData.locationType && locationData.locationType !== '' ? locationData.locationType : (locationData.locationType && locationData.locationType !== '' ? locationData.locationType : 'location');
          locationElement.locationType = locationData.locationType && locationData.locationType !== '' ? locationData.locationType : (locationData.locationType && locationData.locationType !== '' ? locationData.locationType : '');
          locationElement.importance = locationData.importance || locationData.importance || '';
          locationElement.geography = locationData.geography || locationData.geography || '';
          locationElement.culture = locationData.culture || locationData.culture || '';
          locationElement.politics = locationData.politics || locationData.politics || '';
          locationElement.economy = locationData.economy || locationData.economy || '';
          locationElement.details = locationData.details || locationData.details || '';
          
          // 确保所有地点字段都被正确设置
          locationElement.climate = locationData.climate || locationData.climate || '';
          locationElement.terrain = locationData.terrain || locationData.terrain || '';
          locationElement.naturalResources = locationData.naturalResources || locationData.naturalResources || '';
          locationElement.ecosystem = locationData.ecosystem || locationData.ecosystem || '';
          locationElement.architecture = locationData.architecture || locationData.architecture || '';
          locationElement.socialStructure = locationData.socialStructure || locationData.socialStructure || '';
          locationElement.historyBackground = locationData.historyBackground || locationData.historyBackground || '';
          locationElement.governance = locationData.governance || locationData.governance || '';
          locationElement.laws = locationData.laws || locationData.laws || '';
          locationElement.mainIndustries = locationData.mainIndustries || locationData.mainIndustries || '';
          locationElement.trade = locationData.trade || locationData.trade || '';
          locationElement.wealth = locationData.wealth || locationData.wealth || '';
          
          // 确保标签字段正确设置
          if (locationData.tags) locationElement.tags = locationData.tags;

          await hybridStorageService.saveWorldElement(locationElement, 'location');
          syncedCount++;
          if (shouldCreateNew) {
            createdCount++;
          } else {
            updatedCount++;
          }
          console.log(`✅ 成功同步地点设定: ${locationElement.name}`);
          
        } catch (settingError) {
          console.error(`同步单个地点设定失败:`, settingError);
          // 继续处理其他设定项，但记录错误
          throw new Error(`同步地点设定失败: ${settingError instanceof Error ? settingError.message : String(settingError)}`);
        }
      }

      console.log(`地点设定同步完成，共同步 ${syncedCount} 个设定（创建 ${createdCount} 个，更新 ${updatedCount} 个）`);
      
      // 如果有更新操作且有实际修改的地点，触发替换内容事件
      if (updatedCount > 0 && modifiedLocations.length > 0) {
        // 触发世界设定替换事件，用于通知相关组件显示替换警告
        eventBus.emit('worldSettingReplaced', { novelId, type: 'location', updatedCount, modifiedLocations });
      }
      
      return {
        success: true,
        message: `成功同步 ${syncedCount} 个地点设定（创建 ${createdCount} 个，更新 ${updatedCount} 个）`,
        syncedItems: syncedCount
      }
    } catch (error) {
      console.error('地点设定同步失败:', error);
      return {
        success: false,
        message: `地点设定同步失败: ${error instanceof Error ? error.message : String(error)}`,
        errors: [String(error)],
      }
    }
  }
  
  /**
   * 检查地点数据是否有实际变更
   */
  private hasLocationChanges(existing: any, newData: any): boolean {
    // 检查基本字段是否有变化
    const basicFields = [
      'name', 'description', 'type', 'locationType', 'importance', 'geography', 'climate', 'terrain',
      'naturalResources', 'ecosystem', 'architecture', 'socialStructure', 'culture', 'historyBackground',
      'politics', 'governance', 'laws', 'economy', 'mainIndustries', 'trade', 'wealth', 'details'
    ];
    
    for (const field of basicFields) {
      if (existing[field] !== newData[field]) {
        console.log(`地点字段 ${field} 有变化: ${existing[field]} -> ${newData[field]}`);
        return true;
      }
    }
    
    // 检查标签是否有变化
    const tagFields = ['tags'];
    for (const field of tagFields) {
      const existingTags = existing[field] || [];
      const newTags = newData[field] || [];
      
      // 比较标签数组是否相等
      if (existingTags.length !== newTags.length) {
        console.log(`地点标签字段 ${field} 数量有变化: ${existingTags.length} -> ${newTags.length}`);
        return true;
      }
      
      // 检查标签内容是否完全相同
      const existingSet = new Set(existingTags);
      const newSet = new Set(newTags);
      if (existingTags.some((tag: string) => !newSet.has(tag)) || newTags.some((tag: string) => !existingSet.has(tag))) {
        console.log(`地点标签字段 ${field} 内容有变化`);
        return true;
      }
    }
    
    // 如果所有字段都相同，则没有变化
    return false;
  }
}

// 创建地点同步服务实例
export const locationSyncService = new LocationSyncService();