// 成就服务
import { databaseManager } from '@/services/index'
import { useMembershipStore } from '@/stores/membershipStore'
import { UserAchievementData, UserActivity } from './userAchievementStore'

// 成就接口
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string // 图标名称
  achieved: boolean
  date?: string // 达成日期
  points: number
  level: string
  criteria: {
    type: 'novelCount' | 'wordCount' | 'aiUsage' | 'consecutiveDays' | 'completedNovels' | 'reviews' | 'reads'
    value: number
  }
}

// 活动接口
export interface Activity {
  id: string
  icon: string
  title: string
  description: string
  time: string
  novelId?: string
}

class AchievementService {
  // 预定义的成就列表
  private achievements: Achievement[] = [
    {
      id: '1',
      title: '初出茅庐',
      description: '创建第一本小说',
      icon: 'BookOutlined',
      achieved: false,
      points: 10,
      level: '入门',
      criteria: {
        type: 'novelCount',
        value: 1
      }
    },
    {
      id: '2',
      title: '坚持不懈',
      description: '连续7天创作',
      icon: 'EditOutlined',
      achieved: false,
      points: 50,
      level: '入门',
      criteria: {
        type: 'consecutiveDays',
        value: 7
      }
    },
    {
      id: '3',
      title: '万字作家',
      description: '累计创作10000字',
      icon: 'EditOutlined',
      achieved: false,
      points: 100,
      level: '进阶',
      criteria: {
        type: 'wordCount',
        value: 10000
      }
    },
    {
      id: '4',
      title: 'AI达人',
      description: '使用AI生成100次',
      icon: 'RobotOutlined',
      achieved: false,
      points: 80,
      level: '进阶',
      criteria: {
        type: 'aiUsage',
        value: 100
      }
    },
    {
      id: '5',
      title: '创作先锋',
      description: '完成第一本小说',
      icon: 'RocketOutlined',
      achieved: false,
      points: 200,
      level: '专家',
      criteria: {
        type: 'completedNovels',
        value: 1
      }
    },
    {
      id: '6',
      title: '五星好评',
      description: '获得5个五星评价',
      icon: 'StarOutlined',
      achieved: false,
      points: 150,
      level: '专家',
      criteria: {
        type: 'reviews',
        value: 5
      }
    },
    {
      id: '7',
      title: '热门作家',
      description: '作品被阅读1000次',
      icon: 'FireOutlined',
      achieved: false,
      points: 300,
      level: '大师',
      criteria: {
        type: 'reads',
        value: 1000
      }
    },
    {
      id: '8',
      title: '创作大师',
      description: '累计创作100000字',
      icon: 'CrownOutlined',
      achieved: false,
      points: 500,
      level: '宗师',
      criteria: {
        type: 'wordCount',
        value: 100000
      }
    }
  ]

  // 检查成就是否达成
  async checkAchievements(): Promise<Achievement[]> {
    try {
      const { membershipInfo } = useMembershipStore.getState()
      const userId = membershipInfo.email || 'unknown'
      
      // 获取用户数据
      const userData = await this.getUserData(userId)
      
      // 检查每个成就是否达成
      const updatedAchievements = this.achievements.map(achievement => {
        // 检查成就是否已经达成
        if (userData.achievedAchievements.includes(achievement.id)) {
          return {
            ...achievement,
            achieved: true,
            date: userData.achievementDates[achievement.id] || new Date().toISOString().split('T')[0]
          }
        }
        
        // 检查是否满足达成条件
        const isAchieved = this.checkAchievementCriteria(achievement, userData)
        if (isAchieved) {
          // 记录新达成的成就
          this.recordAchievement(userId, achievement.id)
        }
        
        return {
          ...achievement,
          achieved: isAchieved,
          date: isAchieved ? new Date().toISOString().split('T')[0] : undefined
        }
      })
      
      return updatedAchievements
    } catch (error) {
      console.error('检查成就失败:', error)
      return this.achievements
    }
  }
  
  // 获取用户数据
  private async getUserData(userId: string) {
    try {
      // 从本地数据库获取用户成就数据
      const userAchievements = await databaseManager.userAchievements.getByUserId(userId)
      const userData = userAchievements[0] || {
        id: `user_achievements_${userId}`,
        userId,
        achievedAchievements: [],
        achievementDates: {},
        novelCount: 0,
        wordCount: 0,
        aiUsageCount: 0,
        consecutiveDays: 0,
        completedNovels: 0,
        reviews: 0,
        reads: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      return userData
    } catch (error) {
      console.error('获取用户数据失败:', error)
      return {
        id: `user_achievements_${userId}`,
        userId,
        achievedAchievements: [],
        achievementDates: {},
        novelCount: 0,
        wordCount: 0,
        aiUsageCount: 0,
        consecutiveDays: 0,
        completedNovels: 0,
        reviews: 0,
        reads: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  }
  
  // 检查成就条件
  private checkAchievementCriteria(achievement: Achievement, userData: UserAchievementData): boolean {
    switch (achievement.criteria.type) {
      case 'novelCount':
        return userData.novelCount >= achievement.criteria.value
      case 'wordCount':
        return userData.wordCount >= achievement.criteria.value
      case 'aiUsage':
        return userData.aiUsageCount >= achievement.criteria.value
      case 'consecutiveDays':
        return userData.consecutiveDays >= achievement.criteria.value
      case 'completedNovels':
        return userData.completedNovels >= achievement.criteria.value
      case 'reviews':
        return userData.reviews >= achievement.criteria.value
      case 'reads':
        return userData.reads >= achievement.criteria.value
      default:
        return false
    }
  }
  
  // 记录成就
  private async recordAchievement(userId: string, achievementId: string) {
    try {
      // 获取现有用户数据
      const userAchievements = await databaseManager.userAchievements.getByUserId(userId)
      let userData = userAchievements[0]
      
      if (!userData) {
        // 创建新用户数据
        userData = {
          id: `user_achievements_${userId}`,
          userId,
          achievedAchievements: [achievementId],
          achievementDates: {
            [achievementId]: new Date().toISOString().split('T')[0]
          },
          novelCount: 0,
          wordCount: 0,
          aiUsageCount: 0,
          consecutiveDays: 0,
          completedNovels: 0,
          reviews: 0,
          reads: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        await databaseManager.userAchievements.addUserAchievement(userData)
      } else {
        // 更新现有用户数据
        if (!userData.achievedAchievements.includes(achievementId)) {
          userData.achievedAchievements.push(achievementId)
          userData.achievementDates = {
            ...userData.achievementDates,
            [achievementId]: new Date().toISOString().split('T')[0]
          }
          userData.updatedAt = new Date().toISOString()
          await databaseManager.userAchievements.updateUserAchievement(userData)
        }
      }
    } catch (error) {
      console.error('记录成就失败:', error)
    }
  }
  
  // 获取近期活动
  async getRecentActivities(userId: string): Promise<Activity[]> {
    try {
      // 从本地数据库获取用户活动
      const activities = await databaseManager.userActivities.getByUserId(userId)
      
      // 按时间倒序排列，取最近的10条
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10)
    } catch (error) {
      console.error('获取近期活动失败:', error)
      return []
    }
  }
  
  // 记录活动
  async recordActivity(activity: Omit<Activity, 'id'> & { userId: string }) {
    try {
      const newActivity: UserActivity = {
        ...activity,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      }
      
      await databaseManager.userActivities.addUserActivity(newActivity)
    } catch (error) {
      console.error('记录活动失败:', error)
    }
  }
}

// 导出成就服务实例
export default new AchievementService()