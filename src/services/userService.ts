// 用户管理服务
import { message } from 'antd'
import { MembershipLevel } from '@/stores/membershipStore'
import { realAuthService, type User } from '@/services/realAuthService'
import { isUserAdminAccount, canDeleteUser } from '@/services/adminProtectionService'
import { apiService } from '@/services/apiService'

// 用户信息接口
export interface UserInfo {
  id: string
  username: string
  email: string
  membershipLevel: MembershipLevel
  expiryDate: Date | null
  isAdmin: boolean
  lastLoginAt: Date | null
  createdAt: Date
}

// 获取所有用户列表
export const getAllUsers = async (): Promise<UserInfo[]> => {
  try {
    console.log('getAllUsers called');
    // 从认证服务获取所有用户
    const users = await realAuthService.getAllUsers();
    
    console.log('Auth service users:', users);
    
    // 将认证服务的用户数据转换为用户管理页面需要的格式
    const userInfos: UserInfo[] = users.map((user) => ({
      id: user.id, // 现在应该已经正确映射了
      username: user.username,
      email: user.email,
      membershipLevel: user.membershipInfo.level,
      expiryDate: user.membershipInfo.expiryDate,
      isAdmin: user.membershipInfo.isAdmin || false,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }));
    
    console.log('Mapped users:', userInfos);
    
    return userInfos;
  } catch (error) {
    console.error('Failed to fetch users:', error)
    message.error('获取用户列表失败')
    return []
  }
}

// 更新用户信息
export const updateUser = async (
  userId: string,
  updates: Partial<UserInfo>
): Promise<boolean> => {
  try {
    // 使用认证服务中的方法更新用户数据
    const user = await realAuthService.getUserById(userId);
    
    if (user) {
      // 检查是否尝试修改管理员账户的核心信息
      if (user.username === 'admin') {
        // 管理员账户不能被降级
        if (updates.membershipLevel !== undefined && updates.membershipLevel !== MembershipLevel.PROFESSIONAL) {
          message.error('管理员账户不能被降级为其他会员等级');
          return false;
        }
        
        // 管理员账户必须保持管理员权限
        if (updates.isAdmin !== undefined && !updates.isAdmin) {
          message.error('管理员账户必须保持管理员权限');
          return false;
        }
        
        // 管理员账户不能修改用户名和邮箱
        if (updates.username !== undefined && updates.username !== user.username) {
          message.error('管理员账户的用户名不能被修改');
          return false;
        }
        
        if (updates.email !== undefined && updates.email !== user.email) {
          message.error('管理员账户的邮箱不能被修改');
          return false;
        }
      }
      
      // 特别处理日期字段
      if (updates.expiryDate !== undefined) {
        let formattedExpiryDate = null;
        if (updates.expiryDate) {
          if (typeof updates.expiryDate === 'string') {
            const parsedDate = new Date(updates.expiryDate);
            if (parsedDate.toString() !== 'Invalid Date') {
              formattedExpiryDate = parsedDate;
            }
          } else if (updates.expiryDate instanceof Date) {
            if (updates.expiryDate.toString() !== 'Invalid Date') {
              formattedExpiryDate = updates.expiryDate;
            }
          } else {
            // 处理其他可能的日期格式
            const parsedDate = new Date(updates.expiryDate);
            if (parsedDate.toString() !== 'Invalid Date') {
              formattedExpiryDate = parsedDate;
            }
          }
        }
        updates.expiryDate = formattedExpiryDate;
      }
      
      // 确保布尔值正确
      if (updates.isAdmin !== undefined) {
        updates.isAdmin = Boolean(updates.isAdmin);
      }
      
      // 更新认证服务中的用户数据
      if (updates.membershipLevel !== undefined) {
        user.membershipInfo.level = updates.membershipLevel;
      }
      if (updates.expiryDate !== undefined) {
        user.membershipInfo.expiryDate = updates.expiryDate;
      }
      if (updates.isAdmin !== undefined) {
        user.membershipInfo.isAdmin = updates.isAdmin;
      }
      
      // 更新用户信息
      if (updates.username !== undefined) {
        user.username = updates.username;
        user.membershipInfo.username = updates.username;
      }
      if (updates.email !== undefined) {
        user.email = updates.email;
        user.membershipInfo.email = updates.email;
      }
      
      // 调用认证服务更新用户
      const success = await realAuthService.updateUser(userId, user);
      
      if (success) {
        console.log('Updating user:', userId, updates)
        message.success('用户信息更新成功')
        return true
      } else {
        message.error('更新用户信息失败')
        return false
      }
    }
    
    message.error('用户不存在')
    return false
  } catch (error) {
    console.error('Failed to update user:', error)
    message.error('更新用户信息失败')
    return false
  }
}

