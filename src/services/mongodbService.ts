// MongoDB数据库服务（浏览器环境使用API服务）
import { 
  Novel, 
  Chapter, 
  NovelGenre, 
  NovelTag, 
  NovelOutline, 
  Character, 
  Location, 
  WorldSetting, 
  WritingStats, 
  ChapterVersion, 
  WritingRecord 
} from '#/novel'
import { User } from '@/services/realAuthService'
import { MembershipInfo } from '@/stores/membershipStore'
import { apiService } from '@/services/apiService'
import { AIModelRecord } from './aiModelStore'

// 浏览器环境不直接连接MongoDB，而是使用API服务
// 这些函数现在是API服务的包装器

// 用户文档接口（与MongoDB存储结构对应）
export interface UserDocument {
  _id: string
  email: string
  username: string
  passwordHash: string
  createdAt: Date
  lastLoginAt: Date | null
  membershipInfo: MembershipInfo & {
    expiryDate: Date | null
  }
  // 邮箱验证相关字段
  isEmailVerified: boolean
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  // 密码重置相关字段
  passwordResetToken?: string
  passwordResetExpires?: Date
}

// 小说文档接口
export interface NovelDocument extends Omit<Novel, 'id' | 'createdAt' | 'lastModified'> {
  _id: string
  createdAt: Date
  lastModified: Date
  // 确保包含用户ID字段
  userId?: string
}

// 章节文档接口
export interface ChapterDocument extends Omit<Chapter, 'id' | 'createdAt' | 'lastModified'> {
  _id: string
  createdAt: Date
  lastModified: Date
}

// 类型文档接口
export interface GenreDocument extends Omit<NovelGenre, 'id' | 'createdAt'> {
  _id: string
  createdAt: Date
}

// 标签文档接口
export interface TagDocument extends Omit<NovelTag, 'id' | 'createdAt'> {
  _id: string
  createdAt: Date
}

// 大纲文档接口
export interface OutlineDocument extends Omit<NovelOutline, 'id' | 'createdAt' | 'lastModified'> {
  _id: string
  createdAt: Date
  lastModified: Date
}

// 角色文档接口
export interface CharacterDocument extends Omit<Character, 'id' | 'createdAt' | 'lastModified'> {
  _id: string
  createdAt: Date
  lastModified: Date
}

// 地点文档接口
export interface LocationDocument extends Omit<Location, 'id' | 'createdAt' | 'lastModified'> {
  _id: string
  createdAt: Date
  lastModified: Date
}

// 世界观设定文档接口
export interface WorldSettingDocument extends Omit<WorldSetting, 'id' | 'createdAt' | 'lastModified'> {
  _id: string
  createdAt: Date
  lastModified: Date
}

// 统计信息文档接口
export interface StatsDocument extends WritingStats {
  _id: string
}

// 章节版本文档接口
export interface ChapterVersionDocument extends Omit<ChapterVersion, 'id' | 'createdAt'> {
  _id: string
  createdAt: Date
}

// 写作记录文档接口
export interface WritingRecordDocument extends Omit<WritingRecord, 'id' | 'createdAt' | 'lastModified'> {
  _id: string
  createdAt: Date
  lastModified: Date
}

// AI模型文档接口
export interface AIModelDocument extends Omit<AIModelRecord, 'id' | 'createdAt' | 'updatedAt'> {
  _id: string
  createdAt: string
  updatedAt: string
}

