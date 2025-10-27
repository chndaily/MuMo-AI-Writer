import { databaseManager } from '@/services/index';
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore';
import { Character } from '#/novel';

/**
 * 角色存储服务
 * 专门负责角色数据的本地和云端存储
 */
export class CharacterStorageService {
  private supabaseStore = useSupabaseConfigStore;

  /**
   * 保存角色
   */
  async saveCharacter(character: Character): Promise<void> {
    // 1. 保存到本地
    await databaseManager.characters.addCharacter(character);
    
    // 2. 同步到云端
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('characters')
          .upsert({
            id: character.id,
            novel_id: character.novelId,
            name: character.name,
            description: character.description,
            role: character.role,
            appearance: character.appearance,
            personality: character.personality,
            background: character.background,
            relationships: character.relationships,
            created_at: character.createdAt,
            last_modified: character.lastModified || character.createdAt
          });
      } catch (error) {
        console.error('同步角色到云端失败:', error);
      }
    }
  }

  /**
   * 更新角色
   */
  async updateCharacter(character: Character): Promise<void> {
    character.lastModified = new Date().toISOString();
    
    await databaseManager.characters.updateCharacter(character);
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('characters')
          .upsert({
            id: character.id,
            novel_id: character.novelId,
            name: character.name,
            description: character.description,
            role: character.role,
            appearance: character.appearance,
            personality: character.personality,
            background: character.background,
            relationships: character.relationships,
            created_at: character.createdAt,
            last_modified: character.lastModified
          });
      } catch (error) {
        console.error('同步角色更新到云端失败:', error);
      }
    }
  }

  /**
   * 删除角色
   */
  async deleteCharacter(characterId: string): Promise<void> {
    await databaseManager.characters.deleteCharacter(characterId);
    
    const { client, isEnabled } = this.supabaseStore.getState();
    if (isEnabled && client) {
      try {
        await client
          .from('characters')
          .delete()
          .eq('id', characterId);
      } catch (error) {
        console.error('删除云端角色失败:', error);
      }
    }
  }

  /**
   * 获取角色列表
   */
  async getCharacters(novelId?: string): Promise<Character[]> {
    // 获取所有角色数据
    const characters: Character[] = [];
    return novelId ? characters.filter(c => c.novelId === novelId) : characters;
  }
}