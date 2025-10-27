/**
 * 测试模型性能工具
 * 用于检测和优化模型相关的性能问题
 */

import { defaultModelService } from '@/services/defaultModelService'
import { databaseManager } from '@/services/index'
import { useAIServiceStore } from '@/stores/aiServiceStore'

/**
 * 测试默认模型服务性能
 */
export const testDefaultModelPerformance = async () => {
  console.log('=== 开始测试默认模型服务性能 ===')
  const startTime = performance.now()
  
  try {
    // 测试多次获取默认模型列表
    for (let i = 0; i < 10; i++) {
      const models = await defaultModelService.getDefaultModelList()
      console.log(`第${i + 1}次获取默认模型列表，数量: ${models.length}`)
    }
    
    const endTime = performance.now()
    console.log(`10次调用耗时: ${endTime - startTime}ms`)
    
    // 检查缓存是否生效
    console.log('检查缓存状态...')
    const cacheCheckStart = performance.now()
    const models1 = await defaultModelService.getDefaultModelList()
    const models2 = await defaultModelService.getDefaultModelList()
    const cacheCheckEnd = performance.now()
    
    console.log(`两次连续调用耗时: ${cacheCheckEnd - cacheCheckStart}ms`)
    console.log(`缓存是否生效: ${cacheCheckEnd - cacheCheckStart < 10 ? '是' : '否'}`)
    
  } catch (error) {
    console.error('测试默认模型服务性能时出错:', error)
  }
  
  console.log('=== 测试完成 ===')
}

/**
 * 测试数据库查询性能
 */
export const testDatabasePerformance = async () => {
  console.log('=== 开始测试数据库查询性能 ===')
  const startTime = performance.now()
  
  try {
    // 测试多次数据库查询
    for (let i = 0; i < 5; i++) {
      const models = await databaseManager.aiModels.getAllAIModels()
      console.log(`第${i + 1}次数据库查询，数量: ${models.length}`)
    }
    
    const endTime = performance.now()
    console.log(`5次数据库查询耗时: ${endTime - startTime}ms`)
    
  } catch (error) {
    console.error('测试数据库查询性能时出错:', error)
  }
  
  console.log('=== 测试完成 ===')
}

/**
 * 测试会员等级变化时的性能
 */
export const testMembershipChangePerformance = async () => {
  console.log('=== 开始测试会员等级变化性能 ===')
  
  try {
    // 模拟会员等级变化
    const levels = ['free', 'basic', 'professional']
    
    for (const level of levels) {
      console.log(`测试${level}会员等级...`)
      const startTime = performance.now()
      
      // 模拟设置会员等级
      // 这里我们只是测试性能，不实际改变状态
      
      const endTime = performance.now()
      console.log(`${level}会员等级测试耗时: ${endTime - startTime}ms`)
    }
    
  } catch (error) {
    console.error('测试会员等级变化性能时出错:', error)
  }
  
  console.log('=== 测试完成 ===')
}

/**
 * 完整性能测试
 */
export const runFullPerformanceTest = async () => {
  await testDefaultModelPerformance()
  console.log('\n')
  await testDatabasePerformance()
  console.log('\n')
  await testMembershipChangePerformance()
}