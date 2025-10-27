// AI使用历史数据服务
import { databaseManager } from '@/services/index'
import { useMembershipStore } from '@/stores/membershipStore'
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore'

// AI使用记录接口
export interface AIUsageRecord {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  type: string // 使用类型：文本生成、情节构思、角色设定等
  model: string // 使用的AI模型
  count: number // 使用次数
  novelId?: string // 关联的小说ID（如果有）
  description?: string // 描述
  createdAt: string // 记录创建时间
}

// AI模型使用统计接口
export interface ModelUsageStat {
  model: string
  totalCount: number
  dailyStats: {
    date: string
    count: number
  }[]
}

class AIUsageHistoryService {
  // 记录AI使用
  async recordAIUsage(
    type: string, 
    model: string, 
    count: number = 1,
    novelId?: string,
    description?: string
  ): Promise<boolean> {
    try {
      const { membershipInfo } = useMembershipStore.getState()
      const userId = membershipInfo.email || 'unknown'
      
      const record: AIUsageRecord = {
        id: `ai_usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        type,
        model,
        count,
        novelId,
        description,
        createdAt: new Date().toISOString()
      }
      
      // 保存到本地数据库
      try {
        await databaseManager.aiUsageHistory.addAIUsageRecord(record)
      } catch (dbError) {
        console.warn('保存AI使用记录到本地数据库失败:', dbError)
        // 即使保存失败，也不应该阻止AI生成功能
      }
      
      // 如果启用了Supabase，也同步到云端
      const supabaseStore = useSupabaseConfigStore.getState();
      const { client, isEnabled } = supabaseStore;
      if (isEnabled && client) {
        try {
          await client
            .from('ai_usage_history')
            .insert({
              id: record.id,
              user_id: record.userId,
              date: record.date,
              type: record.type,
              model: record.model,
              count: record.count,
              novel_id: record.novelId,
              description: record.description,
              created_at: record.createdAt
            })
        } catch (error) {
          console.warn('同步AI使用记录到云端失败:', error)
          // 即使同步失败，也不应该阻止AI生成功能
        }
      }
      
      return true
    } catch (error) {
      console.error('记录AI使用失败:', error)
      // 即使记录失败，也不应该阻止AI生成功能
      return true
    }
  }
  
  // 获取用户的AI使用历史记录
  async getAIUsageHistory(
    userId: string,
    startDate?: string, // YYYY-MM-DD
    endDate?: string,   // YYYY-MM-DD
    limit: number = 100
  ): Promise<AIUsageRecord[]> {
    try {
      // 从本地数据库获取
      const localRecords = await databaseManager.aiUsageHistory.getAIUsageRecords(userId)
      
      // 如果启用了Supabase，从云端获取更多记录
      const supabaseStore = useSupabaseConfigStore.getState();
      const { client, isEnabled } = supabaseStore;
      if (isEnabled && client) {
        try {
          let query = client
            .from('ai_usage_history')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(limit)
          
          if (startDate) {
            query = query.gte('date', startDate)
          }
          
          if (endDate) {
            query = query.lte('date', endDate)
          }
          
          const { data, error } = await query
          
          if (error) {
            console.warn('从云端获取AI使用记录失败:', error)
            // 返回本地记录
            return localRecords
          }
          
          // 合并本地和云端记录，去重
          const allRecords = [...localRecords, ...(data || [])]
          const uniqueRecords = Array.from(
            new Map(allRecords.map(item => [item.id, item])).values()
          )
          
          // 按日期倒序排列
          return uniqueRecords.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        } catch (error) {
          console.warn('从云端获取AI使用记录失败:', error)
          // 返回本地记录
          return localRecords
        }
      }
      
      return localRecords
    } catch (error) {
      console.error('获取AI使用历史记录失败:', error)
      return []
    }
  }
  
  // 获取AI模型使用统计
  async getModelUsageStats(
    userId: string,
    startDate?: string, // YYYY-MM-DD
    endDate?: string    // YYYY-MM-DD
  ): Promise<ModelUsageStat[]> {
    try {
      const records = await this.getAIUsageHistory(userId, startDate, endDate)
      
      // 按模型分组统计
      const modelStatsMap = new Map<string, ModelUsageStat>()
      
      records.forEach(record => {
        if (!modelStatsMap.has(record.model)) {
          modelStatsMap.set(record.model, {
            model: record.model,
            totalCount: 0,
            dailyStats: []
          })
        }
        
        const stat = modelStatsMap.get(record.model)!
        stat.totalCount += record.count
        
        // 按日期统计
        const dailyStat = stat.dailyStats.find(s => s.date === record.date)
        if (dailyStat) {
          dailyStat.count += record.count
        } else {
          stat.dailyStats.push({
            date: record.date,
            count: record.count
          })
        }
      })
      
      // 转换为数组并按总使用次数排序
      return Array.from(modelStatsMap.values())
        .sort((a, b) => b.totalCount - a.totalCount)
    } catch (error) {
      console.error('获取AI模型使用统计失败:', error)
      return []
    }
  }
  
  // 获取用户AI使用统计摘要
  async getAIUsageSummary(
    userId: string,
    startDate?: string, // YYYY-MM-DD
    endDate?: string    // YYYY-MM-DD
  ): Promise<{
    totalUsage: number
    dailyAverage: number
    mostUsedModel: string | null
    mostUsedType: string | null
    usageByType: Record<string, number>
    usageByDate: Record<string, number>
  }> {
    try {
      const records = await this.getAIUsageHistory(userId, startDate, endDate)
      
      let totalUsage = 0
      const usageByType: Record<string, number> = {}
      const usageByDate: Record<string, number> = {}
      const modelUsage: Record<string, number> = {}
      
      records.forEach(record => {
        totalUsage += record.count
        
        // 按类型统计
        usageByType[record.type] = (usageByType[record.type] || 0) + record.count
        
        // 按日期统计
        usageByDate[record.date] = (usageByDate[record.date] || 0) + record.count
        
        // 按模型统计
        modelUsage[record.model] = (modelUsage[record.model] || 0) + record.count
      })
      
      // 计算日均使用量
      const uniqueDates = Object.keys(usageByDate)
      const dailyAverage = uniqueDates.length > 0 ? totalUsage / uniqueDates.length : 0
      
      // 找出使用最多的模型和类型
      const mostUsedModel = Object.keys(modelUsage).sort((a, b) => modelUsage[b] - modelUsage[a])[0] || null
      const mostUsedType = Object.keys(usageByType).sort((a, b) => usageByType[b] - usageByType[a])[0] || null
      
      return {
        totalUsage,
        dailyAverage,
        mostUsedModel,
        mostUsedType,
        usageByType,
        usageByDate
      }
    } catch (error) {
      console.error('获取AI使用统计摘要失败:', error)
      return {
        totalUsage: 0,
        dailyAverage: 0,
        mostUsedModel: null,
        mostUsedType: null,
        usageByType: {},
        usageByDate: {}
      }
    }
  }
}

// 导出AI使用历史服务实例
export default new AIUsageHistoryService()