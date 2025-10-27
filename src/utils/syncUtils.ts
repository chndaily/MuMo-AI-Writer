/**
 * 数据同步工具类
 */

/**
 * 生成数据唯一标识符
 * @param userId 用户ID
 * @param data 数据对象
 * @param type 数据类型
 * @returns 唯一标识符
 */
export function generateUniqueKey(userId: string, data: any, type: string): string {
  // 使用用户ID、数据类型和内容的哈希值生成唯一键
  const contentString = JSON.stringify({
    title: data.title,
    novelId: data.novelId,
    type: type,
    createdAt: data.createdAt
  });
  
  // 简单哈希函数
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return `${type}_${userId}_${Math.abs(hash)}`;
}

/**
 * 解决数据冲突
 * 使用时间戳策略：保留最新的数据
 * @param localData 本地数据
 * @param remoteData 远程数据
 * @returns 解决冲突后的数据
 */
export function resolveConflict(localData: any, remoteData: any): any {
  // 比较最后修改时间
  const localTime = new Date(localData.lastModified || localData.updatedAt || localData.createdAt).getTime();
  const remoteTime = new Date(remoteData.lastModified || remoteData.updatedAt || remoteData.createdAt).getTime();
  
  // 返回最新的数据
  return localTime >= remoteTime ? localData : remoteData;
}

/**
 * 检查网络状态
 * @returns 网络是否可用
 */
export function isNetworkAvailable(): boolean {
  return navigator.onLine;
}

/**
 * 等待网络连接
 * @param timeout 超时时间（毫秒）
 * @returns 网络是否连接成功
 */
export async function waitForNetwork(timeout: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isNetworkAvailable()) {
      resolve(true);
      return;
    }
    
    const startTime = Date.now();
    
    const checkNetwork = () => {
      if (isNetworkAvailable()) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        resolve(false);
      } else {
        setTimeout(checkNetwork, 1000);
      }
    };
    
    checkNetwork();
  });
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime >= delay) {
      func(...args);
      lastExecTime = currentTime;
    }
  };
}

/**
 * 重试函数
 * @param func 要重试的异步函数
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 函数执行结果
 */
export async function retry<T>(
  func: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        console.log(`函数执行失败，${delay}ms后进行第${i + 1}次重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * 格式化同步统计信息
 * @param stats 同步统计对象
 * @returns 格式化后的字符串
 */
export function formatSyncStats(stats: { synced: number; skipped: number; conflicts: number }): string {
  return `同步 ${stats.synced} 项，跳过 ${stats.skipped} 项，解决 ${stats.conflicts} 个冲突`;
}

/**
 * 检查数据是否需要同步
 * @param lastModified 最后修改时间
 * @param lastSyncTime 最后同步时间
 * @returns 是否需要同步
 */
export function isDataChanged(lastModified: string | Date, lastSyncTime: number): boolean {
  const modifiedTime = new Date(lastModified).getTime();
  return modifiedTime > lastSyncTime;
}