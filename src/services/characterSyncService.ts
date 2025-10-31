import { Character } from '#/novel'
import { SyncResult } from '@/types/ai-generation'
// 导入标签同步工具函数
import { extractTagsFromAIContent, syncTagsToElement, normalizeTags, areTagsEqual, categorizeTags } from '@/utils/tagSyncUtils'
import worldSettingParserService from '@/services/worldSettingParserService'
import { hybridStorageService } from '@/services/hybridStorageService'

/**
 * 角色同步服务
 * 专门负责角色内容的同步处理
 */
export class CharacterSyncService {
  /**
   * 解析角色内容
   */
  async parseCharacterContent(content: string): Promise<Partial<Character>> {
    return await worldSettingParserService.parseCharacterContent(content);
  }

  /**
   * 同步角色内容
   */
  async syncCharacter(content: string, novelId: string, options?: any): Promise<SyncResult> {
    try {
      // 解析角色内容
      const characterData = await this.parseCharacterContent(content);
      
      // 创建角色对象
      const character: any = {
        novelId: novelId,  // 确保novelId字段正确设置
        name: characterData.name || 'AI生成角色',
        description: characterData.description || content,
        role: characterData.role || 'supporting',
        appearance: characterData.appearance,
        personality: characterData.personality,
        background: characterData.background,
        abilities: characterData.abilities,
        relationships: characterData.relationships,
        characterArc: characterData.characterArc,
        details: characterData.details,
        tags: characterData.tags || [],
        professionTags: characterData.professionTags || [],
        personalityTags: characterData.personalityTags || [],
        functionTags: characterData.functionTags || [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };

      // 验证必要字段
      if (!character.novelId) {
        throw new Error('缺少novelId字段，无法保存角色');
      }

      // 保存角色
      // 确保传递正确的参数给saveWorldElement方法
      await hybridStorageService.saveWorldElement(character, 'character');

      console.log('角色同步完成:', character.name);
      return {
        success: true,
        message: `成功同步角色: ${character.name}`,
        syncedItems: 1,
      };
    } catch (error) {
      console.error('角色同步失败:', error);
      return {
        success: false,
        message: `角色同步失败: ${error instanceof Error ? error.message : String(error)}`,
        errors: [String(error)],
      };
    }
  }

  /**
   * 从文本行中提取值
   */
  private extractValue(line: string): string {
    // 修复：正确处理中文冒号和英文冒号
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

  /**
   * 统一处理换行符
   */
  private normalizeLineBreaks(text: string): string {
    if (!text) return '';
    return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }
}

// 创建角色同步服务实例
export const characterSyncService = new CharacterSyncService();