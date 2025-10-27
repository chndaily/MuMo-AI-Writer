// 格式化日期
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 格式化时间
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化字数
export const formatWordCount = (count: number): string => {
  if (count < 1000) {
    return `${count}字`
  } else if (count < 10000) {
    return `${(count / 1000).toFixed(1)}千字`
  } else {
    return `${(count / 10000).toFixed(1)}万字`
  }
}

// 计算阅读时间（假设每分钟300字）
export const calculateReadingTime = (wordCount: number): string => {
  const minutes = Math.ceil(wordCount / 300)
  if (minutes < 60) {
    return `${minutes}分钟`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
  }
}

// 生成随机ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 本地存储工具
export const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  },
}

// 验证函数
export const validators = {
  isNotEmpty: (value: string): boolean => {
    return value.trim().length > 0
  },
  isValidTitle: (title: string): boolean => {
    return title.trim().length >= 2 && title.trim().length <= 100
  },
  isValidContent: (content: string): boolean => {
    return content.trim().length >= 10
  },
}

// 小说类型映射
export const genreMap = {
  fantasy: '奇幻',
  romance: '言情',
  mystery: '悬疑',
  scifi: '科幻',
  historical: '历史',
  modern: '现代',
  martial: '武侠',
  horror: '恐怖',
  comedy: '喜剧',
  drama: '剧情',
} as const

export type GenreType = keyof typeof genreMap 