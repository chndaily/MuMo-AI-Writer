// 真实的用户认证服务
import { MembershipLevel, MembershipInfo } from '@/stores/membershipStore'
import { safeUpdateUser, isUserAdminAccount } from '@/services/adminProtectionService'
import { connectToDatabase, getUsersCollection, UserDocument } from '@/services/mongodbService'
import { PasswordService } from '@/services/passwordService'
import { JWTService } from '@/services/jwtService'
import { apiService } from '@/services/apiService'

// 用户信息接口
export interface User {
  id: string
  email: string
  username: string
  passwordHash: string // 加密后的密码
  createdAt: Date
  lastLoginAt: Date | null
  membershipInfo: MembershipInfo
}

// 认证响应接口
export interface AuthResponse {
  success: boolean
  user?: Omit<User, 'passwordHash'> // 不返回密码哈希
  message?: string
  token?: string
}

// JWT密钥（在实际应用中应该从环境变量获取）
const JWT_SECRET = 'taotao-writing-jwt-secret-key'
const JWT_EXPIRES_IN = '24h'

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

// 认证服务类
class RealAuthService {
  // 初始化数据库连接
  async initialize() {
    try {
      await connectToDatabase()
      console.log('Database connected successfully')
      // 初始化管理员账户（如果不存在）
      await this.initializeAdminUser()
    } catch (error) {
      console.error('Failed to initialize database:', error)
    }
  }
  
  // 初始化管理员账户
  private async initializeAdminUser() {
    try {
      const usersCollection = getUsersCollection()
      
      // 检查是否已存在管理员账户
      const adminUser = await usersCollection.findOne({ username: 'admin' })
      
      if (!adminUser) {
        // 创建默认管理员账户
        // 使用密码服务加密密码
        const passwordHash = await PasswordService.hashPassword('admin123')
        
        const adminUserData: UserDocument = {
          _id: this.generateId(),
          email: 'admin@example.com',
          username: 'admin',
          passwordHash,
          createdAt: new Date(),
          lastLoginAt: null,
          membershipInfo: {
            level: MembershipLevel.PROFESSIONAL,
            expiryDate: null,
            maxNovels: Infinity,
            aiGenerationLimit: Infinity,
            aiGenerationUsed: 0,
            features: getFeaturesByLevel(MembershipLevel.PROFESSIONAL),
            teamEnabled: true,
            maxTeamMembers: 10,
            isAdmin: true,
            username: 'admin',
            email: 'admin@example.com'
          }
        }
        
        await usersCollection.insertOne(adminUserData)
        console.log('Admin user created successfully')
      }
    } catch (error) {
      console.error('Failed to initialize admin user:', error)
    }
  }
  
