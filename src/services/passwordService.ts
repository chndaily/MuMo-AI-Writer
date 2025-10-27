// 密码处理服务 - 处理前端和后端的密码哈希差异
import { apiService } from '@/services/apiService'

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 前端密码验证函数（在浏览器环境中不直接处理密码）
async function verifyPasswordBrowser(email: string, password: string): Promise<boolean> {
  // 在浏览器环境中，我们不直接处理密码验证，而是通过后端API
  console.warn('Password verification should be done through backend API in browser environment');
  return true; // 临时返回true
}

// 前端密码哈希函数（在浏览器环境中不进行哈希处理）
async function hashPasswordBrowser(password: string): Promise<string> {
  // 在浏览器环境中，我们不进行哈希处理，实际哈希应该在后端进行
  console.warn('Password hashing in browser environment is not secure, should be done in backend');
  return password; // 临时返回原密码
}

// 后端密码哈希函数（使用bcrypt）
async function hashPasswordServer(password: string): Promise<string> {
  try {
    // 动态导入bcrypt以避免在浏览器中导入
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    return await bcrypt.default.hash(password, saltRounds);
  } catch (error) {
    console.error('Failed to import bcrypt:', error);
    throw new Error('bcrypt is not available in this environment');
  }
}

// 后端密码验证函数（使用bcrypt）
async function verifyPasswordServer(email: string, password: string): Promise<boolean> {
  try {
    // 在后端环境中，我们直接使用bcrypt验证密码
    // 但为了演示目的，我们仍然通过API服务进行验证
    const response = await apiService.users.verifyPassword(email, password);
    return response.success;
  } catch (error) {
    console.error('Failed to verify password:', error);
    return false;
  }
}

// 密码哈希服务
export class PasswordService {
  // 哈希密码
  static async hashPassword(password: string): Promise<string> {
    if (isBrowser) {
      // 在浏览器环境中，不进行哈希处理，实际哈希应该在后端进行
      return await hashPasswordBrowser(password);
    } else {
      return await hashPasswordServer(password);
    }
  }
  
  // 验证密码
  static async verifyPassword(email: string, password: string): Promise<boolean> {
    if (isBrowser) {
      // 在浏览器环境中，我们不直接验证密码
      console.warn('Password verification should be done through backend API in browser environment');
      return true; // 临时返回true
    } else {
      return await verifyPasswordServer(email, password);
    }
  }
}