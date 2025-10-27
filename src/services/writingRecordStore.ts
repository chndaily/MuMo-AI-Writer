import { BaseStore } from './baseStore'
import { WritingRecord } from '#/novel'

/**
 * 写作记录存储模块
 */
export class WritingRecordStore extends BaseStore<WritingRecord> {
  constructor(db: IDBDatabase | null) {
    super(db, 'writingRecords')
  }

  /**
   * 添加写作记录
   */
  async addWritingRecord(record: Omit<WritingRecord, 'id' | 'createdAt' | 'lastModified'>): Promise<void> {
    const now = new Date().toISOString()
    const recordWithId: WritingRecord = {
      id: this.generateId(),
      createdAt: now,
      lastModified: now,
      ...record
    }
    await this.add(recordWithId)
  }

  /**
   * 更新写作记录
   */
  async updateWritingRecord(record: WritingRecord): Promise<void> {
    const updatedRecord = {
      ...record,
      lastModified: new Date().toISOString()
    }
    await this.update(updatedRecord)
  }

  /**
   * 删除写作记录
   */
  async deleteWritingRecord(id: string): Promise<void> {
    await this.delete(id)
  }

  /**
   * 根据ID获取写作记录
   */
  async getWritingRecordById(id: string): Promise<WritingRecord | undefined> {
    return await this.get(id)
  }

  /**
   * 获取指定小说的所有写作记录
   */
  async getWritingRecordsByNovelId(novelId: string): Promise<WritingRecord[]> {
    return await this.getByIndex('novelId', novelId)
  }

  /**
   * 获取指定小说指定类型的写作记录
   */
  async getWritingRecordsByNovelIdAndType(novelId: string, type: WritingRecord['type']): Promise<WritingRecord[]> {
    const allRecords = await this.getByIndex('novelId', novelId)
    return allRecords.filter(record => record.type === type)
  }

  /**
   * 获取指定小说指定状态的写作记录
   */
  async getWritingRecordsByNovelIdAndStatus(novelId: string, status: WritingRecord['status']): Promise<WritingRecord[]> {
    const allRecords = await this.getByIndex('novelId', novelId)
    return allRecords.filter(record => record.status === status)
  }
}