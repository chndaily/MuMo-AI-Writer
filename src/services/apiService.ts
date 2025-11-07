// API服务 - 用于与后端MongoDB服务通信
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
import { useMembershipStore } from '@/stores/membershipStore'
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

// 扩展RequestInit类型以支持params参数
interface ExtendedRequestInit extends RequestInit {
  params?: Record<string, string>;
}

// 发送API请求的辅助函数
const apiRequest = async <T>(
  endpoint: string,
  options: ExtendedRequestInit = {}
): Promise<T> => {
  // 处理查询参数
  let url = `${API_BASE_URL}${endpoint}`;
  if (options.params) {
    const params = new URLSearchParams(options.params).toString();
    url += (url.includes('?') ? '&' : '?') + params;
    delete options.params;
  }
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }
  
  // 对于某些不需要认证的公开API端点，不添加认证token
  const publicEndpoints = [
    '/api/ai-models',
    '/api/world-settings'  // 世界观设定API也应该是公开的，因为它们是内部服务调用
  ];
  
  // 检查是否为公开端点
  const isPublicEndpoint = publicEndpoints.some(ep => 
    endpoint === ep || endpoint.startsWith(ep + '?') || endpoint.startsWith(ep + '/')
  );
  
  if (!isPublicEndpoint) {
    // 添加认证token到请求头（仅对需要认证的端点）
    const { authToken } = useMembershipStore.getState();
    if (authToken) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${authToken}`
      };
    } else {
      console.warn('缺少认证token，请求可能失败:', endpoint);
    }
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
      if (item && typeof item === 'object') {
        // 如果对象有_id字段但没有id字段，创建id字段
        if (item._id && !item.id) {
          return { ...item, id: item._id };
        }
      }
      return item;
    };
    
    // 递归处理数组和对象
    const processData = (data: any): any => {
      if (Array.isArray(data)) {
        return data.map(mapIdField);
      } else {
        return mapIdField(data);
      }
    };
    
    return processData(data);
  } catch (e) {
    // 如果无法解析为JSON，返回原始文本
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
  
  // 验证邮箱
  verifyEmail: async (token: string) => {
    return apiRequest<{ success: boolean; message?: string }>('/api/auth/verify-email', {
      method: 'GET',
      params: { token }
    })
  },
  
  // 请求密码重置
  forgotPassword: async (email: string) => {
    return apiRequest<{ success: boolean; message?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },
  
  // 验证密码重置token
  validateResetToken: async (token: string) => {
    return apiRequest<{ success: boolean; message?: string }>('/api/auth/reset-password-validate', {
      method: 'GET',
      params: { token }
    })
  },
  
  // 重置密码
  resetPassword: async (token: string, newPassword: string) => {
    return apiRequest<{ success: boolean; message?: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
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
  
  // 根据作者ID获取小说 (修改为使用userId参数)
  getNovelsByAuthorId: async (userId: string) => {
    return apiRequest<Novel[]>(`/api/novels?authorId=${userId}`)
  },
  
  // 获取当前用户的小说 (修改为使用userId参数)
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
    console.log('Making API request to delete AI model with ID:', id);
    const result = apiRequest<void>(`/api/ai-models/${id}`, {
      method: 'DELETE',
    });
    console.log('API request completed for deleting AI model with ID:', id);
    return result;
  },
  
  // 获取默认AI模型
  getDefaultAIModels: async () => {
    return apiRequest<AIModelRecord[]>('/api/ai-models?isDefault=true')
  },
  
  // 设置模型为默认模型
  setDefaultAIModel: async (id: string) => {
    return apiRequest<AIModelRecord>(`/api/ai-models/${id}/set-default`, {
      method: 'POST',
    })
  },
  
  // 取消模型的默认设置
  unsetDefaultAIModel: async (id: string) => {
    return apiRequest<AIModelRecord>(`/api/ai-models/${id}/unset-default`, {
      method: 'POST',
    })
  },
}

// 用户成就API
export const userAchievementApi = {
  // 根据用户ID获取成就数据
  getByUserId: async (userId: string) => {
    return apiRequest<any[]>(`/api/user-achievements?userId=${userId}`)
  },
  
  // 创建用户成就数据
  create: async (data: any) => {
    return apiRequest<any>('/api/user-achievements', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  // 更新用户成就数据
  update: async (id: string, data: Partial<any>) => {
    return apiRequest<any>(`/api/user-achievements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// 用户活动API
export const userActivityApi = {
  // 根据用户ID获取活动数据
  getByUserId: async (userId: string) => {
    return apiRequest<any[]>(`/api/user-activities?userId=${userId}`)
  },
  
  // 创建用户活动数据
  create: async (data: any) => {
    return apiRequest<any>('/api/user-activities', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  // 更新用户活动数据
  update: async (id: string, data: Partial<any>) => {
    return apiRequest<any>(`/api/user-activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// 写作记录API
export const writingRecordApi = {
  // 获取小说的所有写作记录
  getWritingRecordsByNovelId: async (novelId: string) => {
    return apiRequest<WritingRecord[]>(`/api/writing-records?novelId=${novelId}`)
  },
  
  // 根据ID获取写作记录
  getWritingRecordById: async (id: string) => {
    return apiRequest<WritingRecord>(`/api/writing-records/${id}`)
  },
  
  // 创建写作记录
  createWritingRecord: async (writingRecordData: Omit<WritingRecord, 'id' | 'createdAt' | 'lastModified'>) => {
    return apiRequest<WritingRecord>('/api/writing-records', {
      method: 'POST',
      body: JSON.stringify(writingRecordData),
    })
  },
  
  // 更新写作记录
  updateWritingRecord: async (id: string, writingRecordData: Partial<WritingRecord>) => {
    return apiRequest<WritingRecord>(`/api/writing-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(writingRecordData),
    })
  },
  
  // 删除写作记录
  deleteWritingRecord: async (id: string) => {
    return apiRequest<void>(`/api/writing-records/${id}`, {
      method: 'DELETE',
    })
  },
}

// 章节版本API
export const chapterVersionApi = {
  // 获取章节的所有版本
  getChapterVersions: async (chapterId: string) => {
    return apiRequest<ChapterVersion[]>(`/api/chapter-versions?chapterId=${chapterId}`)
  },
  
  // 根据ID获取章节版本
  getChapterVersionById: async (id: string) => {
    return apiRequest<ChapterVersion>(`/api/chapter-versions/${id}`)
  },
  
  // 创建章节版本
  createChapterVersion: async (versionData: Omit<ChapterVersion, 'id' | 'createdAt'>) => {
    return apiRequest<ChapterVersion>('/api/chapter-versions', {
      method: 'POST',
      body: JSON.stringify(versionData),
    })
  },
  
  // 删除章节版本
  deleteChapterVersion: async (id: string) => {
    return apiRequest<void>(`/api/chapter-versions/${id}`, {
      method: 'DELETE',
    })
  },
}

// 提示词库API
export const promptLibraryApi = {
  // 获取所有提示词库集合
  getAllCollections: async () => {
    try {
      return await apiRequest<Collection[]>('/api/prompt-library');
    } catch (error) {
      console.error('API调用失败：获取提示词库集合', error);
      throw error;
    }
  },
  
  // 根据ID获取提示词库集合
  getCollectionById: async (id: string) => {
    try {
      return await apiRequest<Collection>(`/api/prompt-library/${id}`);
    } catch (error) {
      console.error('API调用失败：根据ID获取提示词库集合', error);
      throw error;
    }
  },
  
  // 创建提示词库集合
  createCollection: async (collectionData: Omit<Collection, 'id'>) => {
    try {
      return await apiRequest<Collection>('/api/prompt-library', {
        method: 'POST',
        body: JSON.stringify(collectionData),
      });
    } catch (error) {
      console.error('API调用失败：创建提示词库集合', error);
      throw error;
    }
  },
  
  // 更新提示词库集合
  updateCollection: async (id: string, updateData: Partial<Collection>) => {
    try {
      return await apiRequest<Collection>(`/api/prompt-library/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      console.error('API调用失败：更新提示词库集合', error);
      throw error;
    }
  },
  
  // 删除提示词库集合
  deleteCollection: async (id: string) => {
    try {
      return await apiRequest<void>(`/api/prompt-library/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('API调用失败：删除提示词库集合', error);
      throw error;
    }
  },
}

// API服务主对象
export const apiService = {
  users: userApi,
  novels: novelApi,
  chapters: chapterApi,
  outlines: outlineApi,
  characters: characterApi,
  locations: locationApi,
  worldSettings: worldSettings,
  stats: statsApi,
  payments: paymentApi,
  aiModels: aiModelApi,
  userAchievements: userAchievementApi,
  userActivities: userActivityApi,
  chapterVersions: chapterVersionApi,
  chatHistory: chatHistoryApi,
  promptLibrary: promptLibraryApi,
  writingRecords: writingRecordApi,
}
