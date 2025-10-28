// 修复版API服务 - 解决"(intermediate value).find is not a function"错误
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
import { AIModelRecord } from './aiModelStore'
import { Message, ChatHistory } from './chatStore'
import { Collection } from '#/promptLibrary'

// API基础URL - 在生产环境中应该从环境变量读取
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// API错误处理
class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

// 发送API请求的辅助函数（修复版）
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }
  
  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    // 添加credentials以支持cookie/session
    credentials: 'include'
  })
  
  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    
    try {
      // 尝试获取响应文本
      const responseText = await response.text();
      
      if (responseText) {
        try {
          // 尝试解析为JSON
          const errorData = JSON.parse(responseText);
          if (errorData && errorData.message) {
            // 如果错误响应包含message字段，使用它作为错误消息
            errorMessage = errorData.message;
          } else {
            // 如果JSON不包含message字段，使用原始文本
            errorMessage = responseText;
          }
        } catch (jsonError) {
          // 如果无法解析为JSON，使用原始文本
          errorMessage = responseText;
        }
      }
    } catch (e) {
      // 如果获取响应文本失败，使用默认错误消息
      console.error('Failed to read response body:', e);
    }
    
    throw new ApiError(errorMessage, response.status);
  }
  
  // 对于成功的响应，尝试解析为JSON
  const responseText = await response.text();
  if (!responseText) {
    return undefined as any;
  }
  
  try {
    const data = JSON.parse(responseText);
    
    // 字段映射：将MongoDB的_id字段映射到id字段
    const mapIdField = (item: any): any => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        // 如果对象有_id字段但没有id字段，创建id字段
        if (item._id && !item.id) {
          return { ...item, id: item._id };
        }
      }
      return item;
    };
    
    // 递归处理数组和对象
    const processData = (data: any): any => {
      // 特别处理null值
      if (data === null) {
        return null;
      }
      
      // 处理数组
      if (Array.isArray(data)) {
        return data.map(item => {
          // 确保数组中的每个元素都被正确处理
          return mapIdField(item);
        });
      } 
      // 处理对象
      else if (typeof data === 'object') {
        // 检查是否是MongoDB游标或查询结果对象
        if (typeof data.find === 'function' || typeof data.filter === 'function') {
          console.warn('检测到可能是MongoDB游标对象，尝试转换为数组');
          // 如果有toArray方法，尝试调用它
          if (typeof data.toArray === 'function') {
            try {
              return data.toArray().then((arrayData: any[]) => {
                return arrayData.map(mapIdField);
              });
            } catch (e) {
              console.error('转换MongoDB游标对象时出错:', e);
              // 如果转换失败，返回空数组
              return [];
            }
          } else {
            // 如果没有toArray方法，返回空数组
            return [];
          }
        }
        // 普通对象处理
        return mapIdField(data);
      }
      // 其他类型直接返回
      else {
        return data;
      }
    };
    
    // 处理数据并返回结果
    const processedData = processData(data);
    
    // 如果返回的是Promise（如上面的toArray().then()），等待它完成
    if (processedData instanceof Promise) {
      return await processedData;
    }
    
    return processedData;
  } catch (e) {
    // 如果无法解析为JSON，返回原始文本
    console.error('解析API响应时出错:', e);
    return responseText as any;
  }
}

// 用户API
export const userApi = {
  // 获取所有用户
  getAllUsers: async () => {
    return apiRequest<User[]>('/api/users')
  },
  
  // 根据ID获取用户
  getUserById: async (id: string) => {
    return apiRequest<User>(`/api/users/${id}`)
  },
  
  // 创建用户
  createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => {
    return apiRequest<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },
  
  // 更新用户
  updateUser: async (id: string, userData: Partial<User>) => {
    return apiRequest<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },
  
  // 删除用户
  deleteUser: async (id: string) => {
    return apiRequest<void>(`/api/users/${id}`, {
      method: 'DELETE',
    })
  },
  
  // 用户登录
  login: async (email: string, password: string) => {
    return apiRequest<{ success: boolean; user?: Omit<User, 'passwordHash'>; message?: string; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  
  // 用户注册
  register: async (email: string, username: string, password: string, membershipLevel?: string) => {
    return apiRequest<{ success: boolean; user?: Omit<User, 'passwordHash'>; message?: string; token?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, membershipLevel }),
    })
  },
  
  // 生成JWT token
  generateToken: async (payload: any, secret: string, options: any) => {
    return apiRequest<{ token: string }>('/api/auth/generate-token', {
      method: 'POST',
      body: JSON.stringify({ payload, secret, options }),
    })
  },
  
  // 验证JWT token
  verifyToken: async (token: string, secret: string) => {
    return apiRequest<{ payload: any }>('/api/auth/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token, secret }),
    })
  },
  
  // 验证用户密码
  verifyPassword: async (email: string, password: string) => {
    return apiRequest<{ success: boolean; message: string }>('/api/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  
  // 修改用户密码
  changePassword: async (email: string, oldPassword: string, newPassword: string) => {
    return apiRequest<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, oldPassword, newPassword }),
    })
  },
  
  // 管理员修改用户密码
  adminChangePassword: async (adminEmail: string, targetEmail: string, newPassword: string) => {
    return apiRequest<{ success: boolean; message: string }>('/api/auth/admin-change-password', {
      method: 'POST',
      body: JSON.stringify({ adminEmail, targetEmail, newPassword }),
    })
  },
}

