/**
 * 通用 UUID 生成工具
 * 在浏览器环境中使用 Web Crypto API
 * 在 Node.js 环境中使用 crypto 模块
 */

/**
 * 生成 UUID 的兼容函数
 * @returns {string} UUID 字符串
 */
export function generateUUID(): string {
  // 浏览器环境 - 使用 Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch (error) {
      console.warn('Web Crypto API 不可用，使用 fallback UUID 生成器', error);
    }
  }
  
  // Node.js 环境
  if (typeof global !== 'undefined' && global.require) {
    try {
      const { randomUUID } = global.require('crypto');
      return randomUUID();
    } catch (error) {
      // 如果无法加载 crypto 模块，继续使用 fallback
      console.warn('无法加载 crypto 模块，使用 fallback UUID 生成器');
    }
  }
  
  // Fallback: 简单的 UUID 生成器
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}