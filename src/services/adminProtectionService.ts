// 管理员保护服务
import { User } from '@/services/realAuthService'
import { MembershipLevel } from '@/stores/membershipStore'
import { message } from 'antd'

// 管理员账户用户名
const ADMIN_USERNAME = 'admin'

// 检查是否为管理员账户
export const isUserAdminAccount = (user: User | string): boolean => {
  const username = typeof user === 'string' ? user : user.username
  return username === ADMIN_USERNAME
}

// 验证管理员账户修改操作
export const validateAdminAccountModification = (
  user: User,
  updates: Partial<User>
): { valid: boolean; message?: string } => {
  // 如果不是管理员账户，直接允许修改
  if (!isUserAdminAccount(user)) {
    return { valid: true }
  }

  // 检查是否尝试修改管理员账户的核心属性
  if (updates.email && updates.email !== user.email) {
    return {
      valid: false,
      message: '管理员账户的邮箱不能被修改'
    }
  }

  if (updates.username && updates.username !== user.username) {
    return {
      valid: false,
      message: '管理员账户的用户名不能被修改'
    }
  }

  // 检查会员信息修改
  if (updates.membershipInfo) {
    if (
      updates.membershipInfo.level &&
      updates.membershipInfo.level !== MembershipLevel.PROFESSIONAL
    ) {
      return {
        valid: false,
        message: '管理员账户必须保持专业会员等级'
      }
    }

    if (updates.membershipInfo.isAdmin === false) {
      return {
        valid: false,
        message: '管理员账户必须保持管理员权限'
      }
    }
  }

  return { valid: true }
}

// 安全更新用户信息
export const safeUpdateUser = (
  user: User,
  updates: Partial<User>
): { success: boolean; message?: string } => {
  // 验证修改操作
  const validation = validateAdminAccountModification(user, updates)
  if (!validation.valid) {
    message.error(validation.message)
    return { success: false, message: validation.message }
  }

  // 应用更新
  try {
    if (updates.email) user.email = updates.email
    if (updates.username) user.username = updates.username
    if (updates.membershipInfo) {
      Object.assign(user.membershipInfo, updates.membershipInfo)
    }

    return { success: true }
  } catch (error) {
    const errorMsg = '更新用户信息失败'
    message.error(errorMsg)
    return { success: false, message: errorMsg }
  }
}

// 检查删除操作是否允许
export const canDeleteUser = (user: User): { allowed: boolean; message?: string } => {
  if (isUserAdminAccount(user)) {
    return {
      allowed: false,
      message: '无法删除管理员账户'
    }
  }

  return { allowed: true }
}