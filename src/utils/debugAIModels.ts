/**
 * 调试AI模型工具函数
 * 用于检查数据库中的AI模型数据
 */

import { databaseManager } from '@/services/index'

/**
 * 打印数据库中的所有AI模型
 */
export const printAllAIModels = async () => {
  try {
    console.log('=== 数据库中的AI模型 ===')
    const models = await databaseManager.aiModels.getAllAIModels()
    console.log(`总共找到 ${models.length} 个模型:`)
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`)
      console.log(`   ID: ${model.id}`)
      console.log(`   Connection ID: ${model.connectionId}`)
      console.log(`   Provider: ${model.provider}`)
      console.log(`   Is Default: ${model.isDefault}`)
      console.log(`   Description: ${model.description}`)
      console.log('   ---')
    })
  } catch (error) {
    console.error('打印AI模型时出错:', error)
  }
}

/**
 * 检查默认模型
 */
export const checkDefaultModels = async () => {
  try {
    console.log('=== 默认AI模型 ===')
    const defaultModels = await databaseManager.aiModels.getDefaultAIModels()
    console.log(`找到 ${defaultModels.length} 个默认模型:`)
    defaultModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} (${model.id})`)
    })
  } catch (error) {
    console.error('检查默认模型时出错:', error)
  }
}

/**
 * 清空所有AI模型（仅用于调试）
 */
export const clearAllAIModels = async () => {
  try {
    console.log('=== 清空所有AI模型 ===')
    const models = await databaseManager.aiModels.getAllAIModels()
    for (const model of models) {
      await databaseManager.aiModels.deleteAIModel(model.id)
      console.log(`已删除模型: ${model.name}`)
    }
    console.log('所有AI模型已清空')
  } catch (error) {
    console.error('清空AI模型时出错:', error)
  }
}