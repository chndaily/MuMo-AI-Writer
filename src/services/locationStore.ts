import { BaseStore } from './baseStore'
import { Location } from '#/novel'

/**
 * 地点存储模块
 */
export class LocationStore extends BaseStore<Location> {
  constructor(db: IDBDatabase | null) {
    super(db, 'locations')
  }

  /**
   * 添加地点
   */
  async addLocation(location: Omit<Location, 'id' | 'createdAt' | 'lastModified'>): Promise<Location> {
    const newLocation: Location = {
      ...location,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
    await this.add(newLocation)
    return newLocation
  }

  /**
   * 更新地点
   */
  async updateLocation(location: Location): Promise<void> {
    const updatedLocation = {
      ...location,
      lastModified: new Date().toISOString(),
    }
    await this.update(updatedLocation)
  }

  /**
   * 删除地点
   */
  async deleteLocation(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 获取地点
   */
  async getLocation(id: string): Promise<Location | undefined> {
    return this.get(id)
  }

  /**
   * 根据小说ID获取地点
   */
  async getLocationsByNovelId(novelId: string): Promise<Location[]> {
    return this.getByIndex('novelId', novelId)
  }

  /**
   * 获取所有地点
   */
  async getAllData(): Promise<Location[]> {
    return this.getAll()
  }
}
