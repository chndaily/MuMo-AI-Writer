import { Request, Response, NextFunction } from 'express';
import { MongoClient } from 'mongodb';
import jwt from 'jsonwebtoken';

// JWT密钥（应该与服务器端保持一致）
const JWT_SECRET = 'mumo-ai-writing-jwt-secret-key';

/**
 * 认证中间件
 * 验证请求中的JWT token并设置用户信息
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头中获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '缺少认证token' });
    }
    
    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    // 验证token
    const payload: any = jwt.verify(token, JWT_SECRET);
    
    // 将用户信息添加到请求对象中
    (req as any).user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username
    };
    
    next();
  } catch (error) {
    console.error('认证失败:', error);
    return res.status(401).json({ error: '认证失败' });
  }
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续处理请求
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 从请求头中获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 没有token，继续处理请求
      next();
      return;
    }
    
    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    // 验证token
    const payload: any = jwt.verify(token, JWT_SECRET);
    
    // 将用户信息添加到请求对象中
    (req as any).user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username
    };
    
    next();
  } catch (error) {
    console.error('可选认证失败:', error);
    // 即使认证失败也继续处理请求
    next();
  }
};