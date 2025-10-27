// 小说类型
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
  author?: string
  targetWordCount?: number
  isPublic?: boolean
  // 添加用户关联字段
  userId?: string
}

// 章节类型
export interface Chapter {
  id: string
  novelId: string
  title: string
  content: string
  order: number
  wordCount: number
  createdAt: string
  lastModified: string
  status: 'draft' | 'published' | 'archived'
  summary?: string
  notes?: string
  isLocked?: boolean
}

export interface ChapterVersion {
  id: string
  chapterId: string
  content: string
  wordCount: number
  createdAt: string
  versionName?: string
  summary?: string
}

// 小说类型定义
export interface NovelGenre {
  id: string
  name: string
  displayName: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
  createdAt: string
}

// 小说标签
export interface NovelTag {
  id: string
  name: string
  color?: string
  usageCount: number
  createdAt: string
}

// 小说大纲
export interface NovelOutline {
  id: string
  novelId: string
  title: string
  content: string
  type: 'main' | 'chapter' | 'character' | 'world' | 'scene'
  order: number
  parentId?: string // 添加父级ID，用于层级结构
  createdAt: string
  lastModified: string
  summary?: string // 添加摘要字段，用于存储章节内容的摘要
}

// 角色信息
export interface Character {
  id: string
  novelId: string
  name: string
  description: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'side' | 'foil' | 'mentor' | 'loveInterest' | 'rival' | 'neutral' | 'keySupporting' | 'minorSupporting' | 'complexSupporting'
  appearance?: string
  personality?: string
  background?: string
  relationships?: string
  abilities?: string
  characterArc?: string
  details?: string
  tags?: string[]
  // 扩展标签系统支持
  professionTags?: string[]  // 职业标签
  personalityTags?: string[]  // 性格标签
  functionTags?: string[]  // 功能标签
  createdAt: string
  lastModified: string
}

// 地点信息
export interface Location {
  id: string
  novelId?: string
  name: string
  description: string
  type: string  // 修改为字符串类型，支持AI生成的内容
  importance: string  // 修改为字符串类型，支持AI生成的内容
  geography?: string
  climate?: string
  terrain?: string  // 添加地形特征字段
  naturalResources?: string  // 添加自然资源字段
  ecosystem?: string  // 添加生态环境字段
  architecture?: string  // 添加建筑风格字段
  socialStructure?: string  // 添加社会结构字段
  culture?: string  // 添加文化特色字段
  historyBackground?: string  // 添加历史背景字段
  politics?: string
  governance?: string  // 添加统治体系字段
  laws?: string  // 添加法律法规字段
  economy?: string
  mainIndustries?: string  // 添加主要产业字段
  trade?: string  // 添加贸易情况字段
  wealth?: string  // 添加财富水平字段
  details?: string  // 添加细节补充字段
  tags?: string[]  // 添加标签字段
  // 添加locationType字段以支持AI生成的具体类型值
  locationType?: string  // AI生成的具体地点类型描述
  createdAt: string
  lastModified?: string
}

// 世界观设定
export interface WorldSetting {
  id: string
  novelId: string
  name: string
  description: string
  type: 'culture' | 'technology' | 'magic' | 'history'
  tags?: string[]
  createdAt: string
  lastModified: string
  // 文化设定特有字段
  traditions?: string
  values?: string
  arts?: string
  // 扩展文化设定字段
  language?: string
  religion?: string
  customs?: string
  festivals?: string
  art?: string
  socialStructure?: string
  education?: string
  technology?: string
  details?: string
  cultureInteraction?: string  // 添加文化互动字段
  // 科技设定特有字段
  level?: string
  applications?: string
  limitations?: string
  // 魔法设定特有字段
  system?: string
  sources?: string
  rules?: string
  spells?: string
  artifacts?: string
  worldRelation?: string  // 添加世界观关联字段
  // 历史设定特有字段
  timeline?: string
  events?: string
  figures?: string
  consequences?: string
}

// 写作统计
export interface WritingStats {
  totalWords: number
  totalNovels: number
  averageWordsPerNovel: number
  writingStreak: number
  totalWritingTime: number
  completedNovels: number
  lastWritingDate?: string
  dailyGoal?: number
  weeklyGoal?: number
  monthlyGoal?: number
}

// 搜索过滤条件
export interface SearchFilters {
  keyword?: string
  genre?: string
  status?: string
  dateRange?: [string, string]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  tags?: string[]
  minWordCount?: number
  maxWordCount?: number
}

// 编辑器状态
export interface EditorState {
  content: string
  title: string
  genre: string
  isDirty: boolean
  lastSaved: string | null
  autoSave: boolean
  wordCount: number
  readingTime: number
  cursorPosition?: number
  selection?: {
    start: number
    end: number
  }
}

// 写作记录
export interface WritingRecord {
  id: string
  novelId: string
  title: string
  content: string
  wordCount: number
  writingTime: number // 写作时长（秒）
  createdAt: string
  lastModified: string
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  type: 'writing_session' | 'idea' | 'research' | 'outline' | 'character_development' | 'world_building' | 'plot_development'
  relatedChapterId?: string // 关联的章节ID
  relatedCharacterId?: string // 关联的角色ID
  relatedLocationId?: string // 关联的地点ID
  mood?: string // 写作时的心情
  productivity?: number // 生产力评分 (1-10)
  notes?: string // 备注
  version?: number // 版本号
}
