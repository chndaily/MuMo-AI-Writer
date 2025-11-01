import { databaseManager } from '@/services';
import { hybridStorageService } from '@/services/hybridStorageService';
import { parserServices } from '@/services/parsers';
import { extractTagsFromAIContent, syncTagsToElement, normalizeTags, categorizeTags } from '@/utils/tagSyncUtils';
import { WorldSettingType, SyncResult } from '@/types/ai-generation';
import { eventBus } from '@/utils/eventBus';

/**
 * 角色同步服务
 * 专门负责同步角色类型的AI生成内容到创作中心
 */
export class CharacterSyncService {
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
   * 同步角色设定
   */
  async syncCharacters(content: string, novelId: string, options?: any): Promise<SyncResult> {
    try {
      console.log('开始同步角色，小说ID:', novelId, '内容长度:', content.length);
      
      // 使用新的角色解析服务解析多个角色设定
      let characters;
      try {
        characters = await parserServices.character.parseCharacterContent(content);
        console.log('角色解析完成，解析到的角色数量:', Array.isArray(characters) ? characters.length : (characters ? 1 : 0));
        console.log('解析到的角色数据:', characters);
      } catch (parseError) {
        console.error('角色解析失败:', parseError);
        throw new Error(`角色解析失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      let syncedCount = 0;
      let updatedCount = 0;
      let createdCount = 0;
      let modifiedCharacters: any[] = []; // 记录真正有修改的角色
      
      console.log('解析到的角色数组:', characters);
      
      // 确保characters是数组
      const charactersArray = Array.isArray(characters) ? characters : [characters].filter(Boolean);
      
      // 获取现有的角色列表
      const existingCharacters = await hybridStorageService.getWorldElements('character', novelId);
      console.log('获取到的现有角色数量:', existingCharacters.length);
      
      // 为每个角色创建或更新角色对象并保存
      for (const characterData of charactersArray) {
        // 跳过无效的角色数据
        if (!characterData) {
          console.warn('跳过无效的角色数据: characterData为空');
          continue;
        }
        
        // 添加额外的保护性检查
        if (!characterData.name && (!characterData.tags || characterData.tags.length === 0)) {
          console.warn('跳过无效的角色数据: 缺少名称和标签');
          continue;
        }
        
        try {
          console.log('开始处理角色:', characterData.name);
          
          // 使用已解析的角色数据，无需再次解析
          const details = characterData || {};
          
          // 尝试按名称匹配现有角色
          let existingElement = null;
          let shouldCreateNew = true; // 默认创建新条目
          
          try {
            // 首先尝试按名称匹配
            if (characterData && characterData.name) {
              existingElement = existingCharacters.find((el: any) => el && el.name === characterData.name);
            }
            
            if (existingElement) {
              // 找到同名角色，检查是否有实际变更
              console.log('找到同名角色:', existingElement.name);
              shouldCreateNew = false;
              
              // 检查角色数据是否有实际变更
              const hasChanges = this.hasCharacterChanges(existingElement, characterData);
              if (!hasChanges) {
                console.log(`角色 ${characterData.name} 没有变化，跳过更新`);
                continue;
              }
              
              // 记录有修改的角色
              modifiedCharacters.push(characterData.name);
            } else if (characterData && characterData.tags && characterData.tags.length > 0) {
              // 如果没有找到同名角色，尝试按标签匹配
              const elementsWithTags = await hybridStorageService.getWorldElementsByExactTags(characterData.tags, 'character', novelId);
              
              if (elementsWithTags.length > 0) {
                // 使用第一个匹配的元素进行更新
                existingElement = elementsWithTags[0];
                console.log('按标签匹配到角色:', existingElement.name);
                shouldCreateNew = false;
                
                // 检查角色数据是否有实际变更
                const hasChanges = this.hasCharacterChanges(existingElement, characterData);
                if (!hasChanges) {
                  console.log(`角色 ${characterData.name} 没有变化，跳过更新`);
                  continue;
                }
                
                // 记录有修改的角色
                modifiedCharacters.push(characterData.name);
              }
            }
          } catch (error) {
            console.warn('获取现有角色时出错:', error);
          }
          
          // 使用标签同步工具确保标签一致性
          const detailsContent = characterData?.description || content;
          let syncedTags = [];
          try {
            syncedTags = syncTagsToElement(detailsContent, existingElement);
          } catch (tagSyncError) {
            console.warn('标签同步失败，使用空数组:', tagSyncError);
            syncedTags = [];
          }
                  
          // 创建角色对象
          const characterElement: any = {
            // 如果应该创建新条目，则不指定ID让系统生成，否则使用现有元素的ID
            id: shouldCreateNew ? undefined : existingElement?.id,
            novelId,
            name: characterData.name || 'AI生成角色',
            // 修复：确保描述字段合理（不包含过多内容）
            description: characterData.description && characterData.description.length < content.length ? characterData.description : (characterData.description || ''),
            type: 'character',
            tags: normalizeTags(syncedTags), // 使用同步后的标签
            createdAt: shouldCreateNew ? new Date().toISOString() : (existingElement?.createdAt || new Date().toISOString()),
            lastModified: new Date().toISOString(),
            role: characterData.role || 'supporting'
          }

          // 确保所有角色字段都被正确设置
          characterElement.appearance = characterData.appearance || details.appearance || '';
          characterElement.personality = characterData.personality || details.personality || '';
          characterElement.background = characterData.background || details.background || '';
          characterElement.abilities = characterData.abilities || details.abilities || '';
          characterElement.relationships = characterData.relationships || details.relationships || '';
          characterElement.characterArc = characterData.characterArc || details.characterArc || '';
          characterElement.details = characterData.details || details.details || '';
          // 添加标签字段
          if (characterData.tags) characterElement.tags = characterData.tags;
          if (characterData.professionTags) characterElement.professionTags = characterData.professionTags;
          if (characterData.personalityTags) characterElement.personalityTags = characterData.personalityTags;
          if (characterData.functionTags) characterElement.functionTags = characterData.functionTags;

          console.log(`${shouldCreateNew ? '创建新角色' : '更新现有角色'}: ${characterElement.name}`);
          console.log('角色数据:', characterElement);
          
          // 保存角色
          try {
            await hybridStorageService.saveWorldElement(characterElement, 'character');
            syncedCount++;
            if (shouldCreateNew) {
              createdCount++;
            } else {
              updatedCount++;
            }
            console.log(`✅ 成功同步角色设定: ${characterElement.name}`);
          } catch (saveError) {
            console.error(`保存角色设定失败 ${characterElement.name}:`, saveError);
            // 不中断整个同步过程，继续处理其他角色
            continue;
          }
          
        } catch (settingError) {
          console.error(`同步单个角色设定失败:`, settingError);
          // 继续处理其他设定项，但记录错误
          continue;
        }
      }

      console.log(`角色设定同步完成，共同步 ${syncedCount} 个设定（创建 ${createdCount} 个，更新 ${updatedCount} 个）`);
      
      // 添加一个小延迟确保数据完全写入
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 如果有更新操作且有实际修改的角色，触发替换内容事件
      if (updatedCount > 0 && modifiedCharacters.length > 0) {
        // 触发世界设定替换事件，用于通知相关组件显示替换警告
        eventBus.emit('worldSettingReplaced', { novelId, type: 'character', updatedCount, modifiedCharacters });
      }
      
      return {
        success: true,
        message: `成功同步 ${syncedCount} 个角色设定（创建 ${createdCount} 个，更新 ${updatedCount} 个）`,
        syncedItems: syncedCount,
      }
    } catch (error) {
      console.error('角色设定同步失败:', error);
      return {
        success: false,
        message: `角色设定同步失败: ${error instanceof Error ? error.message : String(error)}`,
        errors: [String(error)],
      }
    }
  }
  
  /**
   * 检查角色数据是否有实际变更
   */
  private hasCharacterChanges(existing: any, newData: any): boolean {
    // 检查基本字段是否有变化
    const basicFields = ['name', 'description', 'role', 'appearance', 'personality', 'background', 'abilities', 'relationships', 'characterArc', 'details'];
    for (const field of basicFields) {
      if (existing[field] !== newData[field]) {
        console.log(`角色字段 ${field} 有变化: ${existing[field]} -> ${newData[field]}`);
        return true;
      }
    }
    
    // 检查标签是否有变化
    const tagFields = ['tags', 'professionTags', 'personalityTags', 'functionTags'];
    for (const field of tagFields) {
      const existingTags = existing[field] || [];
      const newTags = newData[field] || [];
      
      // 比较标签数组是否相等
      if (existingTags.length !== newTags.length) {
        console.log(`角色标签字段 ${field} 数量有变化: ${existingTags.length} -> ${newTags.length}`);
        return true;
      }
      
      // 检查标签内容是否完全相同
      const existingSet = new Set(existingTags);
      const newSet = new Set(newTags);
      if (existingTags.some((tag: string) => !newSet.has(tag)) || newTags.some((tag: string) => !existingSet.has(tag))) {
        console.log(`角色标签字段 ${field} 内容有变化`);
        return true;
      }
    }
    
    // 如果所有字段都相同，则没有变化
    return false;
  }
}

// 创建角色同步服务实例
export const characterSyncService = new CharacterSyncService();