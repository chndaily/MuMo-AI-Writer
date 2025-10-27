import { CollectionMap, Collection, CollectionType, CollectionState, PromptType } from "#/promptLibrary"
import caseLibraryExamples from "./caseLibraryExamples"

const collections: Collection[] = [
  {
    id: "sys_2vgcKGyhrSc22NnFa0Z1iF2oS2z",
    type: CollectionType.Models,
    meta: {
      state: CollectionState.Active,
      createdAt: new Date(2025, 3, 13, 0, 0, 0).toISOString(),
      updatedAt: new Date(2025, 3, 13, 0, 0, 0).toISOString()
    },
    attributes: {
      name: "Default Chat Models",
      models: [{
        internalId: "2k1swil5LhcWeqHT6FGP1N4dozn",
        name: "OpenAI GPT-4o mini",
        id: "openai/gpt-4o-mini-2024-07-18",
      }, {
        internalId: "2gQfzz0It4Bk3lpkloBHsrC8U2O",
        name: "GPT-4o",
        id: "openai/gpt-4o-2024-05-13",
      }, {
        internalId: "2uAQ5OR0L930nbSYVNR9YffvmN7",
        name: "Claude 3.7 - Sonnet",
        id: "anthropic/claude-3.7-sonnet:beta",
        maxTokens: 8192,
        temperature: 1,
        topP: .9,
      }, {
        internalId: "2i9e0oJhtwqIIEoAwPmqaREkcLq",
        name: "Claude 3.5 - Sonnet",
        id: "anthropic/claude-3.5-sonnet:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
      }, {
        internalId: "2dFHZONebFjbxeWsp4axXyRUPZj",
        name: "Claude 3 - Opus",
        id: "anthropic/claude-3-opus:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
      }, {
        internalId: "2kQXy9739142K9j8Z6n7H0b3p1v",
        name: "Gemini 1.5 Pro",
        id: "google/gemini-pro-1.5",
      }, {
        internalId: "2mRZ1a84A253L0k9X7o8I1c4q2w",
        name: "Gemini 1.5 Flash",
        id: "google/gemini-flash-1.5",
      }]
    },
    relationships: {
      owner: {
        id: "system",
        type: "users"
      }
    }
  },
  {
    id: "sys_2vgcKGyhrSc22NnFa0Z1iF2oS3z",
    type: CollectionType.Models,
    meta: {
      state: CollectionState.Active,
      createdAt: new Date(2025, 3, 13, 0, 0, 0).toISOString(),
      updatedAt: new Date(2025, 3, 13, 0, 0, 0).toISOString()
    },
    attributes: {
      name: "Default Summarization",
      models: [{
        internalId: "2k1swil5LhcWeqHT6FGP1N4dozn1",
        name: "GPT-4o mini",
        id: "openai/gpt-4o-mini-2024-07-18",
      }]
    },
    relationships: {
      owner: {
        id: "system",
        type: "users"
      }
    }
  },
  {
    id: "sys_2vgcKGyhrSc22NnFa0Z1iF2oS4z",
    type: CollectionType.Models,
    meta: {
      state: CollectionState.Active,
      createdAt: new Date(2025, 3, 13, 0, 0, 0).toISOString(),
      updatedAt: new Date(2025, 3, 13, 0, 0, 0).toISOString()
    },
    attributes: {
      name: "Default Text Replacements",
      models: [{
        internalId: "2k1swil5LhcWeqHT6FGP1N4dozn2",
        name: "GPT-4o mini",
        id: "openai/gpt-4o-mini-2024-07-18",
      }]
    },
    relationships: {
      owner: {
        id: "system",
        type: "users"
      }
    }
  },
  {
    id: "sys_2vgcKGyhrSc22NnFa0Z1iF2oS5z",
    type: CollectionType.Models,
    meta: {
      state: CollectionState.Active,
      createdAt: new Date(2025, 3, 13, 0, 0, 0).toISOString(),
      updatedAt: new Date(2025, 3, 13, 0, 0, 0).toISOString()
    },
    attributes: {
      name: "Default Writing Models",
      models: [{
        internalId: "2k1swil5LhcWeqHT6FGP1N4dozn3",
        name: "GPT-4o",
        id: "openai/gpt-4o-2024-05-13",
      }]
    },
    relationships: {
      owner: {
        id: "system",
        type: "users"
      }
    }
  },
  // 添加案例库示例
  ...caseLibraryExamples
]

export default {
  collections
}