// 小说API
export const novelApi = {
  // 获取所有小说
  getAllNovels: async () => {
    return apiRequest<Novel[]>('/api/novels')
  },
  
  // 根据ID获取小说
  getNovelById: async (id: string) => {
    return apiRequest<Novel>(`/api/novels/${id}`)
  },
  
  // 根据作者ID获取小说
  getNovelsByAuthorId: async (authorId: string) => {
    return apiRequest<Novel[]>(`/api/novels?authorId=${authorId}`)
  },
  
  // 获取当前用户的小说
  getCurrentUserNovels: async (userId: string) => {
    return apiRequest<Novel[]>(`/api/novels?authorId=${userId}`)
  },
  
  // 创建小说
  createNovel: async (novelData: Omit<Novel, 'id' | 'createdAt' | 'lastModified'>) => {
    return apiRequest<Novel>('/api/novels', {
      method: 'POST',
      body: JSON.stringify(novelData),
    })
  },
  
  // 更新小说
  updateNovel: async (id: string, novelData: Partial<Novel>) => {
    return apiRequest<Novel>(`/api/novels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(novelData),
    })
  },
  
  // 删除小说
  deleteNovel: async (id: string) => {
    return apiRequest<void>(`/api/novels/${id}`, {
      method: 'DELETE',
    })
  },
  
  // 获取最后修改时间
  getLastModifiedTime: async () => {
    return apiRequest<number>('/api/sync/last-modified')
  },
}

// 章节API
export const chapterApi = {
  // 获取小说的所有章节
  getChaptersByNovelId: async (novelId: string) => {
    return apiRequest<Chapter[]>(`/api/chapters?novelId=${novelId}`)
  },
  
  // 根据ID获取章节
  getChapterById: async (id: string) => {
    return apiRequest<Chapter>(`/api/chapters/${id}`)
  },
  
  // 创建章节
  createChapter: async (chapterData: Omit<Chapter, 'id' | 'createdAt' | 'lastModified'>) => {
    return apiRequest<Chapter>('/api/chapters', {
      method: 'POST',
      body: JSON.stringify(chapterData),
    })
  },
  
  // 更新章节
  updateChapter: async (id: string, chapterData: Partial<Chapter>) => {
    return apiRequest<Chapter>(`/api/chapters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chapterData),
    })
  },
  
  // 删除章节
  deleteChapter: async (id: string) => {
    return apiRequest<void>(`/api/chapters/${id}`, {
      method: 'DELETE',
    })
  },
}

// 大纲API
export const outlineApi = {
  // 获取小说的所有大纲
  getOutlinesByNovelId: async (novelId: string) => {
    return apiRequest<NovelOutline[]>(`/api/outlines?novelId=${novelId}`)
  },
  
  // 根据ID获取大纲
  getOutlineById: async (id: string) => {
    return apiRequest<NovelOutline>(`/api/outlines/${id}`)
  },
  
  // 创建大纲
  createOutline: async (outlineData: Omit<NovelOutline, 'id' | 'createdAt' | 'lastModified'>) => {
    return apiRequest<NovelOutline>('/api/outlines', {
      method: 'POST',
      body: JSON.stringify(outlineData),
    })
  },
  
  // 更新大纲
  updateOutline: async (id: string, outlineData: Partial<NovelOutline>) => {
    return apiRequest<NovelOutline>(`/api/outlines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(outlineData),
    })
  },
  
  // 删除大纲
  deleteOutline: async (id: string) => {
    return apiRequest<void>(`/api/outlines/${id}`, {
      method: 'DELETE',
    })
  },
}

// 角色API
export const characterApi = {
  // 获取小说的所有角色
  getCharactersByNovelId: async (novelId: string) => {
    return apiRequest<Character[]>(`/api/characters?novelId=${novelId}`)
  },
  
  // 根据ID获取角色
  getCharacterById: async (id: string) => {
    return apiRequest<Character>(`/api/characters/${id}`)
  },
  
  // 创建角色
  createCharacter: async (characterData: Omit<Character, 'id' | 'createdAt' | 'lastModified'>) => {
    return apiRequest<Character>('/api/characters', {
      method: 'POST',
      body: JSON.stringify(characterData),
    })
  },
  
  // 更新角色
  updateCharacter: async (id: string, characterData: Partial<Character>) => {
    return apiRequest<Character>(`/api/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(characterData),
    })
  },
  
  // 删除角色
  deleteCharacter: async (id: string) => {
    return apiRequest<void>(`/api/characters/${id}`, {
      method: 'DELETE',
    })
  },
}