  // 获取用户（用于内部管理操作）
  async getUserById(userId: string): Promise<User | null> {
    try {
      // 检查是否在浏览器环境
      const isBrowser = typeof window !== 'undefined';
      
      if (isBrowser) {
        // 在浏览器环境中，直接通过API服务获取用户
        try {
          const user: any = await apiService.users.getUserById(userId);
          // 将API返回的用户对象转换为内部User类型
          if (user) {
            // 确保必要的字段存在，处理_id到id的转换
            return {
              id: user._id || user.id,
              email: user.email,
              username: user.username,
              passwordHash: user.passwordHash,
              createdAt: user.createdAt,
              lastLoginAt: user.lastLoginAt,
              membershipInfo: user.membershipInfo
            } as User;
          }
          return null;
        } catch (error) {
          console.error('Failed to get user via API service:', error);
          return null;
        }
      } else {
        // 在服务器环境中，使用MongoDB直接查询
        const usersCollection = getUsersCollection();
        const user: any = await usersCollection.findOne({ _id: userId });
        // 确保返回的用户对象格式正确
        if (user) {
          return {
            id: user._id,
            email: user.email,
            username: user.username,
            passwordHash: user.passwordHash,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            membershipInfo: user.membershipInfo
          } as User;
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }
  
  // 根据邮箱获取用户
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersCollection = getUsersCollection()
      const user = await usersCollection.findOne({ email })
      
      return user
    } catch (error) {
      console.error('Failed to get user by email:', error)
      return null
    }
  }
  
  // 根据用户名获取用户
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const usersCollection = getUsersCollection()
      const user = await usersCollection.findOne({ username })
      
      return user
    } catch (error) {
      console.error('Failed to get user by username:', error)
      return null
    }
  }
  
  // 获取所有用户
  async getAllUsers(): Promise<User[]> {
    try {
      const usersCollection = getUsersCollection()
      const users: any[] = await usersCollection.find({})
      
      // 将数据库返回的用户数据转换为内部User类型
      // 确保正确处理_id到id的映射
      return users.map(user => ({
        id: user._id || user.id,
        email: user.email,
        username: user.username,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        membershipInfo: user.membershipInfo
      }));
    } catch (error) {
      console.error('Failed to get all users:', error)
      return []
    }
  }
  
  // 更新用户会员信息（用于内部管理操作）
  async updateUserMembershipInfo(userId: string, level: MembershipLevel, isAdmin: boolean): Promise<boolean> {
    try {
      const user = await this.getUserById(userId)
      if (!user) return false
      
      // 检查是否尝试修改管理员账户的权限
      if (user.username === 'admin') {
        // 管理员账户不能被降级
        if (level !== MembershipLevel.PROFESSIONAL) {
          console.error('管理员账户不能被降级为其他会员等级')
          return false
        }
        
        // 管理员账户必须保持管理员权限
        if (!isAdmin) {
          console.error('管理员账户必须保持管理员权限')
          return false
        }
      }
      
      const usersCollection = getUsersCollection()
      const result = await usersCollection.updateOne(
        { _id: userId },
        { 
          $set: { 
            'membershipInfo.level': level,
            'membershipInfo.isAdmin': isAdmin
          }
        }
      )
      
      return result !== null
    } catch (error) {
      console.error('Failed to update user membership info:', error)
      return false
    }
  }
  
  // 更安全的用户更新方法
  async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      const user = await this.getUserById(userId)
      if (!user) {
        console.error('User not found when trying to update:', userId)
        return false
      }
      
      // 使用管理员保护服务安全更新用户信息
      // 注意：这里我们需要调整safeUpdateUser函数以支持异步操作
      // 暂时直接进行验证
      if (isUserAdminAccount(user)) {
        // 防止修改管理员的核心属性
        if (updates.email && updates.email !== user.email) {
          console.error('禁止修改管理员账户的邮箱')
          return false
        }
        
        if (updates.username && updates.username !== user.username) {
          console.error('禁止修改管理员账户的用户名')
          return false
        }
        
        // 确保管理员账户保持专业会员等级和管理员权限
        if (updates.membershipInfo) {
          if (updates.membershipInfo.level && updates.membershipInfo.level !== MembershipLevel.PROFESSIONAL) {
            console.error('管理员账户必须保持专业会员等级')
            return false
          }
          
          if (updates.membershipInfo.isAdmin === false) {
            console.error('管理员账户必须保持管理员权限')
            return false
          }
        }
      }
      
      // 构建更新对象
      const updateObj: any = {}
      if (updates.email !== undefined) updateObj.email = updates.email
      if (updates.username !== undefined) updateObj.username = updates.username
      if (updates.passwordHash !== undefined) updateObj.passwordHash = updates.passwordHash
      if (updates.lastLoginAt !== undefined) updateObj.lastLoginAt = updates.lastLoginAt
      if (updates.membershipInfo) {
        for (const [key, value] of Object.entries(updates.membershipInfo)) {
          updateObj[`membershipInfo.${key}`] = value
        }
      }
      
      const usersCollection = getUsersCollection()
      const result = await usersCollection.updateOne(
        { _id: userId },
        { $set: updateObj }
      )
      
      // 检查更新是否成功
      return result !== null && (result as any).modifiedCount !== undefined ? (result as any).modifiedCount > 0 : true
    } catch (error) {
      console.error('Failed to update user:', error)
      return false
    }
  }
  
  // 用户注册
  async register(email: string, username: string, password: string, membershipLevel?: MembershipLevel): Promise<AuthResponse> {
    try {
      // 使用API服务进行注册，传递会员等级
      const response = await apiService.users.register(email, username, password, membershipLevel);
      
      return response;
    } catch (error) {
      console.error('Failed to register user:', error)
      return {
        success: false,
        message: '注册失败，请稍后重试'
      }
    }
  }
  
  // 用户登录
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // 使用API服务进行登录
      const response = await apiService.users.login(email, password);
      
      return response;
    } catch (error: any) {
      console.error('Failed to login user:', error);
      
      // 检查是否是API错误并返回具体的错误消息
      if (error) {
        // 如果error有message属性且是字符串
        if (error.message && typeof error.message === 'string') {
          // 检查是否是我们的ApiError（包含具体的状态码和消息）
          if (error.status) {
            // 这是我们的ApiError，直接返回消息
            return {
              success: false,
              message: error.message
            };
          } else {
            // 可能是其他类型的错误，但仍包含有用的消息
            return {
              success: false,
              message: error.message
            };
          }
        }
        
        // 如果error本身是字符串
        if (typeof error === 'string') {
          return {
            success: false,
            message: error
          };
        }
      }
      
      // 默认错误消息
      return {
        success: false,
        message: '登录失败，请稍后重试'
      };
    }
  }
  
  // 用户登出
  async logout(token: string): Promise<{ success: boolean; message: string }> {
    // 在实际应用中，这里应该将token加入黑名单
    // 当前实现中，我们只是返回成功
    return {
      success: true,
      message: '登出成功'
    }
  }
  
  // 验证用户token
  async verifyToken(token: string): Promise<AuthResponse> {
    try {
      // 验证JWT token
      const decoded = await JWTService.verify(token, JWT_SECRET) as { userId: string; email: string; username: string }
      
      const user = await this.getUserById(decoded.userId)
      
      if (!user) {
        return {
          success: false,
          message: '认证失败：用户不存在'
        }
      }
      
      // 返回不包含密码哈希的用户信息
      const { passwordHash: _, ...userWithoutPassword } = user
      
      return {
        success: true,
        user: userWithoutPassword,
        message: '认证成功'
      }
    } catch (error) {
      console.error('Failed to verify token:', error)
      return {
        success: false,
        message: '认证失败'
      }
    }
  }
  
  // 获取当前用户信息
  async getCurrentUser(token: string): Promise<AuthResponse> {
    return this.verifyToken(token)
  }
  
  // 更新用户信息
  async updateUserInfo(token: string, updates: Partial<Omit<User, 'id' | 'passwordHash' | 'membershipInfo'>>): Promise<AuthResponse> {
    try {
      const verification = await this.verifyToken(token)
      
      if (!verification.success || !verification.user) {
        return {
          success: false,
          message: '认证失败'
        }
      }
      
      const user = await this.getUserById(verification.user.id)
      
      if (!user) {
        return {
          success: false,
          message: '用户不存在'
        }
      }
      
      // 检查是否尝试修改管理员账户的核心信息
      if (user.username === 'admin') {
        // 管理员账户不能被降级
        if (updates.email && updates.email !== user.email) {
          return {
            success: false,
            message: '管理员账户的邮箱不能被修改'
          }
        }
        
        if (updates.username && updates.username !== user.username) {
          return {
            success: false,
            message: '管理员账户的用户名不能被修改'
          }
        }
      }
      
      // 检查邮箱唯一性（如果尝试修改邮箱）
      if (updates.email && updates.email !== user.email) {
        const existingUser = await this.getUserByEmail(updates.email)
        if (existingUser) {
          return {
            success: false,
            message: '该邮箱已被其他用户使用'
          }
        }
      }
      
      // 检查用户名唯一性（如果尝试修改用户名）
      if (updates.username && updates.username !== user.username) {
        const existingUser = await this.getUserByUsername(updates.username)
        if (existingUser) {
          return {
            success: false,
            message: '该用户名已被其他用户使用'
          }
        }
      }
      
      // 更新用户信息
      const updateData: Partial<User> = {}
      if (updates.email) updateData.email = updates.email
      if (updates.username) updateData.username = updates.username
      
      const success = await this.updateUser(user.id, updateData)
      
      if (!success) {
        return {
          success: false,
          message: '更新用户信息失败'
        }
      }
      
      // 获取更新后的用户信息
      const updatedUser = await this.getUserById(user.id)
      if (!updatedUser) {
        return {
          success: false,
          message: '获取更新后的用户信息失败'
        }
      }
      
      // 同步更新会员信息中的用户名和邮箱
      if (updates.username || updates.email) {
        const membershipUpdates: Partial<MembershipInfo> = {}
        if (updates.username) {
          membershipUpdates.username = updates.username
        }
        if (updates.email) {
          membershipUpdates.email = updates.email
        }
        
        // 使用展开运算符确保所有必需字段都存在
        const fullMembershipInfo: MembershipInfo = {
          ...updatedUser.membershipInfo,
          ...membershipUpdates
        }
        
        await this.updateUser(updatedUser.id, { membershipInfo: fullMembershipInfo })
      }
      
      // 返回不包含密码哈希的用户信息
      const { passwordHash: _, ...userWithoutPassword } = updatedUser
      
      return {
        success: true,
        user: userWithoutPassword,
        message: '用户信息更新成功'
      }
    } catch (error) {
      console.error('Failed to update user info:', error)
      return {
        success: false,
        message: '更新用户信息失败'
      }
    }
  }
  
  // 修改密码
  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const verification = await this.verifyToken(token)
      
      if (!verification.success || !verification.user) {
        return {
          success: false,
          message: '认证失败'
        }
      }
      
      // 通过API服务修改密码
      const response = await apiService.users.changePassword(
        verification.user.email, 
        oldPassword, 
        newPassword
      );
      
      return response;
    } catch (error) {
      console.error('Failed to change password:', error)
      return {
        success: false,
        message: '密码修改失败'
      }
    }
  }
  
  // 删除用户
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId)
      
      if (!user) {
        return false
      }
      
      // 检查是否为管理员账户
      if (isUserAdminAccount(user)) {
        console.error('Cannot delete admin user')
        return false
      }
      
      const usersCollection = getUsersCollection()
      const result = await usersCollection.deleteOne({ _id: userId })
      
      return result !== null
    } catch (error) {
      console.error('Failed to delete user:', error)
      return false
    }
  }
  
  // 生成唯一ID
  private generateId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// 导出认证服务实例
export const realAuthService = new RealAuthService()

// 初始化数据库连接
realAuthService.initialize().catch(error => {
  console.error('Failed to initialize real auth service:', error)
})