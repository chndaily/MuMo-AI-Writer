import { BaseStore } from './baseStore'
import { NovelGenre } from '#/novel'

/**
 * 小说类型存储模块
 */
export class GenreStore extends BaseStore<NovelGenre> {
  constructor(db: IDBDatabase | null) {
    super(db, 'genres')
  }

  /**
   * 添加类型
   */
  async addGenre(genre: Omit<NovelGenre, 'id' | 'createdAt'>): Promise<NovelGenre> {
    const newGenre: NovelGenre = {
      ...genre,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    }
    await this.add(newGenre)
    return newGenre
  }

  /**
   * 更新类型
   */
  async updateGenre(genre: NovelGenre): Promise<void> {
    await this.update(genre)
  }

  /**
   * 删除类型
   */
  async deleteGenre(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 获取类型
   */
  async getGenre(id: string): Promise<NovelGenre | undefined> {
    return this.get(id)
  }

  /**
   * 根据名称获取类型
   */
  async getGenreByName(name: string): Promise<NovelGenre | undefined> {
    const genres = await this.getByIndex('name', name);
    return genres.length > 0 ? genres[0] : undefined;
  }

  /**
   * 获取所有类型
   */
  async getAllGenres(): Promise<NovelGenre[]> {
    try {
      return await this.getAll();
    } catch (error) {
      console.error('获取所有类型失败:', error);
      return [];
    }
  }

  /**
   * 获取活跃的类型
   */
  async getActiveGenres(): Promise<NovelGenre[]> {
    return this.getByIndex('isActive', true)
  }

  /**
   * 切换类型状态
   */
  async toggleGenreStatus(id: string): Promise<void> {
    const genre = await this.get(id)
    if (genre) {
      await this.update({
        ...genre,
        isActive: !genre.isActive,
      })
    }
  }
} 