// 更新用户会员等级
export const updateUserMembership = async (
  userId: string,
  membershipLevel: MembershipLevel,
  expiryDate: Date | null
): Promise<boolean> => {
  try {
    // 验证用户ID
    if (!userId) {
      message.error('用户ID不能为空');
      return false;
    }
    
    // 使用认证服务中的方法更新用户会员信息
    // 首先获取用户当前的管理员权限状态
    const user = await realAuthService.getUserById(userId);
    if (!user) {
      message.error('用户不存在');
      return false;
    }
    
    // 加强管理员账户保护
    if (user.username === 'admin') {
      // 管理员账户不能被降级
      if (membershipLevel !== MembershipLevel.PROFESSIONAL) {
        message.error('管理员账户不能被降级为其他会员等级');
        return false;
      }
    }
    
    // 更新用户的会员等级和管理员权限
    const membershipSuccess = await realAuthService.updateUserMembershipInfo(
      userId, 
      membershipLevel, 
      user.membershipInfo.isAdmin || false
    );
    
    if (membershipSuccess) {
      // 特别处理日期字段
      let formattedExpiryDate = null;
      if (expiryDate) {
        if (typeof expiryDate === 'string') {
          const parsedDate = new Date(expiryDate);
          if (parsedDate.toString() !== 'Invalid Date') {
            formattedExpiryDate = parsedDate;
          }
        } else if (expiryDate instanceof Date) {
          if (expiryDate.toString() !== 'Invalid Date') {
            formattedExpiryDate = expiryDate;
          }
        } else {
          // 处理其他可能的日期格式
          const parsedDate = new Date(expiryDate);
          if (parsedDate.toString() !== 'Invalid Date') {
            formattedExpiryDate = parsedDate;
          }
        }
      }
      
      // 更新用户的其他会员信息（包括到期时间）
      const updatedUser = await realAuthService.getUserById(userId);
      if (updatedUser) {
        // 更新到期时间
        updatedUser.membershipInfo.expiryDate = formattedExpiryDate;
        
        // 根据会员等级更新其他相关字段
        switch (membershipLevel) {
          case MembershipLevel.FREE:
            updatedUser.membershipInfo.maxNovels = 3;
            updatedUser.membershipInfo.aiGenerationLimit = 10;
            updatedUser.membershipInfo.teamEnabled = false;
            updatedUser.membershipInfo.maxTeamMembers = 0;
            break;
          case MembershipLevel.BASIC:
            updatedUser.membershipInfo.maxNovels = Infinity;
            updatedUser.membershipInfo.aiGenerationLimit = 100;
            updatedUser.membershipInfo.teamEnabled = false;
            updatedUser.membershipInfo.maxTeamMembers = 0;
            break;
          case MembershipLevel.PROFESSIONAL:
            updatedUser.membershipInfo.maxNovels = Infinity;
            updatedUser.membershipInfo.aiGenerationLimit = Infinity;
            updatedUser.membershipInfo.teamEnabled = true;
            updatedUser.membershipInfo.maxTeamMembers = 10;
            break;
        }
        
        // 更新功能列表
        const features = [
          'novel_creation',
          'basic_editing',
          'txt_export',
          'markdown_export'
        ];
        
        // 根据会员等级添加额外功能
        if (membershipLevel === MembershipLevel.BASIC) {
          features.push(
            'unlimited_novels',
            'enhanced_ai_generation',
            'all_export_formats',
            'spell_check',
            'writing_statistics',
            'basic_cloud_sync'
          );
        } else if (membershipLevel === MembershipLevel.PROFESSIONAL) {
          features.push(
            'unlimited_novels',
            'unlimited_ai_generation',
            'visualization_tools',
            'advanced_export',
            'full_cloud_sync',
            'priority_support',
            'early_access',
            'team_collaboration'
          );
        }
        
        updatedUser.membershipInfo.features = features;
        
        // 更新用户信息
        const updateSuccess = await realAuthService.updateUser(userId, updatedUser);
        if (updateSuccess) {
          console.log('Updating user membership:', userId, membershipLevel, expiryDate);
          message.success('会员等级更新成功');
          return true;
        } else {
          message.error('更新会员信息失败');
          return false;
        }
      }
    }
    
    message.error('更新会员等级失败');
    return false;
  } catch (error) {
    console.error('Failed to update user membership:', error);
    message.error('更新会员等级失败: ' + (error.message || '未知错误'));
    return false;
  }
}

