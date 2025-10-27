/**
 * 统一错误处理工具
 * 提供更详细和一致的错误处理机制
 */

// 自定义错误类型
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, any>,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string,
    public status?: number,
    details?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, 'NETWORK_ERROR', details, originalError);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, 'VALIDATION_ERROR', details, originalError);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    details?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, 'DATABASE_ERROR', details, originalError);
    this.name = 'DatabaseError';
  }
}

export class SyncError extends AppError {
  constructor(
    message: string,
    details?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, 'SYNC_ERROR', details, originalError);
    this.name = 'SyncError';
  }
}

// 错误处理工具类
export class ErrorHandler {
  /**
   * 格式化错误信息
   */
  static formatError(error: unknown): string {
    if (error instanceof AppError) {
      return `[${error.name}] ${error.message}`;
    }
    
    if (error instanceof Error) {
      return `[Error] ${error.message}`;
    }
    
    return `[Unknown Error] ${String(error)}`;
  }

  /**
   * 记录错误日志
   */
  static logError(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const errorMessage = this.formatError(error);
    const logMessage = context ? `[${timestamp}] ${context}: ${errorMessage}` : `[${timestamp}] ${errorMessage}`;
    
    console.error(logMessage);
    
    // 如果是AppError，记录详细信息
    if (error instanceof AppError) {
      console.error('Error Details:', {
        code: error.code,
        details: error.details,
        originalError: error.originalError
      });
    }
  }

  /**
   * 包装异步操作，提供统一的错误处理
   */
  static async wrapAsync<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.logError(error, context);
      return null;
    }
  }

  /**
   * 包装同步操作，提供统一的错误处理
   */
  static wrapSync<T>(
    operation: () => T,
    context?: string
  ): T | null {
    try {
      return operation();
    } catch (error) {
      this.logError(error, context);
      return null;
    }
  }

  /**
   * 创建网络错误
   */
  static createNetworkError(error: unknown, status?: number): NetworkError {
    let message = '网络请求失败';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    return new NetworkError(message, status, undefined, 
      error instanceof Error ? error : undefined);
  }

  /**
   * 创建数据库错误
   */
  static createDatabaseError(error: unknown, operation?: string): DatabaseError {
    let message = '数据库操作失败';
    
    if (operation) {
      message = `数据库${operation}操作失败`;
    }
    
    if (error instanceof Error) {
      message = `${message}: ${error.message}`;
    } else if (typeof error === 'string') {
      message = `${message}: ${error}`;
    }
    
    return new DatabaseError(message, undefined, 
      error instanceof Error ? error : undefined);
  }

  /**
   * 创建同步错误
   */
  static createSyncError(error: unknown, operation?: string): SyncError {
    let message = '数据同步失败';
    
    if (operation) {
      message = `数据${operation}同步失败`;
    }
    
    if (error instanceof Error) {
      message = `${message}: ${error.message}`;
    } else if (typeof error === 'string') {
      message = `${message}: ${error}`;
    }
    
    return new SyncError(message, undefined, 
      error instanceof Error ? error : undefined);
  }

  /**
   * 重试机制
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: unknown;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries) {
          this.logError(error, `${context} - 第${i + 1}次重试失败`);
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }
}

// 导出常用的错误处理函数
export const formatError = ErrorHandler.formatError;
export const logError = ErrorHandler.logError;
export const wrapAsync = ErrorHandler.wrapAsync;
export const wrapSync = ErrorHandler.wrapSync;
export const createNetworkError = ErrorHandler.createNetworkError;
export const createDatabaseError = ErrorHandler.createDatabaseError;
export const createSyncError = ErrorHandler.createSyncError;
export const retry = ErrorHandler.retry;

export default ErrorHandler;