// 用户认证服务
import { MembershipLevel, MembershipInfo } from '@/stores/membershipStore'

// 用户信息接口
export interface User {
  id: string
  email: string
  username: string
  password: string // 实际应用中应该是加密后的密码
  createdAt: Date
  lastLoginAt: Date | null
  membershipInfo: MembershipInfo
}

// 认证响应接口
export interface AuthResponse {
  success: boolean
  user?: User
  message?: string
  token?: string
}

// 根据会员等级获取功能列表
const getFeaturesByLevel = (level: MembershipLevel) => {
  const baseFeatures = [
    'novel_creation',
    'basic_editing',
    'txt_export',
    'markdown_export'
  ]
  
  switch (level) {
    case MembershipLevel.BASIC:
      return [
        ...baseFeatures,
        'unlimited_novels',
        'enhanced_ai_generation',
        'all_export_formats',
        'spell_check',
        'writing_statistics',
        'basic_cloud_sync'
      ]
    case MembershipLevel.PROFESSIONAL:
      return [
        ...baseFeatures,
        'unlimited_novels',
        'unlimited_ai_generation',
        'visualization_tools',
        'advanced_export',
        'full_cloud_sync',
        'priority_support',
        'early_access',
        'team_collaboration'
      ]
    default:
      return baseFeatures
  }
}

// 模拟数据库存储
let users: User[] = []

// 测试账户
const testUsers: Record<string, { password: string, level: MembershipLevel }> = {
  'admin@example.com': { password: 'admin123', level: MembershipLevel.PROFESSIONAL },
  'free@example.com': { password: '123456', level: MembershipLevel.FREE },
  'basic@example.com': { password: '123456', level: MembershipLevel.BASIC },
  'pro@example.com': { password: '123456', level: MembershipLevel.PROFESSIONAL },
}

// 初始化测试用户
Object.keys(testUsers).forEach(email => {
  const { password, level } = testUsers[email]
  const userLevel = level
  const features = getFeaturesByLevel(userLevel)
  
  users.push({
    id: `${users.length + 1}`,
    email,
    username: email.split('@')[0],
    password, // 实际应用中应加密
    createdAt: new Date(),
    lastLoginAt: null,
    membershipInfo: {
      level: userLevel,
      expiryDate: userLevel !== MembershipLevel.FREE ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      maxNovels: userLevel === MembershipLevel.FREE ? 3 : userLevel === MembershipLevel.BASIC ? 10 : Infinity,
      aiGenerationLimit: userLevel === MembershipLevel.FREE ? 10 : userLevel === MembershipLevel.BASIC ? 100 : Infinity,
      aiGenerationUsed: 0,
      features,
      teamEnabled: userLevel === MembershipLevel.PROFESSIONAL,
      maxTeamMembers: userLevel === MembershipLevel.PROFESSIONAL ? 10 : 0,
      isAdmin: email === 'admin@example.com',
      username: email.split('@')[0],
      email: email
    }
  })
})

// 生成简单token（实际应用中应使用JWT等）
const generateToken = (userId: string): string => {
  return btoa(`${userId}:${Date.now()}`)
}

// 验证token
const verifyToken = (token: string): User | null => {
  try {
    const decoded = atob(token)
    const [userId] = decoded.split(':')
    const user = users.find(u => u.id === userId)
    return user || null
  } catch {
    return null
  }
}

// 认证服务类
class AuthService {
  // 用户注册
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    // 检查邮箱是否已存在
    if (users.some(user => user.email === email)) {
      return {
        success: false,
        message: '该邮箱已被注册'
      }
    }
    
    // 创建新用户（默认为免费会员）
    const newUser: User = {
      id: `${users.length + 1}`,
      email,
      username,
      password, // 实际应用中应加密
      createdAt: new Date(),
      lastLoginAt: null,
      membershipInfo: {
        level: MembershipLevel.FREE,
        expiryDate: null,
        maxNovels: 3,
        aiGenerationLimit: 10,
        aiGenerationUsed: 0,
        features: getFeaturesByLevel(MembershipLevel.FREE),
        teamEnabled: false,
        maxTeamMembers: 0,
        username: username,
        email: email
      }
    }
    
    users.push(newUser)
    
    return {
      success: true,
      user: newUser,
      message: '注册成功',
      token: generateToken(newUser.id)
    }
  }
  
  // 用户登录
  async login(email: string, password: string): Promise<AuthResponse> {
    // 查找用户
    const user = users.find(u => u.email === email)
    
    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      }
    }
    
    // 验证密码
    if (user.password !== password) {
      return {
        success: false,
        message: '密码错误'
      }
    }
    
    // 更新最后登录时间
    user.lastLoginAt = new Date()
    
    return {
      success: true,
      user,
      message: '登录成功',
      token: generateToken(user.id)
    }
  }
  
  // 用户登出
  async logout(token: string): Promise<{ success: boolean; message: string }> {
    // 在实际应用中，这里应该使token失效
    // 当前实现中，我们只是返回成功
    return {
      success: true,
      message: '登出成功'
    }
  }
  
  // 验证用户token
  async verifyToken(token: string): Promise<AuthResponse> {
    const user = verifyToken(token)
    
    if (!user) {
      return {
        success: false,
        message: '认证失败'
      }
    }
    
    return {
      success: true,
      user,
      message: '认证成功'
    }
  }
  
  // 获取当前用户信息
  async getCurrentUser(token: string): Promise<AuthResponse> {
    return this.verifyToken(token)
  }
  
  // 更新用户信息
  async updateUserInfo(token: string, updates: Partial<User>): Promise<AuthResponse> {
    const verification = await this.verifyToken(token);
    
    if (!verification.success || !verification.user) {
      return {
        success: false,
        message: '认证失败'
      };
    }
    
    const user = users.find(u => u.id === verification.user!.id);
    
    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }
    
    // 检查邮箱唯一性（如果尝试修改邮箱）
    if (updates.email && updates.email !== user.email) {
      if (users.some(u => u.email === updates.email)) {
        return {
          success: false,
          message: '该邮箱已被其他用户使用'
        };
      }
    }
    
    // 更新用户信息
    Object.assign(user, updates);
    
    // 同步更新会员信息中的用户名和邮箱
    if (updates.username) {
      user.membershipInfo.username = updates.username;
    }
    if (updates.email) {
      user.membershipInfo.email = updates.email;
    }
    
    return {
      success: true,
      user,
      message: '用户信息更新成功'
    };
  }

}

// 导出认证服务实例
export const authService = new AuthService()