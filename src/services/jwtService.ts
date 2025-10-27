// JWT服务 - 处理前端和后端的JWT差异
import { apiService } from '@/services/apiService'

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined';

// 前端JWT处理函数（通过API服务）
async function generateTokenBrowser(payload: any, secret: string, options: any): Promise<string> {
  // 在浏览器环境中，我们通过API服务请求后端生成token
  try {
    const response = await apiService.users.generateToken(payload, secret, options);
    return response.token;
  } catch (error) {
    console.error('Failed to generate token via API:', error);
    throw new Error('Failed to generate token');
  }
}

async function verifyTokenBrowser(token: string, secret: string): Promise<any> {
  // 在浏览器环境中，我们通过API服务请求后端验证token
  try {
    const response = await apiService.users.verifyToken(token, secret);
    return response.payload;
  } catch (error) {
    console.error('Failed to verify token via API:', error);
    throw new Error('Failed to verify token');
  }
}

// 后端JWT处理函数（使用jsonwebtoken库）
async function generateTokenServer(payload: any, secret: string, options: any): Promise<string> {
  try {
    // 动态导入jsonwebtoken以避免在浏览器中导入
    const jwt = await import('jsonwebtoken');
    return jwt.default.sign(payload, secret, options);
  } catch (error) {
    console.error('Failed to import jsonwebtoken:', error);
    throw new Error('jsonwebtoken is not available in this environment');
  }
}

async function verifyTokenServer(token: string, secret: string): Promise<any> {
  try {
    // 动态导入jsonwebtoken以避免在浏览器中导入
    const jwt = await import('jsonwebtoken');
    return jwt.default.verify(token, secret);
  } catch (error) {
    console.error('Failed to import jsonwebtoken:', error);
    throw new Error('jsonwebtoken is not available in this environment');
  }
}

// JWT服务
export class JWTService {
  // 生成token
  static async sign(payload: any, secret: string, options: any): Promise<string> {
    if (isBrowser) {
      return await generateTokenBrowser(payload, secret, options);
    } else {
      return await generateTokenServer(payload, secret, options);
    }
  }
  
  // 验证token
  static async verify(token: string, secret: string): Promise<any> {
    if (isBrowser) {
      return await verifyTokenBrowser(token, secret);
    } else {
      return await verifyTokenServer(token, secret);
    }
  }
}