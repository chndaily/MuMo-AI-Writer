import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LLMProvider, LLMConfig } from '#/llm'

// 生成唯一ID的函数
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// 支持可选ID的配置类型
type LLMConfigInput = Omit<LLMConfig, 'id'> & { id?: string }

interface LLMConfigState {
  // 配置数据
  configs: LLMConfig[]  // 配置数组，支持多个配置
  defaultConfigId: string | null  // 默认配置的ID
  
  // 模态框状态
  modalVisible: boolean
  editingConfigId: string | null  // 正在编辑的配置ID
  isEditMode: boolean

  // 操作方法
  addConfig: (config: LLMConfigInput) => void
  updateConfig: (configId: string, config: Omit<LLMConfig, 'id'>) => void
  removeConfig: (configId: string) => boolean
  getConfig: (configId: string) => LLMConfig | undefined
  getAllConfigs: () => LLMConfig[]
  getConfigsByProvider: (provider: LLMProvider) => LLMConfig[]
  setDefaultConfig: (configId: string) => void
  getDefaultConfig: () => LLMConfig | undefined
  
  // 模态框操作
  openAddModal: () => void
  openEditModal: (configId: string) => void
  closeModal: () => void
}

export const useLLMConfigStore = create<LLMConfigState>()(
  persist(
    (set, get) => ({
      // 初始状态
      configs: [],
      defaultConfigId: null,
      modalVisible: false,
      editingConfigId: null,
      isEditMode: false,

      // 配置操作方法
      addConfig: (config: LLMConfigInput) => {
        const newConfig: LLMConfig = {
          ...config,
          id: config.id || generateId(),
        }
        
        set((state) => {
          const newConfigs = [...state.configs, newConfig]
          return { 
            configs: newConfigs,
            // 如果是第一个配置，设为默认
            defaultConfigId: state.configs.length === 0 ? newConfig.id : state.defaultConfigId
          }
        })
      },

      updateConfig: (configId: string, config: Omit<LLMConfig, 'id'>) => {
        set((state) => {
          const newConfigs = state.configs.map(c => 
            c.id === configId ? { ...config, id: configId } : c
          )
          return { configs: newConfigs }
        })
      },

      removeConfig: (configId: string) => {
        const state = get()
        const configIndex = state.configs.findIndex(c => c.id === configId)
        
        if (configIndex === -1) {
          return false
        }
        
        const newConfigs = state.configs.filter(c => c.id !== configId)
        let newDefaultConfigId = state.defaultConfigId
        
        // 如果删除的是默认配置，需要重新选择默认
        if (state.defaultConfigId === configId && newConfigs.length > 0) {
          newDefaultConfigId = newConfigs[0].id
        } else if (newConfigs.length === 0) {
          newDefaultConfigId = null
        }
        
        set({ 
          configs: newConfigs,
          defaultConfigId: newDefaultConfigId
        })
        
        return true
      },

      getConfig: (configId: string) => {
        return get().configs.find(c => c.id === configId)
      },

      getAllConfigs: () => {
        const configs = get().configs
        console.log('LLMConfigStore getAllConfigs:', configs)
        return configs
      },

      getConfigsByProvider: (provider: LLMProvider) => {
        return get().configs.filter(c => c.provider === provider)
      },

      setDefaultConfig: (configId: string) => {
        set({ defaultConfigId: configId })
      },

      getDefaultConfig: () => {
        const state = get()
        if (!state.defaultConfigId) return undefined
        return state.configs.find(c => c.id === state.defaultConfigId)
      },

      // 模态框操作
      openAddModal: () => {
        set({ 
          modalVisible: true, 
          isEditMode: false, 
          editingConfigId: null 
        })
      },

      openEditModal: (configId: string) => {
        set({ 
          modalVisible: true, 
          isEditMode: true, 
          editingConfigId: configId 
        })
      },

      closeModal: () => {
        set({ 
          modalVisible: false, 
          isEditMode: false, 
          editingConfigId: null 
        })
      },
    }),
    {
      name: 'llm-config-storage',
      partialize: (state) => ({
        configs: state.configs,
        defaultConfigId: state.defaultConfigId,
      }),
    }
  )
)