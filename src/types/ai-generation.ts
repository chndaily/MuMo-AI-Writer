import { Novel, NovelOutline, Character, Location } from '#/novel';

// AI生成类型
export type AIGenerationType = 'outline' | 'plot' | 'character' | 'location' | 'culture' | 'technology' | 'magic' | 'history' | 'optimize' | 'content';

// 世界观设定类型
export type WorldSettingType = 'character' | 'location' | 'culture' | 'technology' | 'magic' | 'history' | 'item' | 'event' | 'organization' | 'concept' | 'artifact' | 'species' | 'spell' | 'creature' | 'faction';

// AI生成请求接口
export interface AIGenerationRequest {
  type: AIGenerationType;
  novelId: string;
  context?: {
    existingContent?: string;
    targetChapter?: string;
    characterName?: string;
    settingType?: WorldSettingType;
    specificRequirement?: string;
  };
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// AI生成响应接口
export interface AIGenerationResponse {
  id: string;
  type: AIGenerationType;
  novelId: string;
  content: string;
  timestamp: string;
  metadata?: {
    tokenCount?: number;
    processingTime?: number;
    model?: string;
  };
}

// 同步选项接口
export interface SyncOption {
  key: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  targetModule: 'outline' | 'character' | 'worldview' | 'location' | 'content';
}

// 同步结果接口
export interface SyncResult {
  success: boolean;
  message: string;
  syncedItems?: number;
  errors?: string[];
  performance?: {
    duration: number;
    timestamp: number;
  };
}

// 内容解析器接口
export interface ContentParser {
  parseOutlineContent(content: string): Partial<NovelOutline>[];
  parseCharacterContent(content: string): Partial<Character>;
  parseLocationContent(content: string): Partial<Location>;
  parseWorldSettingContent(content: string, type: WorldSettingType): any;
}

// 世界观设定接口
export interface WorldSetting {
  id: string;
  novelId: string;
  type: WorldSettingType;
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  importance: 'high' | 'medium' | 'low';
  createdAt: string;
  lastModified: string;
  
  // 角色特有字段
  name?: string;
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'side' | 'foil' | 'mentor' | 'loveInterest' | 'rival' | 'neutral';
  appearance?: string;
  personality?: string;
  background?: string;
  abilities?: string;
  relationships?: string;
  characterArc?: string;
  details?: string;
  professionTags?: string[];
  personalityTags?: string[];
  functionTags?: string[];
  
  // 地点特有字段
  locationType?: 'city' | 'building' | 'nature' | 'other';
  geography?: string;
  climate?: string;
  politics?: string;
  economy?: string;
  
  // 文化特有字段
  traditions?: string;
  values?: string;
  arts?: string;
  
  // 科技特有字段
  level?: string;
  applications?: string;
  limitations?: string;
  impact?: string;
  
  // 魔法特有字段
  system?: string;
  sources?: string;
  rules?: string;
  spells?: string;
  artifacts?: string;
  worldRelation?: string;
  
  // 历史特有字段
  timeline?: string;
  events?: string;
  figures?: string;
  consequences?: string;
}