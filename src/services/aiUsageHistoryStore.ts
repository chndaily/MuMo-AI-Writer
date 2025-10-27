import { BaseStore } from './baseStore'
import { AIUsageRecord } from './aiUsageHistoryService'

/**
 * AI使用历史记录存储模块
 */
export class AIUsageHistoryStore extends BaseStore<AIUsageRecord> {
  constructor(db: IDBDatabase | null) {
    super(db, 'aiUsageHistory')
  }

  /**
   * 添加AI使用记录
   */
  async addRecord(record: AIUsageRecord): Promise<void> {
    await this.add(record)
  }

  /**
   * 更新AI使用记录
   */
  async updateRecord(record: AIUsageRecord): Promise<void> {
    await this.update(record)
  }

  /**
   * 删除AI使用记录
   */
  async deleteRecord(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 根据ID获取AI使用记录
   */
  async getRecordById(id: string): Promise<AIUsageRecord | undefined> {
    return await this.get(id)
  }

  /**
   * 获取指定用户的所有AI使用记录
   */
  async getRecordsByUserId(userId: string): Promise<AIUsageRecord[]> {
    return await this.getByIndex('userId', userId)
  }

  /**
   * 获取指定用户在指定日期范围内的AI使用记录
   */
  async getRecords(
    userId: string, 
    startDate?: string, 
    endDate?: string, 
    limit: number = 100
  ): Promise<AIUsageRecord[]> {
    let records = await this.getByIndex('userId', userId)
    
    // 按日期过滤
    if (startDate) {
      records = records.filter(record => record.date >= startDate)
    }
    
    if (endDate) {
      records = records.filter(record => record.date <= endDate)
    }
    
    // 按日期倒序排列
    records = records.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    // 限制返回数量
    if (limit > 0) {
      records = records.slice(0, limit)
    }
    
    return records
  }

  /**
   * 获取指定日期的AI使用记录
   */
  async getRecordsByDate(date: string): Promise<AIUsageRecord[]> {
    return await this.getByIndex('date', date)
  }

  /**
   * 获取指定AI模型的使用记录
   */
  async getRecordsByModel(model: string): Promise<AIUsageRecord[]> {
    return await this.getByIndex('model', model)
  }

  /**
   * 获取指定使用类型的记录
   */
  async getRecordsByType(type: string): Promise<AIUsageRecord[]> {
    return await this.getByIndex('type', type)
  }
}