// 更新用户管理员权限
export const updateUserAdminPermission = async (
  userId: string,
  isAdmin: boolean
): Promise<boolean> => {
  try {
    // 验证用户ID
    if (!userId) {
      message.error('用户ID不能为空');
      return false;
    }
    
    // 使用认证服务中的方法更新用户数据
    const user = await realAuthService.getUserById(userId);
    
    if (!user) {
      message.error('用户不存在');
      return false;
    }
    
    // 检查是否尝试修改管理员账户的管理员权限
    if (user.username === 'admin' && !isAdmin) {
      message.error('管理员账户必须保持管理员权限');
      return false;
    }
    
    // 更新认证服务中的用户数据
    const success = await realAuthService.updateUserMembershipInfo(userId, user.membershipInfo.level, Boolean(isAdmin));
    
    if (success) {
      console.log('Updating user admin permission:', userId, isAdmin)
      message.success('管理员权限更新成功')
      return true
    } else {
      message.error('更新管理员权限失败')
      return false
    }
  } catch (error) {
    console.error('Failed to update user admin permission:', error)
    message.error('更新管理员权限失败: ' + (error.message || '未知错误'))
    return false
  }
}

// 添加新用户（用于处理新注册的用户）
export const addUser = async (userInfo: UserInfo, passwordHash?: string): Promise<boolean> => {
  try {
    // 在实际应用中，这里应该调用后端API添加用户
    // 目前我们直接添加到认证服务中
    const user: User = {
      id: userInfo.id,
      email: userInfo.email,
      username: userInfo.username,
      passwordHash: passwordHash || '', // 使用提供的密码哈希或空字符串
      createdAt: userInfo.createdAt,
      lastLoginAt: userInfo.lastLoginAt,
      membershipInfo: {
        level: userInfo.membershipLevel,
        expiryDate: userInfo.expiryDate,
        maxNovels: userInfo.membershipLevel === MembershipLevel.FREE ? 3 : Infinity,
        aiGenerationLimit: userInfo.membershipLevel === MembershipLevel.FREE ? 10 : userInfo.membershipLevel === MembershipLevel.BASIC ? 100 : Infinity,
        aiGenerationUsed: 0,
        features: [],
        teamEnabled: userInfo.membershipLevel === MembershipLevel.PROFESSIONAL,
        maxTeamMembers: userInfo.membershipLevel === MembershipLevel.PROFESSIONAL ? 10 : 0,
        isAdmin: userInfo.isAdmin || false,
        username: userInfo.username,
        email: userInfo.email
      }
    };
    
    // 获取功能列表
    const features = [
      'novel_creation',
      'basic_editing',
      'txt_export',
      'markdown_export'
    ];
    
    // 根据会员等级添加额外功能
    if (userInfo.membershipLevel === MembershipLevel.BASIC) {
      features.push(
        'unlimited_novels',
        'enhanced_ai_generation',
        'all_export_formats',
        'spell_check',
        'writing_statistics',
        'basic_cloud_sync'
      );
    } else if (userInfo.membershipLevel === MembershipLevel.PROFESSIONAL) {
      features.push(
        'unlimited_novels',
        'unlimited_ai_generation',
        'visualization_tools',
        'advanced_export',
        'full_cloud_sync',
        'priority_support',
        'early_access',
        'team_collaboration'
      );
    }
    
    user.membershipInfo.features = features;
    
    // 调用认证服务注册用户
    // 注意：这里我们直接调用内部方法来添加用户，而不是通过注册流程
    const success = await realAuthService.updateUser(userInfo.id, user);
    
    if (success) {
      console.log('Added new user to authService:', userInfo);
      return true;
    } else {
      console.error('Failed to add user to authService:', userInfo);
      return false;
    }
  } catch (error) {
    console.error('Failed to add user:', error);
    return false;
  }
}

