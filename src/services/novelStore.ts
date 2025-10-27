import { BaseStore } from './baseStore'
import { Novel } from '#/novel'

/**
 * 小说存储模块
 */
export class NovelStore extends BaseStore<Novel> {
  constructor(db: IDBDatabase | null) {
    super(db, 'novels')
  }

  /**
   * 添加小说
   */
  async addNovel(novel: Omit<Novel, 'id' | 'createdAt' | 'lastModified'>): Promise<Novel> {
    const newNovel: Novel = {
      ...novel,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
    await this.add(newNovel)
    return newNovel
  }

  /**
   * 更新小说
   */
  async updateNovel(novel: Novel): Promise<void> {
    const updatedNovel = {
      ...novel,
      lastModified: new Date().toISOString(),
    }
    await this.update(updatedNovel)
  }

  /**
   * 删除小说
   */
  async deleteNovel(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 获取小说
   */
  async getNovel(id: string): Promise<Novel | undefined> {
    return this.get(id)
  }

  /**
   * 获取所有小说
   */
  async getAllNovels(): Promise<Novel[]> {
    return this.getAllData()
  }

  /**
   * 根据用户ID获取小说
   */
  async getNovelsByUserId(userId: string): Promise<Novel[]> {
    return this.getByIndex('userId', userId)
  }

  /**
   * 根据类型获取小说
   */
  async getNovelsByGenre(genre: string): Promise<Novel[]> {
    return this.getByIndex('genre', genre)
  }

  /**
   * 根据状态获取小说
   */
  async getNovelsByStatus(status: Novel['status']): Promise<Novel[]> {
    return this.getByIndex('status', status)
  }

  /**
   * 搜索小说
   */
  async searchNovels(filters: {
    keyword?: string
    genre?: string
    status?: string
    tags?: string[]
    userId?: string
  }): Promise<Novel[]> {
    const allNovels = await this.getAllNovels()

    return allNovels.filter(novel => {
      // 用户ID过滤
      if (filters.userId && novel.userId !== filters.userId) {
        return false
      }

      // 关键词搜索
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const matchesKeyword =
          novel.title.toLowerCase().includes(keyword) ||
          novel.description?.toLowerCase().includes(keyword) ||
          novel.content.toLowerCase().includes(keyword)
        if (!matchesKeyword) return false
      }

      // 类型过滤
      if (filters.genre && novel.genre !== filters.genre) {
        return false
      }

      // 状态过滤
      if (filters.status && novel.status !== filters.status) {
        return false
      }

      // 标签过滤
      if (filters.tags && filters.tags.length > 0) {
        const novelTags = novel.tags || []
        const hasMatchingTag = filters.tags.some(tag => novelTags.includes(tag))
        if (!hasMatchingTag) return false
      }

      return true
    })
  }
}