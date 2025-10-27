/**
 * 检查模型数据工具
 * 用于检查数据库中的模型数据
 */

import { databaseManager } from '@/services/index'

export const checkDatabaseModels = async () => {
  try {
    console.log('=== 检查数据库中的AI模型 ===')
    const models = await databaseManager.aiModels.getAllAIModels()
    console.log(`总共找到 ${models.length} 个模型:`)
    
    if (models.length === 0) {
      console.log('数据库中没有模型数据')
      return
    }
    
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`)
      console.log(`   ID: ${model.id}`)
      console.log(`   Connection ID: ${model.connectionId}`)
      console.log(`   Provider: ${model.provider}`)
      console.log(`   Is Default: ${model.isDefault}`)
      console.log(`   Description: ${model.description}`)
      console.log('   ---')
    })
    
    // 检查默认模型
    console.log('=== 检查默认模型 ===')
    const defaultModels = await databaseManager.aiModels.getDefaultAIModels()
    console.log(`找到 ${defaultModels.length} 个默认模型:`)
    defaultModels.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} (${model.id})`)
    })
    
  } catch (error) {
    console.error('检查模型数据时出错:', error)
  }
}

// 如果直接运行此文件，则执行检查
if (require.main === module) {
  checkDatabaseModels().then(() => {
    console.log('检查完成')
  }).catch((error) => {
    console.error('检查失败:', error)
  })
}