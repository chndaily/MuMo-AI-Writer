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
      
      // 为每个地点创建或更新地点对象并保存
      const locationData = locations;
      // 跳过无效的地点数据
      if (!locationData) return { success: true, message: '没有地点数据需要同步', syncedItems: 0 };
      
      // 添加额外的保护性检查
      if (!locationData.name && (!locationData.tags || locationData.tags.length === 0)) {
        console.warn('跳过无效的地点数据: 缺少名称和标签');
        return { success: true, message: '跳过无效的地点数据', syncedItems: 0 };
      }
      
      try {
        // 解析详细信息
        const detailsContent = locationData?.description || content;
        const details = await parserServices.location.parseLocationContent(detailsContent);
        
        // 尝试按名称匹配现有地点
        let existingElement = null;
        let shouldCreateNew = true; // 默认创建新条目
        
        try {
          const existingElements = await hybridStorageService.getWorldElements('location', novelId);
          // 首先尝试按名称匹配
          if (locationData && locationData.name) {
            existingElement = existingElements.find((el: any) => el && el.name === locationData.name);
          }
          
          if (existingElement) {
            // 找到同名地点，更新它
            shouldCreateNew = false;
          } else if (locationData && locationData.tags && locationData.tags.length > 0) {
            // 如果没有找到同名地点，尝试按标签匹配
            const elementsWithTags = await hybridStorageService.getWorldElementsByExactTags(locationData.tags, 'location', novelId);
            
            if (elementsWithTags.length > 0) {
              // 使用第一个匹配的元素进行更新
              existingElement = elementsWithTags[0];
              shouldCreateNew = false;
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
        locationElement.type = locationData.locationType && locationData.locationType !== '' ? locationData.locationType : (details.locationType && details.locationType !== '' ? details.locationType : 'location');
        locationElement.locationType = locationData.locationType && locationData.locationType !== '' ? locationData.locationType : (details.locationType && details.locationType !== '' ? details.locationType : '');
        locationElement.importance = locationData.importance || details.importance || '';
        locationElement.geography = locationData.geography || details.geography || '';
        locationElement.culture = locationData.culture || details.culture || '';
        locationElement.politics = locationData.politics || details.politics || '';
        locationElement.economy = locationData.economy || details.economy || '';
        locationElement.details = locationData.details || details.details || '';
        
        // 确保所有地点字段都被正确设置
        locationElement.climate = locationData.climate || details.climate || '';
        locationElement.terrain = locationData.terrain || details.terrain || '';
        locationElement.naturalResources = locationData.naturalResources || details.naturalResources || '';
        locationElement.ecosystem = locationData.ecosystem || details.ecosystem || '';
        locationElement.architecture = locationData.architecture || details.architecture || '';
        locationElement.socialStructure = locationData.socialStructure || details.socialStructure || '';
        locationElement.historyBackground = locationData.historyBackground || details.historyBackground || '';
        locationElement.governance = locationData.governance || details.governance || '';
        locationElement.laws = locationData.laws || details.laws || '';
        locationElement.mainIndustries = locationData.mainIndustries || details.mainIndustries || '';
        locationElement.trade = locationData.trade || details.trade || '';
        locationElement.wealth = locationData.wealth || details.wealth || '';
        
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

      console.log(`地点设定同步完成，共同步 ${syncedCount} 个设定（创建 ${createdCount} 个，更新 ${updatedCount} 个）`);
      
      // 如果有更新操作，触发替换内容事件
      if (updatedCount > 0) {
        // 触发世界设定替换事件，用于通知相关组件显示替换警告
        eventBus.emit('worldSettingReplaced', { novelId, type: 'location', updatedCount });
      }
      
      return {
        success: true,
        message: `成功同步 ${syncedCount} 个地点设定（创建 ${createdCount} 个，更新 ${updatedCount} 个）`,
        syncedItems: syncedCount,
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
}

// 创建地点同步服务实例
export const locationSyncService = new LocationSyncService();