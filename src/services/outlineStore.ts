import { BaseStore } from './baseStore'
import { NovelOutline } from '#/novel'

/**
 * 大纲存储模块
 */
export class OutlineStore extends BaseStore<NovelOutline> {
  constructor(db: IDBDatabase | null) {
    super(db, 'outlines')
  }

  /**
   * 添加大纲
   */
  async addOutline(outline: Omit<NovelOutline, 'id' | 'createdAt' | 'lastModified'>): Promise<NovelOutline> {
    const newOutline: NovelOutline = {
      ...outline,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
    await this.add(newOutline)
    return newOutline
  }

  /**
   * 更新大纲
   */
  async updateOutline(outline: NovelOutline): Promise<void> {
    console.log('outlineStore.updateOutline 调用:', outline);
    const updatedOutline = {
      ...outline,
      lastModified: new Date().toISOString(),
    }
    await this.update(updatedOutline)
  }

  /**
   * 部分更新大纲（只更新指定的字段）
   */
  async updateOutlinePartial(id: string, updates: Partial<NovelOutline>): Promise<void> {
    // 先获取完整的大纲对象
    const outline = await this.getOutline(id)
    if (!outline) {
      throw new Error(`大纲不存在: ${id}`)
    }

    // 合并更新的字段
    const updatedOutline = {
      ...outline,
      ...updates,
      lastModified: new Date().toISOString(),
    }

    await this.update(updatedOutline)
  }

  /**
   * 批量更新大纲的parentId
   */
  async batchUpdateParentIds(updates: { id: string; parentId: string }[]): Promise<void> {
    // 批量更新多个大纲项目的parentId
    const updatePromises = updates.map(update => 
      this.updateOutlinePartial(update.id, { parentId: update.parentId })
    )
    // 并行执行所有更新操作
    await Promise.all(updatePromises)
  }

  /**
   * 删除大纲
   */
  async deleteOutline(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 获取大纲
   */
  async getOutline(id: string): Promise<NovelOutline | undefined> {
    return this.get(id)
  }

  /**
   * 根据小说ID获取大纲
   */
  async getOutlinesByNovelId(novelId: string): Promise<NovelOutline[]> {
    const outlines = await this.getByIndex('novelId', novelId)
    return outlines.sort((a, b) => a.order - b.order)
  }

  /**
   * 根据类型获取大纲
   */
  async getOutlinesByType(type: NovelOutline['type']): Promise<NovelOutline[]> {
    return this.getByIndex('type', type)
  }

  /**
   * 根据父级ID获取大纲
   */
  async getOutlinesByParentId(parentId: string): Promise<NovelOutline[]> {
    return this.getByIndex('parentId', parentId)
  }

  /**
   * 根据摘要获取大纲
   */
  async getOutlinesBySummary(summary: string): Promise<NovelOutline[]> {
    return this.getByIndex('summary', summary)
  }

  /**
   * 获取大纲数量
   */
  async getOutlineCount(novelId: string): Promise<number> {
    const outlines = await this.getByIndex('novelId', novelId)
    return outlines.length
  }

  /**
   * 获取所有大纲
   */
  async getAllData(): Promise<NovelOutline[]> {
    return this.getAll()
  }
}
