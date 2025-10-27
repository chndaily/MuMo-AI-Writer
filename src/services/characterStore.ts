import { BaseStore } from './baseStore'
import { Character } from '#/novel'

/**
 * 角色存储模块
 */
export class CharacterStore extends BaseStore<Character> {
  constructor(db: IDBDatabase | null) {
    super(db, 'characters')
  }

  /**
   * 添加角色
   */
  async addCharacter(character: Omit<Character, 'id' | 'createdAt' | 'lastModified'>): Promise<Character> {
    const newCharacter: Character = {
      ...character,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
    await this.add(newCharacter)
    return newCharacter
  }

  /**
   * 更新角色
   */
  async updateCharacter(character: Character): Promise<void> {
    const updatedCharacter = {
      ...character,
      lastModified: new Date().toISOString(),
    }
    await this.update(updatedCharacter)
  }

  /**
   * 删除角色
   */
  async deleteCharacter(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 获取角色
   */
  async getCharacter(id: string): Promise<Character | undefined> {
    return this.get(id)
  }

  /**
   * 根据小说ID获取角色
   */
  async getCharactersByNovelId(novelId: string): Promise<Character[]> {
    return this.getByIndex('novelId', novelId)
  }

  /**
   * 获取所有角色
   */
  async getAllData(): Promise<Character[]> {
    return this.getAll()
  }
}
