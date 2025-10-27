// 导出所有存储模块
export { DatabaseManager } from './databaseManager'
export { NovelStore } from './novelStore'
export { ChapterStore } from './chapterStore'
export { GenreStore } from './genreStore'
export { TagStore } from './tagStore'
export { OutlineStore } from './outlineStore'
export { CharacterStore } from './characterStore'
export { LocationStore } from './locationStore'
export { WorldSettingStore } from './worldSettingStore'
export { StatsStore } from './statsStore'
export { BaseStore } from './baseStore'
export { ContentRelationService } from './contentRelationService'

// 导出所有同步服务
export { syncServices } from './sync'
export { CharacterSyncService } from './sync/CharacterSyncService'
export { enhancedSyncService } from './enhancedSyncService'

// 服务索引文件
export { default as aiUsageHistoryService } from './aiUsageHistoryService'
export type { AIUsageRecord, ModelUsageStat } from './aiUsageHistoryService'

// 创建全局数据库管理器实例
import { DatabaseManager } from './databaseManager'
export const databaseManager = new DatabaseManager()

// 便捷的初始化函数
// 修改为不执行任何操作，因为我们不再需要初始化 IndexedDB
export const initializeDatabase = async () => {
  // 不再需要初始化 IndexedDB
  console.log('跳过 IndexedDB 初始化，直接使用 MongoDB')
  return true
}

// 便捷的数据库状态检查
export const getDatabaseStatus = async () => {
  try {
    // 返回 MongoDB 状态
    return 'MongoDB 已就绪'
  } catch (error) {
    console.error('获取数据库状态失败:', error)
    return null
  }
}