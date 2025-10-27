import { databaseManager } from '@/services'
import { Novel, Character, Location, NovelOutline } from '#/novel'

/**
 * 内容关联管理服务
 * 用于管理小说创作中各种元素之间的关联关系
 */
export class ContentRelationService {
  /**
   * 查找内容中的引用关系
   */
  async findReferences(novelId: string, content: string): Promise<{
    characters: Character[],
    locations: Location[],
    outlines: NovelOutline[]
  }> {
    try {
      // 获取小说相关数据
      const characters = await databaseManager.characters.getCharactersByNovelId(novelId) || []
      const locations = await databaseManager.locations.getLocationsByNovelId(novelId) || []
      const outlines = await databaseManager.outlines.getOutlinesByNovelId(novelId) || []
      
      // 查找引用的角色
      const referencedCharacters = characters.filter(character => {
        // 对于中文文本，使用包含匹配而不是单词边界匹配
        const namePattern = new RegExp(this.escapeRegExp(character.name), 'i')
        return namePattern.test(content)
      })
      
      // 查找引用的地点
      const referencedLocations = locations.filter(location => {
        // 对于中文文本，使用包含匹配而不是单词边界匹配
        const namePattern = new RegExp(this.escapeRegExp(location.name), 'i')
        return namePattern.test(content)
      })
      
      return {
        characters: referencedCharacters,
        locations: referencedLocations,
        outlines: [] // 大纲引用需要更复杂的逻辑来确定
      }
    } catch (error) {
      console.error('查找引用关系失败:', error)
      return {
        characters: [],
        locations: [],
        outlines: []
      }
    }
  }
  
  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  
  /**
   * 检查角色一致性
   */
  async checkCharacterConsistency(novelId: string, characterData: Partial<Character>): Promise<{
    isValid: boolean,
    issues: string[]
  }> {
    const issues: string[] = []
    
    try {
      // 获取现有角色
      const existingCharacters = await databaseManager.characters.getCharactersByNovelId(novelId) || []
      
      // 检查名称重复
      const duplicateName = existingCharacters.find(
        c => c.name === characterData.name && c.id !== characterData.id
      )
      
      if (duplicateName) {
        issues.push(`角色名称"${characterData.name}"已存在`)
      }
      
      // 检查必填字段
      if (!characterData.name) {
        issues.push('角色名称不能为空')
      }
      
      return {
        isValid: issues.length === 0,
        issues
      }
    } catch (error) {
      console.error('角色一致性检查失败:', error)
      return {
        isValid: false,
        issues: [`角色一致性检查失败: ${error instanceof Error ? error.message : '未知错误'}`]
      }
    }
  }
  
  /**
   * 检查地点一致性
   */
  async checkLocationConsistency(novelId: string, locationData: Partial<Location>): Promise<{
    isValid: boolean,
    issues: string[]
  }> {
    const issues: string[] = []
    
    try {
      // 获取现有地点
      const existingLocations = await databaseManager.locations.getLocationsByNovelId(novelId) || []
      
      // 检查名称重复
      const duplicateName = existingLocations.find(
        l => l.name === locationData.name && l.id !== locationData.id
      )
      
      if (duplicateName) {
        issues.push(`地点名称"${locationData.name}"已存在`)
      }
      
      // 检查必填字段
      if (!locationData.name) {
        issues.push('地点名称不能为空')
      }
      
      return {
        isValid: issues.length === 0,
        issues
      }
    } catch (error) {
      console.error('地点一致性检查失败:', error)
      return {
        isValid: false,
        issues: [`地点一致性检查失败: ${error instanceof Error ? error.message : '未知错误'}`]
      }
    }
  }
  
  /**
   * 建立元素间的关联关系
   */
  async establishRelations(novelId: string, elementId: string, elementType: string, relatedElementIds: string[]): Promise<void> {
    try {
      console.log(`建立${elementType}元素${elementId}与以下元素的关联关系:`, relatedElementIds)
      // 这里可以实现具体的关联关系存储逻辑
      // 例如：在数据库中创建关联记录表
    } catch (error) {
      console.error('建立关联关系失败:', error)
    }
  }
  
  /**
   * 获取元素的关联关系
   */
  async getRelations(novelId: string, elementId: string, elementType: string): Promise<{
    characters: Character[],
    locations: Location[],
    outlines: NovelOutline[]
  }> {
    try {
      // 这里可以实现具体的关联关系查询逻辑
      // 例如：从数据库中查询关联记录表
      console.log(`获取${elementType}元素${elementId}的关联关系`)
      
      return {
        characters: [],
        locations: [],
        outlines: []
      }
    } catch (error) {
      console.error('获取关联关系失败:', error)
      return {
        characters: [],
        locations: [],
        outlines: []
      }
    }
  }
}

// 创建内容关联管理服务实例
export const contentRelationService = new ContentRelationService()