// 获取用户集合（浏览器环境使用API服务）
export const getUsersCollection = () => {
  return {
    find: async (query: any = {}) => {
      return await apiService.users.getAllUsers()
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.users.getUserById(query._id)
        } catch (error) {
          return null
        }
      }
      if (query.username) {
        // 这里需要实现根据用户名查找用户的API
        const users = await apiService.users.getAllUsers()
        return users.find(user => user.username === query.username) || null
      }
      if (query.email) {
        // 这里需要实现根据邮箱查找用户的API
        const users = await apiService.users.getAllUsers()
        return users.find(user => user.email === query.email) || null
      }
      return null
    },
    insertOne: async (doc: UserDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.users.createUser({
        email: doc.email,
        username: doc.username,
        passwordHash: doc.passwordHash,
        membershipInfo: doc.membershipInfo,
        createdAt: doc.createdAt,
        lastLoginAt: doc.lastLoginAt
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.users.updateUser(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.users.deleteUser(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理
    }
  }
}

// 获取小说集合
export const getNovelsCollection = () => {
  return {
    find: async (query: any = {}) => {
      // 根据查询条件调用相应的API方法
      if (query.userId) {
        // 如果有userId查询条件，调用获取当前用户小说的方法
        return await apiService.novels.getCurrentUserNovels(query.userId)
      } else {
        // 否则获取所有小说
        return await apiService.novels.getAllNovels()
      }
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.novels.getNovelById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: NovelDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.novels.createNovel({
        title: doc.title,
        content: doc.content,
        genre: doc.genre,
        wordCount: doc.wordCount,
        progress: doc.progress,
        status: doc.status,
        description: doc.description,
        tags: doc.tags,
        coverImage: doc.coverImage,
        author: doc.author,
        targetWordCount: doc.targetWordCount,
        isPublic: doc.isPublic,
        userId: doc.userId, // 确保传递userId字段
        createdAt: doc.createdAt,
        lastModified: doc.lastModified
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.novels.updateNovel(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.novels.deleteNovel(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取章节集合
export const getChaptersCollection = () => {
  return {
    find: async (query: any = {}) => {
      if (query.novelId) {
        return await apiService.chapters.getChaptersByNovelId(query.novelId)
      }
      return []
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.chapters.getChapterById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: ChapterDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.chapters.createChapter({
        novelId: doc.novelId,
        title: doc.title,
        content: doc.content,
        order: doc.order,
        wordCount: doc.wordCount,
        status: doc.status,
        summary: doc.summary,
        notes: doc.notes,
        isLocked: doc.isLocked,
        createdAt: doc.createdAt,
        lastModified: doc.lastModified
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.chapters.updateChapter(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.chapters.deleteChapter(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取大纲集合
export const getOutlinesCollection = () => {
  return {
    find: async (query: any = {}) => {
      if (query.novelId) {
        return await apiService.outlines.getOutlinesByNovelId(query.novelId)
      }
      return []
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.outlines.getOutlineById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: OutlineDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.outlines.createOutline({
        novelId: doc.novelId,
        title: doc.title,
        content: doc.content,
        type: doc.type,
        order: doc.order,
        parentId: doc.parentId,
        summary: doc.summary,
        createdAt: doc.createdAt,
        lastModified: doc.lastModified
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.outlines.updateOutline(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.outlines.deleteOutline(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取角色集合
export const getCharactersCollection = () => {
  return {
    find: async (query: any = {}) => {
      if (query.novelId) {
        return await apiService.characters.getCharactersByNovelId(query.novelId)
      }
      return []
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.characters.getCharacterById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: CharacterDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.characters.createCharacter({
        novelId: doc.novelId,
        name: doc.name,
        description: doc.description,
        role: doc.role,
        appearance: doc.appearance,
        personality: doc.personality,
        background: doc.background,
        relationships: doc.relationships,
        abilities: doc.abilities,
        characterArc: doc.characterArc,
        details: doc.details,
        tags: doc.tags,
        professionTags: doc.professionTags,
        personalityTags: doc.personalityTags,
        functionTags: doc.functionTags,
        createdAt: doc.createdAt,
        lastModified: doc.lastModified
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.characters.updateCharacter(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.characters.deleteCharacter(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取地点集合
export const getLocationsCollection = () => {
  return {
    find: async (query: any = {}) => {
      if (query.novelId) {
        return await apiService.locations.getLocationsByNovelId(query.novelId)
      }
      return []
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.locations.getLocationById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: LocationDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.locations.createLocation({
        novelId: doc.novelId,
        name: doc.name,
        description: doc.description,
        type: doc.type,
        importance: doc.importance,
        geography: doc.geography,
        climate: doc.climate,
        terrain: doc.terrain,
        naturalResources: doc.naturalResources,
        ecosystem: doc.ecosystem,
        architecture: doc.architecture,
        socialStructure: doc.socialStructure,
        culture: doc.culture,
        historyBackground: doc.historyBackground,
        politics: doc.politics,
        governance: doc.governance,
        laws: doc.laws,
        economy: doc.economy,
        mainIndustries: doc.mainIndustries,
        trade: doc.trade,
        wealth: doc.wealth,
        details: doc.details,
        tags: doc.tags,
        locationType: doc.locationType,
        createdAt: doc.createdAt,
        lastModified: doc.lastModified
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.locations.updateLocation(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.locations.deleteLocation(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取文化设定集合
export const getCulturesCollection = () => {
  return {
    find: async (query: any = {}) => {
      if (query.novelId) {
        return await apiService.worldSettings.getWorldSettingsByNovelId(query.novelId, 'culture')
      }
      return []
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.worldSettings.getWorldSettingById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: WorldSettingDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.worldSettings.createWorldSetting({
        novelId: doc.novelId,
        name: doc.name,
        description: doc.description,
        type: 'culture',
        tags: doc.tags,
        traditions: doc.traditions,
        values: doc.values,
        arts: doc.arts,
        language: doc.language,
        religion: doc.religion,
        customs: doc.customs,
        festivals: doc.festivals,
        art: doc.art,
        socialStructure: doc.socialStructure,
        education: doc.education,
        technology: doc.technology,
        details: doc.details,
        cultureInteraction: doc.cultureInteraction,
        createdAt: doc.createdAt,
        lastModified: doc.lastModified
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.worldSettings.updateWorldSetting(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.worldSettings.deleteWorldSetting(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取科技设定集合
export const getTechnologiesCollection = () => {
  return {
    find: async (query: any = {}) => {
      if (query.novelId) {
        return await apiService.worldSettings.getWorldSettingsByNovelId(query.novelId, 'technology')
      }
      return []
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.worldSettings.getWorldSettingById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: WorldSettingDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.worldSettings.createWorldSetting({
        novelId: doc.novelId,
        name: doc.name,
        description: doc.description,
        type: 'technology',
        tags: doc.tags,
        level: doc.level,
        applications: doc.applications,
        limitations: doc.limitations,
        details: doc.details,
        createdAt: doc.createdAt,
        lastModified: doc.lastModified
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.worldSettings.updateWorldSetting(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.worldSettings.deleteWorldSetting(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取魔法设定集合
export const getMagicsCollection = () => {
  return {
    find: async (query: any = {}) => {
      if (query.novelId) {
        return await apiService.worldSettings.getWorldSettingsByNovelId(query.novelId, 'magic')
      }
      return []
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.worldSettings.getWorldSettingById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: WorldSettingDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.worldSettings.createWorldSetting({
        novelId: doc.novelId,
        name: doc.name,
        description: doc.description,
        type: 'magic',
        tags: doc.tags,
        system: doc.system,
        sources: doc.sources,
        rules: doc.rules,
        spells: doc.spells,
        artifacts: doc.artifacts,
        worldRelation: doc.worldRelation,
        details: doc.details,
        createdAt: doc.createdAt,
        lastModified: doc.lastModified
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.worldSettings.updateWorldSetting(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.worldSettings.deleteWorldSetting(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取历史设定集合
export const getHistoriesCollection = () => {
  return {
    find: async (query: any = {}) => {
      if (query.novelId) {
        return await apiService.worldSettings.getWorldSettingsByNovelId(query.novelId, 'history')
      }
      return []
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.worldSettings.getWorldSettingById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: WorldSettingDocument) => {
      // 直接传递文档数据给API服务，让后端处理日期转换
      return await apiService.worldSettings.createWorldSetting({
        novelId: doc.novelId,
        name: doc.name,
        description: doc.description,
        type: 'history',
        tags: doc.tags,
        timeline: doc.timeline,
        events: doc.events,
        figures: doc.figures,
        consequences: doc.consequences,
        details: doc.details,
        createdAt: doc.createdAt,
        lastModified: doc.lastModified
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.worldSettings.updateWorldSetting(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.worldSettings.deleteWorldSetting(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取统计信息集合
export const getStatsCollection = () => {
  return {
    findOne: async (query: any) => {
      try {
        return await apiService.stats.getStats()
      } catch (error) {
        return null
      }
    },
    updateOne: async (query: any, update: any, options: any = {}) => {
      const updateData = update.$set || {}
      if (options.upsert) {
        // 如果是upsert操作，先尝试更新，如果失败则创建
        try {
          return await apiService.stats.updateStats(updateData)
        } catch (error) {
          // 如果更新失败，可能是记录不存在，这里简化处理
          return await apiService.stats.updateStats(updateData)
        }
      } else {
        return await apiService.stats.updateStats(updateData)
      }
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取章节版本集合
export const getChapterVersionsCollection = () => {
  // 简化实现，返回空对象，实际应用中需要实现完整的API
  return {
    find: async (query: any = {}) => {
      return []
    },
    findOne: async (query: any) => {
      return null
    },
    insertOne: async (doc: ChapterVersionDocument) => {
      return null
    },
    updateOne: async (query: any, update: any) => {
      return null
    },
    deleteOne: async (query: any) => {
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取写作记录集合
export const getWritingRecordsCollection = () => {
  // 简化实现，返回空对象，实际应用中需要实现完整的API
  return {
    find: async (query: any = {}) => {
      return []
    },
    findOne: async (query: any) => {
      return null
    },
    insertOne: async (doc: WritingRecordDocument) => {
      return null
    },
    updateOne: async (query: any, update: any) => {
      return null
    },
    deleteOne: async (query: any) => {
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 获取AI模型集合
export const getAIModelsCollection = () => {
  return {
    find: async (query: any = {}) => {
      // 如果查询默认模型
      if (query.isDefault === true) {
        return await apiService.aiModels.getDefaultAIModels()
      }
      // 否则获取所有AI模型
      return await apiService.aiModels.getAllAIModels()
    },
    findOne: async (query: any) => {
      if (query._id) {
        try {
          return await apiService.aiModels.getAIModelById(query._id)
        } catch (error) {
          return null
        }
      }
      return null
    },
    insertOne: async (doc: AIModelDocument) => {
      // 直接传递文档数据给API服务
      return await apiService.aiModels.createAIModel({
        name: doc.name,
        provider: doc.provider,
        connectionId: doc.connectionId,
        description: doc.description,
        isDefault: doc.isDefault,
        raw: doc.raw
      } as any)
    },
    updateOne: async (query: any, update: any) => {
      if (query._id) {
        const updateData = update.$set || {}
        return await apiService.aiModels.updateAIModel(query._id, updateData)
      }
      return null
    },
    deleteOne: async (query: any) => {
      if (query._id) {
        return await apiService.aiModels.deleteAIModel(query._id)
      }
      return null
    },
    createIndex: async (field: any, options: any) => {
      // 浏览器环境不创建索引，由后端MongoDB处理

    }
  }
}

// 浏览器环境不直接连接数据库
export const connectToDatabase = async (): Promise<void> => {
  console.log('Using API service instead of direct MongoDB connection in browser environment')
  return Promise.resolve()
}

// 浏览器环境不直接断开数据库连接
export const disconnectFromDatabase = async (): Promise<void> => {
  console.log('Using API service instead of direct MongoDB connection in browser environment')
  return Promise.resolve()
}

// 初始化数据库连接
export const initializeDatabase = async (): Promise<void> => {
  console.log('Using API service instead of direct MongoDB connection in browser environment')
  return Promise.resolve()
}