// 地点API
export const locationApi = {
  // 获取小说的所有地点
  getLocationsByNovelId: async (novelId: string) => {
    return apiRequest<Location[]>(`/api/locations?novelId=${novelId}`)
  },
  
  // 根据ID获取地点
  getLocationById: async (id: string) => {
    return apiRequest<Location>(`/api/locations/${id}`)
  },
  
  // 创建地点
  createLocation: async (locationData: Omit<Location, 'id' | 'createdAt' | 'lastModified'>) => {
    return apiRequest<Location>('/api/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    })
  },
  
  // 更新地点
  updateLocation: async (id: string, locationData: Partial<Location>) => {
    return apiRequest<Location>(`/api/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    })
  },
  
  // 删除地点
  deleteLocation: async (id: string) => {
    return apiRequest<void>(`/api/locations/${id}`, {
      method: 'DELETE',
    })
  },
}

// 世界观设定API
export const worldSettings = {
  // 获取小说的世界观设定
  getWorldSettingsByNovelId: async (novelId: string, type: string) => {
    return apiRequest<WorldSetting[]>(`/api/world-settings?novelId=${novelId}&type=${type}`)
  },
  
  // 根据ID获取世界观设定
  getWorldSettingById: async (id: string) => {
    return apiRequest<WorldSetting>(`/api/world-settings/${id}`)
  },
  
  // 创建世界观设定
  createWorldSetting: async (settingData: Omit<WorldSetting, 'id' | 'createdAt' | 'lastModified'>) => {
    return apiRequest<WorldSetting>('/api/world-settings', {
      method: 'POST',
      body: JSON.stringify(settingData),
    })
  },
  
  // 更新世界观设定
  updateWorldSetting: async (id: string, settingData: Partial<WorldSetting>) => {
    return apiRequest<WorldSetting>(`/api/world-settings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(settingData),
    })
  },
  
  // 删除世界观设定
  deleteWorldSetting: async (id: string) => {
    return apiRequest<void>(`/api/world-settings/${id}`, {
      method: 'DELETE',
    })
  },
}

// 统计信息API
export const statsApi = {
  // 获取统计信息
  getStats: async () => {
    return apiRequest<WritingStats>('/api/stats')
  },
  
  // 更新统计信息
  updateStats: async (statsData: Partial<WritingStats>) => {
    return apiRequest<WritingStats>('/api/stats', {
      method: 'PUT',
      body: JSON.stringify(statsData),
    })
  },
}

// 支付API
export const paymentApi = {
  // 创建支付订单
  createPaymentOrder: async (paymentData: any) => {
    return apiRequest<any>('/api/payment/create-order', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  },
  
  // 验证支付结果
  verifyPayment: async (orderId: string, paymentData: any) => {
    return apiRequest<any>(`/api/payment/verify/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  },
  
  // 处理支付回调
  handlePaymentCallback: async (callbackData: any) => {
    return apiRequest<any>('/api/payment/callback', {
      method: 'POST',
      body: JSON.stringify(callbackData),
    })
  },
  
  // 退款处理
  processRefund: async (orderId: string, refundData: any) => {
    return apiRequest<any>(`/api/payment/refund/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(refundData),
    })
  },
  
  // 查询订单状态
  queryOrderStatus: async (orderId: string) => {
    return apiRequest<any>(`/api/payment/query/${orderId}`, {
      method: 'GET',
    })
  },
}

// 聊天历史API
export const chatHistoryApi = {
  // 更新聊天历史
  updateChatHistory: async (novelId: string, messages: Message[]) => {
    return apiRequest<void>(`/api/chat-history/${novelId}`, {
      method: 'PUT',
      body: JSON.stringify({ messages }),
    })
  },
  
  // 获取聊天历史
  getChatHistory: async (novelId: string) => {
    return apiRequest<ChatHistory>(`/api/chat-history/${novelId}`)
  },
  
  // 清空聊天历史
  clearChatHistory: async (novelId: string) => {
    return apiRequest<void>(`/api/chat-history/${novelId}`, {
      method: 'DELETE',
    })
  },
}

// AI模型API
export const aiModelApi = {
  // 获取所有AI模型
  getAllAIModels: async () => {
    return apiRequest<AIModelRecord[]>('/api/ai-models')
  },
  
  // 根据ID获取AI模型
  getAIModelById: async (id: string) => {
    return apiRequest<AIModelRecord>(`/api/ai-models/${id}`)
  },
  
  // 创建AI模型
  createAIModel: async (modelData: Omit<AIModelRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiRequest<AIModelRecord>('/api/ai-models', {
      method: 'POST',
      body: JSON.stringify(modelData),
    })
  },
  
  // 更新AI模型
  updateAIModel: async (id: string, modelData: Partial<AIModelRecord>) => {
    return apiRequest<AIModelRecord>(`/api/ai-models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(modelData),
    })
  },
  
  // 删除AI模型
  deleteAIModel: async (id: string) => {
    return apiRequest<void>(`/api/ai-models/${id}`, {
      method: 'DELETE',
    })
  },
}

// 导出修复后的API服务
export const apiServiceFixed = {
  users: userApi,
  novels: novelApi,
  chapters: chapterApi,
  outlines: outlineApi,
  characters: characterApi,
  locations: locationApi,
  worldSettings: worldSettings,
  stats: statsApi,
  payments: paymentApi,
  chatHistory: chatHistoryApi,
  aiModels: aiModelApi,
}