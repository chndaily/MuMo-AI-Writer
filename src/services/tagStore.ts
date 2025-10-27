import { BaseStore } from './baseStore'
import { NovelTag } from '#/novel'

/**
 * 标签存储模块
 */
export class TagStore extends BaseStore<NovelTag> {
  constructor(db: IDBDatabase | null) {
    super(db, 'tags')
  }

  /**
   * 添加标签
   */
  async addTag(tag: Omit<NovelTag, 'id' | 'createdAt'>): Promise<NovelTag> {
    const newTag: NovelTag = {
      ...tag,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    }
    await this.add(newTag)
    return newTag
  }

  /**
   * 更新标签
   */
  async updateTag(tag: NovelTag): Promise<void> {
    await this.update(tag)
  }

  /**
   * 删除标签
   */
  async deleteTag(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 获取标签
   */
  async getTag(id: string): Promise<NovelTag | undefined> {
    return this.get(id)
  }

  /**
   * 根据名称获取标签
   */
  async getTagByName(name: string): Promise<NovelTag | undefined> {
    const tags = await this.getByIndex('name', name)
    return tags[0]
  }

  /**
   * 获取所有标签
   */
  async getAllTags(): Promise<NovelTag[]> {
    return this.getAll()
  }

  /**
   * 增加标签使用次数
   */
  async incrementTagUsage(tagName: string): Promise<void> {
    const tag = await this.getTagByName(tagName)
    if (tag) {
      await this.update({
        ...tag,
        usageCount: tag.usageCount + 1,
      })
    }
  }

  /**
   * 减少标签使用次数
   */
  async decrementTagUsage(tagName: string): Promise<void> {
    const tag = await this.getTagByName(tagName)
    if (tag && tag.usageCount > 0) {
      await this.update({
        ...tag,
        usageCount: tag.usageCount - 1,
      })
    }
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit: number = 10): Promise<NovelTag[]> {
    const allTags = await this.getAllTags()
    return allTags
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }
} 