// 根据ID查找用户
export const findUserById = async (userId: string): Promise<UserInfo | undefined> => {
  try {
    const user = await realAuthService.getUserById(userId);
    
    if (user) {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        membershipLevel: user.membershipInfo.level,
        expiryDate: user.membershipInfo.expiryDate,
        isAdmin: user.membershipInfo.isAdmin || false,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      };
    }
    
    return undefined;
  } catch (error) {
    console.error('Failed to find user by ID:', error);
    return undefined;
  }
}

// 删除用户（管理员不可删除）
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    // 使用认证服务删除用户
    const user = await realAuthService.getUserById(userId);
    
    if (user) {
      // 使用管理员保护服务检查是否允许删除
      const deleteCheck = canDeleteUser(user);
      if (!deleteCheck.allowed) {
        message.error(deleteCheck.message);
        return false;
      }
      
      // 调用认证服务删除用户
      const success = await realAuthService.deleteUser(userId);
      
      if (success) {
        console.log('Deleting user:', userId)
        message.success('用户删除成功')
        return true
      } else {
        message.error('删除用户失败')
        return false
      }
    }
    
    message.error('用户不存在')
    return false
  } catch (error) {
    console.error('Failed to delete user:', error)
    message.error('删除用户失败')
    return false
  }
}

// 管理员修改用户密码
export const adminChangeUserPassword = async (adminEmail: string, targetEmail: string, newPassword: string): Promise<boolean> => {
  try {
    // 调用API服务修改用户密码
    const response = await apiService.users.adminChangePassword(adminEmail, targetEmail, newPassword);
    
    if (response.success) {
      message.success(response.message || '用户密码修改成功');
      return true;
    } else {
      message.error(response.message || '密码修改失败');
      return false;
    }
  } catch (error) {
    console.error('Failed to change user password by admin:', error);
    message.error('密码修改失败');
    return false;
  }
}

// 使用AI生成次数
export const useAIGeneration = async (userId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // 获取用户信息
    const user = await realAuthService.getUserById(userId);
    
    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }
    
    // 检查是否还有AI生成次数
    if (user.membershipInfo.aiGenerationUsed >= user.membershipInfo.aiGenerationLimit) {
      return {
        success: false,
        message: 'AI生成次数已用完，请升级会员或等待每日重置'
      };
    }
    
    // 增加AI生成使用次数
    const newUsedCount = user.membershipInfo.aiGenerationUsed + 1;
    
    // 更新用户信息
    const updateSuccess = await realAuthService.updateUser(userId, {
      membershipInfo: {
        ...user.membershipInfo,
        aiGenerationUsed: newUsedCount
      }
    });
    
    if (updateSuccess) {
      console.log(`User ${userId} used AI generation, count: ${newUsedCount}`);
      return {
        success: true,
        message: 'AI生成次数使用成功'
      };
    } else {
      return {
        success: false,
        message: '更新AI生成次数失败'
      };
    }
  } catch (error) {
    console.error('Failed to use AI generation:', error);
    return {
      success: false,
      message: '使用AI生成次数时发生错误'
    };
  }
};

// 重置AI生成次数（管理员功能）
export const resetAIGeneration = async (userId: string): Promise<boolean> => {
  try {
    // 获取用户信息
    const user = await realAuthService.getUserById(userId);
    
    if (!user) {
      return false;
    }
    
    // 重置AI生成使用次数
    const updateSuccess = await realAuthService.updateUser(userId, {
      membershipInfo: {
        ...user.membershipInfo,
        aiGenerationUsed: 0
      }
    });
    
    return updateSuccess;
  } catch (error) {
    console.error('Failed to reset AI generation:', error);
    return false;
  }
};
