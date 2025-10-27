import { PromptInputSchema } from "./promptInput"

/**
 * 集合类型
 */
export enum CollectionType {
  Prompts = "prompts",
  Defaults = "promptDefaults",
  Personas = "promptPersonas",
  Presets = "promptPresets",
  Models = "modelBanks",
  ModelLinks = "modelBankLinks",
}

export enum CollectionState {
  Active = "active",
  Inactive = "inactive",
}

export type CollectionMeta = {
  state: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export enum PromptType {
  Other = "Other",
  Component = "Component",
  SceneCharacterDetection = "scene-character-detection",
  SceneSummarization = "scene-summarization",
  SceneBeatCompletion = "scene-beat-completion",
  ManuscriptCompletion = "manuscript-completion",
  ManuscriptReplacement = "manuscript-replacement",
  WorkshopChat = "workshop-chat",
}


export type FeaturedType = Exclude<CollectionType, CollectionType.ModelLinks | CollectionType.Prompts>

export type PromptMessage = {
  type: "system" | "user" | "assistant",
  text: string,
  format: string,
  id?: string,
}

// 标签接口
export interface Tag {
  id: string;
  name: string;
  type: 'public' | 'novel' | 'private';
}

/**
 * 关系类型
 */
// 用户关系
interface UserRelationship {
  type: 'users'
  id: string
}

// 项目关系
interface ProjectRelationship {
  type: 'novels' | 'series',
  id: string
}



// 关系集合
interface RelationshipCollection {
  owner: UserRelationship
  projects?: ProjectRelationship[]
}


export interface PromptModel {
  internalId: string,
  id: string,
  name: string,
  // 基础设置
  temperature?: number,
  topP?: number,
  frequencyPenalty?: number,
  presencePenalty?: number,
  // 高级设置
  topK?: number,
  minP?: number,
  topA?: number,
  repetitionPenalty?: number,
  maxTokens?: number,
  truncate?: boolean,
  streaming?: boolean,
  systemAsUser?: boolean,
  // 模型路由专用于openRouter
  orRouting?: string[]
  // 模型组
  group?: string
}

interface BaseCollection {
  id: string
  type: CollectionType
  meta: CollectionMeta,
  attributes: {
    name: string,
    // 添加标签属性
    tags?: Tag[];
  }
}

// 模型集合
export interface ModelCollection extends BaseCollection {
  type: CollectionType.Models
  attributes: {
    name: string,
    models: PromptModel[]
    // 添加标签属性
    tags?: Tag[];
  }
  relationships: RelationshipCollection
}

// 提示词集合
export interface PromptCollection extends BaseCollection {
  type: CollectionType.Prompts
  attributes: {
    type: PromptType,
    name: string,
    nsfw?: boolean,
    messages: PromptMessage[],
    models: PromptModel[],
    description?: string | null,
    // 添加附件相关属性
    attachments?: AttachmentInfo[]
    // 添加标签属性
    tags?: Tag[];
  },
  inputs?: Record<string, PromptInputSchema>
  relationships: RelationshipCollection
}

// 默认提示词集合
export interface DefaultPromptCollection extends BaseCollection {
  type: CollectionType.Defaults
  attributes: {
    name: string
    content: string
    category: string
    // 添加标签属性
    tags?: Tag[];
  }
  relationships: RelationshipCollection
}

// 角色集合
export interface PersonaCollection extends BaseCollection {
  type: CollectionType.Personas
  attributes: {
    name: string,
    content: string
    personality: string[]
    background?: string
    // 添加标签属性
    tags?: Tag[];
  }
  relationships: RelationshipCollection
}

// 预设集合
export interface PresetCollection extends BaseCollection {
  type: CollectionType.Presets
  attributes: {
    name: string,
    content: string
    category: string
    // 添加标签属性
    tags?: Tag[];
  }
  relationships: RelationshipCollection
}

// 类型映射函数
export type CollectionMap<T extends CollectionType> =
  T extends CollectionType.Prompts ? PromptCollection :
  T extends CollectionType.Models ? ModelCollection :
  T extends CollectionType.Defaults ? DefaultPromptCollection :
  T extends CollectionType.Personas ? PersonaCollection :
  T extends CollectionType.Presets ? PresetCollection :
  BaseCollection;

export type Collection = PromptCollection | ModelCollection | DefaultPromptCollection | PersonaCollection | PresetCollection

// 添加附件信息接口
export interface AttachmentInfo {
  id: string;           // 附件ID
  name: string;         // 附件名称
  type: string;         // 附件类型 (如 'text/plain')
  size: number;         // 文件大小
  url?: string;         // 附件URL（如果存储在云端）
  content?: string;     // 附件内容（如果存储在本地）
  uploadedAt: string;   // 上传时间
}