import { BaseStore } from './baseStore'
import { ChapterVersion } from '#/novel'

/**
 * 章节版本历史存储模块
 */
export class ChapterVersionStore extends BaseStore<ChapterVersion> {
  constructor(db: IDBDatabase | null) {
    super(db, 'chapterVersions')
  }

  /**
   * 添加章节版本
   */
  async addChapterVersion(version: Omit<ChapterVersion, 'id' | 'createdAt'>): Promise<ChapterVersion> {
    const newVersion: ChapterVersion = {
      ...version,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    }
    await this.add(newVersion)
    return newVersion
  }

  /**
   * 更新章节版本
   */
  async updateChapterVersion(version: ChapterVersion): Promise<void> {
    await this.update(version)
  }

  /**
   * 删除章节版本
   */
  async deleteChapterVersion(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 获取章节版本
   */
  async getChapterVersion(id: string): Promise<ChapterVersion | undefined> {
    return this.get(id)
  }

  /**
   * 根据章节ID获取所有版本
   */
  async getVersionsByChapterId(chapterId: string): Promise<ChapterVersion[]> {
    const versions = await this.getByIndex('chapterId', chapterId)
    return versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  /**
   * 根据章节ID获取最新版本
   */
  async getLatestVersionByChapterId(chapterId: string): Promise<ChapterVersion | undefined> {
    const versions = await this.getVersionsByChapterId(chapterId)
    return versions.length > 0 ? versions[0] : undefined
  }

  /**
   * 删除章节的所有版本
   */
  async deleteVersionsByChapterId(chapterId: string): Promise<void> {
    const versions = await this.getVersionsByChapterId(chapterId)
    const deletePromises = versions.map(version => this.delete(version.id))
    await Promise.all(deletePromises)
  }
}