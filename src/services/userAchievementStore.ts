import { BaseStore } from './baseStore'

// 用户成就数据接口
export interface UserAchievementData {
  id: string
  userId: string
  achievedAchievements: string[] // 已达成的成就ID列表
  achievementDates: Record<string, string> // 成就达成日期记录
  novelCount: number // 创建的小说数量
  wordCount: number // 累计字数
  aiUsageCount: number // AI使用次数
  consecutiveDays: number // 连续创作天数
  completedNovels: number // 完成的小说数量
  reviews: number // 获得的评价数量
  reads: number // 作品被阅读次数
  createdAt: string
  updatedAt: string
}

// 用户活动数据接口
export interface UserActivity {
  id: string
  userId: string
  icon: string
  title: string
  description: string
  time: string
  novelId?: string
  createdAt: string
}

/**
 * 用户成就存储模块
 */
export class UserAchievementStore extends BaseStore<UserAchievementData> {
  constructor(db: IDBDatabase | null) {
    super(db, 'userAchievements')
  }
  
  /**
   * 根据用户ID获取成就数据
   */
  async getByUserId(userId: string): Promise<UserAchievementData[]> {
    return this.getByIndex('userId', userId)
  }
  
  /**
   * 添加用户成就数据
   */
  async addUserAchievement(data: UserAchievementData): Promise<void> {
    await this.add(data)
  }
  
  /**
   * 更新用户成就数据
   */
  async updateUserAchievement(data: UserAchievementData): Promise<void> {
    await this.update(data)
  }
}

/**
 * 用户活动存储模块
 */
export class UserActivityStore extends BaseStore<UserActivity> {
  constructor(db: IDBDatabase | null) {
    super(db, 'userActivities')
  }
  
  /**
   * 根据用户ID获取活动数据
   */
  async getByUserId(userId: string): Promise<UserActivity[]> {
    return this.getByIndex('userId', userId)
  }
  
  /**
   * 添加用户活动数据
   */
  async addUserActivity(data: UserActivity): Promise<void> {
    await this.add(data)
  }
  
  /**
   * 更新用户活动数据
   */
  async updateUserActivity(data: UserActivity): Promise<void> {
    await this.update(data)
  }
}