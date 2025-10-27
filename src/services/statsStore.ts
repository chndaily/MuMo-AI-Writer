import { BaseStore } from './baseStore'
import { WritingStats } from '#/novel'

/**
 * 扩展的统计信息类型，包含数据库所需的id字段
 */
interface WritingStatsWithId extends WritingStats {
  id: string
}

/**
 * 统计信息存储模块
 */
export class StatsStore extends BaseStore<WritingStatsWithId> {
  constructor(db: IDBDatabase | null) {
    super(db, 'stats')
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<WritingStats | undefined> {
    const stats = await this.get('default')
    if (stats) {
      // 移除id字段，返回原始的WritingStats类型
      const { id, ...writingStats } = stats
      return writingStats
    }
    return undefined
  }

  /**
   * 更新统计信息
   */
  async updateStats(stats: WritingStats): Promise<void> {
    await this.update({ ...stats, id: 'default' })
  }

  /**
   * 更新部分统计信息
   */
  async updatePartialStats(updates: Partial<WritingStats>): Promise<void> {
    const currentStats = await this.get('default')
    if (currentStats) {
      const { id, ...writingStats } = currentStats
      await this.update({ ...writingStats, ...updates, id: 'default' })
    } else {
      // 如果没有现有统计信息，创建默认的
      const defaultStats: WritingStatsWithId = {
        id: 'default',
        totalWords: 0,
        totalNovels: 0,
        averageWordsPerNovel: 0,
        writingStreak: 0,
        totalWritingTime: 0,
        completedNovels: 0,
        dailyGoal: 1000,
        weeklyGoal: 7000,
        monthlyGoal: 30000,
        ...updates,
      }
      await this.add(defaultStats)
    }
  }

  /**
   * 增加字数统计
   */
  async addWords(wordCount: number): Promise<void> {
    const currentStats = await this.get('default')
    if (currentStats) {
      const { id, ...writingStats } = currentStats
      await this.update({
        ...writingStats,
        totalWords: writingStats.totalWords + wordCount,
        id: 'default',
      })
    }
  }

  /**
   * 增加小说数量
   */
  async incrementNovelCount(): Promise<void> {
    const currentStats = await this.get('default')
    if (currentStats) {
      const { id, ...writingStats } = currentStats
      await this.update({
        ...writingStats,
        totalNovels: writingStats.totalNovels + 1,
        id: 'default',
      })
    }
  }

  /**
   * 减少小说数量
   */
  async decrementNovelCount(): Promise<void> {
    const currentStats = await this.get('default')
    if (currentStats) {
      const { id, ...writingStats } = currentStats
      await this.update({
        ...writingStats,
        totalNovels: Math.max(0, writingStats.totalNovels - 1),
        id: 'default',
      })
    }
  }

  /**
   * 更新写作目标
   */
  async updateGoals(goals: {
    dailyGoal?: number
    weeklyGoal?: number
    monthlyGoal?: number
  }): Promise<void> {
    await this.updatePartialStats(goals)
  }

  /**
   * 重置统计信息
   */
  async resetStats(): Promise<void> {
    const defaultStats: WritingStatsWithId = {
      id: 'default',
      totalWords: 0,
      totalNovels: 0,
      averageWordsPerNovel: 0,
      writingStreak: 0,
      totalWritingTime: 0,
      completedNovels: 0,
      dailyGoal: 1000,
      weeklyGoal: 7000,
      monthlyGoal: 30000,
    }
    await this.update(defaultStats)
  }
} 