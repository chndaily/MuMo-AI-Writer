export interface TextDefine {
  placeholder?: string
  richText?: boolean
}

export interface DropdownDefine {
  options: {
    id: string
    label: string
    color?: string
    description?: string
    value?: string
  }[]
}

export type InputType = 'dropdown' | 'text' | 'checkbox' | 'uiDropdown' | 'html' | "act" | "chapter" | "codex" | "fullNovel" | "label" | "scene" | "snippet"


export interface InputSettings {
  dropdown?: DropdownDefine
  text?: TextDefine
  codex?: {
    types: ("character" | "location" | "lore" | "object" | "other" | "subplot")[]
  }
  chapter?: {
    mode: 'summary' | 'content'
  }
  scene?: {
    mode: 'summary' | 'content'
  }
}

export interface PromptInputSchema {
  id: string
  name: string
  description: string
  required: boolean
  mode: 'multiple' | 'single'
  types: InputType[]
  addToContext: boolean
  hideInput: boolean
  displayName: string
  default?: ({
    type: InputType
    value: string
  } | {
    type: InputType
    id: string
  })[]
  settings?: InputSettings
}