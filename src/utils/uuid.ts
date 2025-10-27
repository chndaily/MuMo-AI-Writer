// UUID相关的类型定义
export interface UUIDOptions {
  length?: number;
  prefix?: string;
  timestamped?: boolean;
  sequential?: boolean;
}

export interface BatchUUIDOptions {
  count: number;
  length?: number;
  unique?: boolean;
}

// 工具函数类型
export type UUIDGenerator = (options?: UUIDOptions) => string;
export type BatchUUIDGenerator = (options: BatchUUIDOptions) => string[];


export function generateFullUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateShortUUID(length: number = 32): string {
  if (length < 1 || length > 32) {
    throw new Error('Length must be between 1 and 32');
  }

  // 使用更安全的随机数生成方法
  const chars = '0123456789abcdef';
  let result = '';

  // 生成指定长度的随机字符串
  for (let i = 0; i < length; i++) {
    // 使用 crypto.randomValues 如果可用，否则回退到 Math.random
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomBytes = new Uint8Array(1);
      crypto.getRandomValues(randomBytes);
      result += chars[randomBytes[0] % chars.length];
    } else {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return result;
}

// 生成更短的UUID，专门用于tiptap节点
export function generateTiptapUUID(): string {
  return generateShortUUID(8); // 8位字符，足够短且唯一性较高
}

// 生成带时间戳的短UUID，用于调试和追踪
export function generateTimestampedUUID(): string {
  const timestamp = Date.now().toString(36); // 转换为36进制，更短
  const random = generateShortUUID(4);
  return `${timestamp}-${random}`;
}

// 生成带前缀的短UUID
export function generatePrefixedUUID(prefix: string, length: number = 8): string {
  if (!prefix || typeof prefix !== 'string') {
    throw new Error('Prefix must be a non-empty string');
  }
  return `${prefix}${generateShortUUID(length - prefix.length)}`;
}

// 验证UUID格式（支持短UUID）
export function isValidUUID(uuid: string, minLength: number = 1): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  if (uuid.length < minLength) return false;

  // 检查是否只包含十六进制字符
  const hexRegex = /^[0-9a-f]+$/i;
  return hexRegex.test(uuid);
}

// 生成递增的短UUID（基于时间）
export function generateSequentialUUID(baseLength: number = 8): string {
  const timestamp = Date.now();
  const random = generateShortUUID(baseLength);
  return `${timestamp.toString(36)}${random}`;
}

// 统一的UUID生成器，支持多种选项
export function generateUUID(options: UUIDOptions = {}): string {
  const {
    length = 32,
    prefix,
    timestamped = false,
    sequential = false
  } = options;

  let uuid: string;

  if (timestamped) {
    uuid = generateTimestampedUUID();
  } else if (sequential) {
    uuid = generateSequentialUUID(length);
  } else {
    uuid = generateShortUUID(length);
  }

  if (prefix) {
    return generatePrefixedUUID(prefix, length);
  }

  return uuid;
}

// 批量UUID生成器，支持去重
export function generateBatchUUIDs(options: BatchUUIDOptions): string[] {
  const { count, length = 32, unique = true } = options;

  if (count < 1 || count > 1000) {
    throw new Error('Count must be between 1 and 1000');
  }

  if (unique) {
    const uuids = new Set<string>();
    while (uuids.size < count) {
      uuids.add(generateShortUUID(length));
    }
    return Array.from(uuids);
  } else {
    return Array.from({ length: count }, () => generateShortUUID(length));
  }
}