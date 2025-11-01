import { hybridStorageService } from '@/services/hybridStorageService';
import { WorldSettingType, SyncResult } from '@/types/ai-generation';
import { eventBus } from '@/utils/eventBus';

/**
 * 世界观设定同步服务
 * 为角色、地点、文化、科技、魔法、历史等类型提供统一的同步处理
 */
export class WorldSettingSyncService {
  private getTypeName(type: WorldSettingType): string {
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
   * 同步世界观设定内容 - 智能合并模式
   */
  async syncWorldSettings(
    content: string, 
    novelId: string, 
    type: WorldSettingType,
    options?: { 
      syncMode?: 'replace' | 'merge' | 'specific'; 
      targetName?: string;
    }
  ): Promise<SyncResult> {
    try {
      console.log('开始同步世界观设定内容', { novelId, type, contentLength: content.length, options });
      
      // 检查参数
      if (!content || content.trim().length === 0) {
        return {
          success: false,
          message: '设定内容不能为空',
          syncedItems: 0
        };
      }
      
      if (!novelId) {
        return {
          success: false,
          message: '小说ID不能为空',
          syncedItems: 0
        };
      }
      
      // 根据同步模式执行不同的处理逻辑
      // 默认使用合并模式，而不是替换模式
      if (options?.syncMode === 'specific' && options.targetName) {
        // 精准同步模式：只更新指定的设定项
        return await this.syncSpecificSetting(content, novelId, type, options.targetName);
      } else if (options?.syncMode === 'replace') {
        // 替换模式：完全替换现有设定
        return await this.replaceSettings(content, novelId, type);
      } else {
        // 默认合并模式：保留现有结构，合并新内容
        return await this.mergeSettings(content, novelId, type);
      }
    } catch (error) {
      console.error('世界观设定同步失败:', error);
      return {
        success: false,
        message: `${this.getTypeName(type)}设定同步失败: ${error instanceof Error ? error.message : String(error)}`,
        syncedItems: 0
      };
    }
  }
  
  /**
   * 替换模式：完全替换现有设定
   */
  private async replaceSettings(content: string, novelId: string, type: WorldSettingType): Promise<SyncResult> {
    // 获取现有的设定项
    const existingSettings = await hybridStorageService.getWorldElements(type, novelId);
    console.log(`现有${this.getTypeName(type)}设定数量:`, existingSettings.length);
    
    // 根据类型使用对应的同步服务解析内容
    const result = await this.syncSettingsByType(content, novelId, type);
    
    // 如果有现有设定，触发替换警告事件
    if (existingSettings.length > 0) {
      const existingNames = existingSettings.map((setting: any) => setting.name).filter(Boolean);
      const event = new CustomEvent('worldSettingReplaceWarning', {
        detail: {
          novelId,
          type,
          typeName: this.getTypeName(type),
          count: existingSettings.length,
          names: existingNames
        }
      });
      window.dispatchEvent(event);
    }
    
    return result;
  }
  
  /**
   * 合并模式：保留现有结构，合并新内容
   */
  private async mergeSettings(content: string, novelId: string, type: WorldSettingType): Promise<SyncResult> {
    // 根据类型使用对应的同步服务解析内容
    const result = await this.syncSettingsByType(content, novelId, type);
    return result;
  }
  
  /**
   * 精准同步模式：只更新指定的设定项
   */
  private async syncSpecificSetting(
    content: string, 
    novelId: string, 
    type: WorldSettingType, 
    targetName: string
  ): Promise<SyncResult> {
    console.log('执行精准同步模式', { type, targetName });
    
    // 获取现有的设定结构
    const existingSettings = await hybridStorageService.getWorldElements(type, novelId);
    console.log(`现有${this.getTypeName(type)}设定数量:`, existingSettings.length);
    
    // 查找目标设定项
    const targetSetting = existingSettings.find((setting: any) => setting.name === targetName);
    
    if (!targetSetting) {
      return {
        success: false,
        message: `未找到目标${this.getTypeName(type)}: ${targetName}`,
        syncedItems: 0
      };
    }
    
    // 根据类型使用对应的同步服务更新指定设定
    // 注意：精准同步模式需要在具体的同步服务中实现
    const result = await this.syncSettingsByType(content, novelId, type);
    return result;
  }
  
  /**
   * 根据类型调用对应的同步方法
   */
  private async syncSettingsByType(content: string, novelId: string, type: WorldSettingType): Promise<SyncResult> {
    switch (type) {
      case 'character':
        const { characterSyncService } = await import('@/services/sync/CharacterSyncService');
        return await characterSyncService.syncCharacters(content, novelId);
      case 'location':
        const { locationSyncService } = await import('@/services/sync/LocationSyncService');
        return await locationSyncService.syncLocations(content, novelId);
      case 'culture':
        const { cultureSyncService } = await import('@/services/sync/CultureSyncService');
        return await cultureSyncService.syncCultures(content, novelId);
      case 'technology':
        const { technologySyncService } = await import('@/services/sync/TechnologySyncService');
        return await technologySyncService.syncTechnologies(content, novelId);
      case 'magic':
        const { magicSyncService } = await import('@/services/sync/MagicSyncService');
        return await magicSyncService.syncMagics(content, novelId);
      case 'history':
        const { historySyncService } = await import('@/services/sync/HistorySyncService');
        return await historySyncService.syncHistories(content, novelId);
      default:
        throw new Error(`不支持的设定类型: ${type}`);
    }
  }
}

// 创建世界观设定同步服务实例
export const worldSettingSyncService = new WorldSettingSyncService();