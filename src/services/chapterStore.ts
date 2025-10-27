import { BaseStore } from './baseStore'
import { Chapter } from '#/novel'

/**
 * 章节存储模块
 */
export class ChapterStore extends BaseStore<Chapter> {
  constructor(db: IDBDatabase | null) {
    super(db, 'chapters')
  }

  /**
   * 添加章节
   */
  async addChapter(chapter: Omit<Chapter, 'id' | 'createdAt' | 'lastModified'>): Promise<Chapter> {
    const newChapter: Chapter = {
      ...chapter,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }
    await this.add(newChapter)
    return newChapter
  }

  /**
   * 更新章节
   */
  async updateChapter(chapter: Chapter): Promise<void> {
    const updatedChapter = {
      ...chapter,
      lastModified: new Date().toISOString(),
    }
    await this.update(updatedChapter)
  }

  /**
   * 删除章节
   */
  async deleteChapter(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 获取章节
   */
  async getChapter(id: string): Promise<Chapter | undefined> {
    return this.get(id)
  }

  /**
   * 根据小说ID获取章节
   */
  async getChaptersByNovelId(novelId: string): Promise<Chapter[]> {
    const chapters = await this.getByIndex('novelId', novelId)
    return chapters.sort((a, b) => a.order - b.order)
  }

  /**
   * 根据状态获取章节
   */
  async getChaptersByStatus(status: Chapter['status']): Promise<Chapter[]> {
    return this.getByIndex('status', status)
  }

  /**
   * 获取章节数量
   */
  async getChapterCount(novelId: string): Promise<number> {
    const chapters = await this.getByIndex('novelId', novelId)
    return chapters.length
  }
} 