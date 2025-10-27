import { BaseStore } from './baseStore'
import { WorldSetting } from '#/novel'

/**
 * 世界观设定存储模块
 */
export class WorldSettingStore extends BaseStore<WorldSetting> {
  constructor(db: IDBDatabase | null, storeName: string) {
    super(db, storeName)
  }

  /**
   * 添加世界观设定
   */
  async addWorldSetting(setting: Omit<WorldSetting, 'id' | 'createdAt' | 'lastModified'>): Promise<WorldSetting> {
    const newSetting: WorldSetting = {
      ...setting,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
    await this.add(newSetting)
    return newSetting
  }

  /**
   * 更新世界观设定
   */
  async updateWorldSetting(setting: WorldSetting): Promise<void> {
    const updatedSetting = {
      ...setting,
      lastModified: new Date().toISOString(),
    }
    await this.update(updatedSetting)
  }

  /**
   * 删除世界观设定
   */
  async deleteWorldSetting(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 获取世界观设定
   */
  async getWorldSetting(id: string): Promise<WorldSetting | undefined> {
    return this.get(id)
  }

  /**
   * 根据小说ID获取世界观设定
   */
  async getWorldSettingsByNovelId(novelId: string): Promise<WorldSetting[]> {
    try {
      console.log(`获取小说 ${novelId} 的世界观设定，存储: ${this.storeName}`);
      const result = await this.getByIndex('novelId', novelId);
      console.log(`从 ${this.storeName} 获取到 ${result.length} 个设定`);
      return result;
    } catch (error) {
      console.error(`从 ${this.storeName} 获取世界观设定失败:`, error);
      throw new Error(`获取世界观设定失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 根据类型获取世界观设定
   */
  async getWorldSettingsByType(type: WorldSetting['type']): Promise<WorldSetting[]> {
    return this.getByIndex('type', type)
  }

  /**
   * 获取世界观设定数量
   */
  async getWorldSettingCount(novelId: string): Promise<number> {
    const settings = await this.getByIndex('novelId', novelId)
    return settings.length
  }

  /**
   * 搜索世界观设定
   */
  async searchWorldSettings(keyword: string, novelId?: string): Promise<WorldSetting[]> {
    let settings = novelId
      ? await this.getWorldSettingsByNovelId(novelId)
      : await this.getAll()

    if (keyword) {
      const searchTerm = keyword.toLowerCase()
      settings = settings.filter(setting =>
        setting.name.toLowerCase().includes(searchTerm) ||
        setting.description?.toLowerCase().includes(searchTerm) ||
        setting.type.toLowerCase().includes(searchTerm)
      )
    }

    return settings
  }

  /**
   * 获取所有世界观设定
   */
  async getAllData(): Promise<WorldSetting[]> {
    return this.getAll()
  }
}