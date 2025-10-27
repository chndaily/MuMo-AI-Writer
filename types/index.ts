// 小说相关类型
export interface Novel {
  id: string
  title: string
  content: string
  genre: string
  wordCount: number
  progress: number
  lastModified: string
  status: 'draft' | 'publishing' | 'completed'
  createdAt: string
  description?: string
  tags?: string[]
  coverImage?: string
}

// 用户相关类型
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: string
  lastLogin: string
}

// AI相关类型
export interface AIRequest {
  type: 'plot' | 'character' | 'style' | 'continue'
  content: string
  context?: string
  options?: Record<string, any>
}

export interface AIResponse {
  success: boolean
  data?: string
  error?: string
  suggestions?: string[]
}

// 编辑器相关类型
export interface EditorState {
  content: string
  title: string
  genre: string
  isDirty: boolean
  lastSaved: string | null
  autoSave: boolean
}

// 统计相关类型
export interface WritingStats {
  totalWords: number
  totalNovels: number
  averageWordsPerNovel: number
  writingStreak: number
  totalWritingTime: number
  completedNovels: number
}

// 主题相关类型
export interface Theme {
  primary: string
  secondary: string
  background: string
  text: string
  border: string
}

// 设置相关类型
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  autoSave: boolean
  autoSaveInterval: number
  editorFontSize: number
  editorFontFamily: string
  showWordCount: boolean
  showReadingTime: boolean
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: number
}

// 分页类型
export interface Pagination {
  current: number
  pageSize: number
  total: number
}

// 搜索过滤类型
export interface SearchFilters {
  keyword?: string
  genre?: string
  status?: string
  dateRange?: [string, string]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 导出类型
export interface ExportOptions {
  format: 'txt' | 'docx' | 'pdf' | 'epub'
  includeMetadata: boolean
  includeCover: boolean
  customStyles: boolean
}

// 通知类型
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
} 