import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LLMProvider, LLMConfig, LLMConnection, LLMConnectionModel } from '#/llm'
import { AIServiceType, AIProviderModel, aiProviderFactory } from '@/ai'
import { generateUUID } from '@/utils'
import { mapLLMProviderToAIServiceType, mapAIServiceTypeToLLMProvider } from '@/utils/aiProviderUtils'
import { defaultModelService } from '@/services/defaultModelService'
import { updateDynamicModels, getAllModels as getAllModelPresets } from '@/ai/modelPresets'

// 定时刷新间隔（毫秒）- 24小时
const REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

interface AIServiceState {
  // 配置数据
  configs: LLMConfig[]
  defaultConfigId: string | null
  
  // 连接数据
  connections: LLMConnection[]
  connectionModels: {
    [key in AIServiceType]: LLMConnectionModel[]
  }
  // 管理员配置的默认模型
  adminDefaultModels: LLMConnectionModel[]
  loadingModels: string[]
  
  // 定时刷新相关
  refreshTimer: NodeJS.Timeout | null
  lastRefreshTime: number
  
  // 模态框状态
  modalVisible: boolean
  editingConfigId: string | null
  isEditMode: boolean

  // 配置操作方法
  addConfig: (config: Omit<LLMConfig, 'id'> & { id?: string }) => void
  updateConfig: (configId: string, config: Omit<LLMConfig, 'id'>) => void
  removeConfig: (configId: string) => boolean
  getConfig: (configId: string) => LLMConfig | undefined
  getAllConfigs: () => LLMConfig[]
  getConfigsByProvider: (provider: LLMProvider) => LLMConfig[]
  setDefaultConfig: (configId: string) => void
  getDefaultConfig: () => LLMConfig | undefined
  
  // 管理员默认模型操作方法
  setAdminDefaultModels: (models: LLMConnectionModel[]) => void
  addAdminDefaultModel: (model: LLMConnectionModel) => void
  removeAdminDefaultModel: (modelId: string) => boolean
  clearAllAdminDefaultModels: () => void
  
  // 连接操作方法
  addConnection: (connection: LLMConnection) => void
  updateConnection: (connection: LLMConnection) => void
  removeConnection: (connection: LLMConnection) => boolean
  getConnection: (id?: string) => LLMConnection | undefined
  getAllConnections: () => LLMConnection[]
  refreshModel: (connection: LLMConnection) => Promise<void>
  refreshAllModels: () => Promise<void>
  getAllModels: () => LLMConnectionModel[]
  clearAllModels: () => void
  
  // 定时刷新方法
  startAutoRefresh: () => void
  stopAutoRefresh: () => void
  
  // 模态框操作
  openAddModal: () => void
  openEditModal: (configId: string) => void
  closeModal: () => void
}

// 初始化连接模型状态
const initialConnectionModels = {
  [AIServiceType.OpenAI]: [],
  [AIServiceType.DeepSeek]: [],
  [AIServiceType.Ollama]: [],
  [AIServiceType.OpenRouter]: [],
  [AIServiceType.OpenPipe]: [],
  [AIServiceType.ModelScope]: [],
} as {
  [key in AIServiceType]: LLMConnectionModel[]
}

export const useAIServiceStore = create<AIServiceState>()(
  persist(
    (set, get) => ({
      // 初始状态
      configs: [],
      defaultConfigId: null,
      connections: [],
      connectionModels: initialConnectionModels,
      adminDefaultModels: [],
      loadingModels: [],
      refreshTimer: null,
      lastRefreshTime: 0,
      modalVisible: false,
      editingConfigId: null,
      isEditMode: false,

      // 配置操作方法
      addConfig: (config) => {
        const newConfig = {
          ...config,
          id: config.id || generateUUID(),
        } as LLMConfig;
        
        set((state) => {
          // 检查配置是否已经存在
          const existingConfig = state.configs.find((c) => c.id === newConfig.id);
          if (existingConfig) {
            // 如果配置已经存在，不更新状态以避免不必要的重新渲染
            return {};
          }
          
          return {
            configs: [...state.configs, newConfig]
          };
        });
      },

      updateConfig: (configId, config) => {
        set((state) => {
          // 检查配置是否真正发生变化
          const existingConfig = state.configs.find((c) => c.id === configId);
          if (existingConfig) {
            const configChanged = 
              existingConfig.name !== config.name ||
              existingConfig.model !== config.model ||
              existingConfig.apiKey !== config.apiKey ||
              existingConfig.baseURL !== config.baseURL ||
              existingConfig.provider !== config.provider;
            
            if (!configChanged) {
              // 如果配置没有变化，不更新状态以避免不必要的重新渲染
              return {};
            }
          }
          
          return {
            configs: state.configs.map((c) => 
              c.id === configId ? { ...c, ...config, id: configId } : c
            )
          };
        });
        
        // 同时更新对应的连接
        const { connections, updateConnection } = get();
        const existingConnection = connections.find(c => c.id === configId);
        if (existingConnection) {
          updateConnection({
            ...existingConnection,
            name: config.name,
            apiKey: config.apiKey,
            baseUrl: config.baseURL || '',
            provider: mapLLMProviderToAIServiceType(config.provider) || existingConnection.provider,
          });
        }
      },

      removeConfig: (configId) => {
        const { configs, connections, removeConnection } = get()
        const config = configs.find((c) => c.id === configId)
        
        if (!config) return false
        
        set((state) => ({
          configs: state.configs.filter((c) => c.id !== configId)
        }))
        
        // 同时删除对应的连接
        const connection = connections.find((c) => c.id === configId)
        if (connection) {
          removeConnection(connection)
        }
        
        return true
      },

      getConfig: (configId) => {
        const { configs } = get()
        return configs.find((c) => c.id === configId)
      },

      getAllConfigs: () => {
        const { configs } = get()
        return configs
      },

      getConfigsByProvider: (provider) => {
        const { configs } = get()
        return configs.filter((c) => c.provider === provider)
      },

      setDefaultConfig: (configId) => {
        set({ defaultConfigId: configId })
      },

      getDefaultConfig: () => {
        const { configs, defaultConfigId } = get()
        if (!defaultConfigId) return undefined
        return configs.find((c) => c.id === defaultConfigId)
      },

      // 管理员默认模型操作方法
      setAdminDefaultModels: (models) => {
        set((state) => {
          // 检查模型列表是否真正发生变化
          if (state.adminDefaultModels.length === models.length) {
            const modelsChanged = state.adminDefaultModels.some((model, index) => {
              return model.name !== models[index]?.name;
            });
            
            if (!modelsChanged) {
              // 如果模型列表没有变化，不更新状态以避免不必要的重新渲染
              return {};
            }
          }
          
          return { adminDefaultModels: models };
        });
      },

      addAdminDefaultModel: (model) => {
        set((state) => ({
          adminDefaultModels: [...state.adminDefaultModels, model]
        }));
      },

      removeAdminDefaultModel: (modelId) => {
        const { adminDefaultModels } = get();
        // 使用connectionId来查找模型，而不是名称
        const model = adminDefaultModels.find((m) => m.connectionId === modelId);
        
        if (!model) return false;
        
        set((state) => ({
          // 使用connectionId来过滤模型，而不是名称
          adminDefaultModels: state.adminDefaultModels.filter((m) => m.connectionId !== modelId)
        }));
        
        return true;
      },

      // 清除所有管理员默认模型
      clearAllAdminDefaultModels: () => {
        set({ adminDefaultModels: [] });
      },

      // 连接操作方法
      addConnection: (connection) => {
        set((state) => {
          // 检查连接是否已经存在
          const existingConnection = state.connections.find((c) => c.id === connection.id);
          if (existingConnection) {
            // 如果连接已经存在，不更新状态以避免不必要的重新渲染
            return {};
          }
          
          return {
            connections: [...state.connections, connection]
          };
        });
      },

      updateConnection: (connection) => {
        set((state) => {
          // 检查连接是否真正发生变化
          const existingConnection = state.connections.find((c) => c.id === connection.id);
          if (existingConnection) {
            const connectionChanged = 
              existingConnection.name !== connection.name ||
              existingConnection.apiKey !== connection.apiKey ||
              existingConnection.baseUrl !== connection.baseUrl ||
              existingConnection.provider !== connection.provider ||
              existingConnection.organizationId !== connection.organizationId;
            
            if (!connectionChanged) {
              // 如果连接没有变化，不更新状态以避免不必要的重新渲染
              return {};
            }
          }
          
          return {
            connections: state.connections.map((c) => 
              c.id === connection.id ? { ...c, ...connection } : c
            )
          };
        });
      },

      removeConnection: (connection) => {
        const { connections } = get()
        const existing = connections.find((c) => c.id === connection.id)
        
        if (!existing) return false
        
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== connection.id)
        }))
        
        return true
      },

      getConnection: (id) => {
        const { connections } = get()
        if (!id) return undefined
        return connections.find((c) => c.id === id)
      },

      getAllConnections: () => {
        const { connections } = get()
        return connections
      },

      refreshModel: async (connection) => {
        console.log('refreshModel: Starting with connection:', connection);
        // 检查是否已经在加载此连接的模型
        const { loadingModels } = get();
        if (loadingModels.includes(connection.id)) {
          // 如果已经在加载，直接返回避免重复请求
          console.log('refreshModel: Already loading this connection, skipping');
          return;
        }

        // 设置加载状态
        set((state) => ({
          loadingModels: [...state.loadingModels, connection.id]
        }));

        try {
          // 确保连接存在于store中
          const { connections, addConnection, updateConnection } = get();
          const existingConnection = connections.find(c => c.id === connection.id);
          if (!existingConnection) {
            // 如果连接不存在，添加到store中
            console.log('refreshModel: Adding new connection to store');
            addConnection(connection);
          } else if (
            existingConnection.name !== connection.name ||
            existingConnection.apiKey !== connection.apiKey ||
            existingConnection.baseUrl !== connection.baseUrl ||
            existingConnection.provider !== connection.provider ||
            existingConnection.organizationId !== connection.organizationId
          ) {
            // 如果连接存在但信息有变化，更新连接
            console.log('refreshModel: Updating existing connection in store');
            updateConnection(connection);
          }

          // 创建AI提供者实例
          console.log('refreshModel: Creating provider with config:', {
            aiServiceType: connection.provider,
            apiKey: connection.apiKey ? '***' : 'undefined', // 隐藏API密钥
            baseUrl: connection.baseUrl,
            accountId: connection.organizationId,
          });
          
          const provider = aiProviderFactory.createProvider({
            aiServiceType: connection.provider,
            apiKey: connection.apiKey,
            baseUrl: connection.baseUrl,
            accountId: connection.organizationId, // 使用organizationId作为accountId
          });

          // 获取模型列表
          console.log('refreshModel: Getting available models from provider');
          const models = await provider.getAvailableModels();
          
          // 添加调试日志
          console.log(`获取到 ${connection.provider} 的模型列表:`, models);

          // 更新模型列表
          set((state) => {
            // 只有当模型列表真正发生变化时才更新
            const currentModels = state.connectionModels[connection.provider] || [];
            const newModels = models.map(m => ({ ...m, connectionId: connection.id }));
            
            // 比较模型列表是否真正变化
            const modelsChanged = currentModels.length !== newModels.length || 
              currentModels.some((model, index) => {
                return model.name !== newModels[index]?.name;
              });
            
            if (!modelsChanged) {
              // 如果模型没有变化，不更新状态以避免不必要的重新渲染
              console.log('refreshModel: Models unchanged, skipping update');
              return {
                loadingModels: state.loadingModels.filter(id => id !== connection.id)
              };
            }
            
            console.log('refreshModel: Models changed, updating store');
            return {
              connectionModels: {
                ...state.connectionModels,
                [connection.provider]: newModels
              },
              loadingModels: state.loadingModels.filter(id => id !== connection.id)
            };
          });
          
          // 更新动态模型缓存
          const modelPresets: Record<string, any> = {};
          const allPresetModels = getAllModelPresets();
          
          models.forEach(model => {
            // 尝试从预设模型中查找匹配的参数
            let presetParams = {
              description: `自动获取的模型: ${model.name}`,
              temperature: 0.7,
              maxTokens: 128000 // 默认maxTokens设置为128000
            };
            
            // 将提供商映射回LLMProvider
            const llmProvider = mapAIServiceTypeToLLMProvider(connection.provider);
            
            // 如果能映射到LLMProvider，则尝试查找预设参数
            if (llmProvider && allPresetModels[llmProvider]) {
              // 精确匹配模型名称
              if (allPresetModels[llmProvider][model.name]) {
                presetParams = { ...allPresetModels[llmProvider][model.name] };
              } else {
                // 模糊匹配，检查模型名称是否包含预设模型名称
                for (const [presetModelName, presetModelInfo] of Object.entries(allPresetModels[llmProvider])) {
                  if (model.name.includes(presetModelName) || presetModelName.includes(model.name)) {
                    presetParams = { ...presetModelInfo };
                    break;
                  }
                }
              }
            }
            
            // 保留原始模型参数，确保不被默认值覆盖
            modelPresets[model.name] = {
              ...presetParams,
              ...model.raw, // 保留原始参数
              provider: connection.provider // 添加提供商信息
            };
          });
          
          // 将提供商映射回LLMProvider
          const llmProvider = mapAIServiceTypeToLLMProvider(connection.provider);
          if (llmProvider) {
            updateDynamicModels(llmProvider, modelPresets);
          }
        } catch (error) {
          console.error('刷新模型列表失败:', error);
          // 显示错误消息给用户
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          console.error(`连接 ${connection.name} (${connection.provider}) 的模型刷新失败: ${errorMessage}`);
          // 清除加载状态
          set((state) => ({
            loadingModels: state.loadingModels.filter(id => id !== connection.id)
          }));
        }
      },

      refreshAllModels: async () => {
        const { connections } = get();
        
        // 只有当有连接时才执行刷新
        if (connections.length > 0) {
          // 检查是否已经在加载所有模型
          const { loadingModels } = get();
          const allLoading = connections.every(conn => loadingModels.includes(conn.id));
          
          if (!allLoading) {
            // 并行刷新所有连接的模型
            await Promise.all(connections.map(connection => get().refreshModel(connection)));
            
            // 更新最后刷新时间
            set({ lastRefreshTime: Date.now() });
            
            // 刷新完成后，触发一次模型同步到数据库
            const allModels = get().getAllModels();
            const defaultConfig = get().getDefaultConfig();
            const defaultModelId = defaultConfig?.id || null;
            
            // 只有当有模型数据时才同步到数据库
            if (allModels.length > 0) {
              setTimeout(() => {
                defaultModelService.setAdminDefaultModels(allModels, defaultModelId)
                  .catch(error => {
                    console.error('自动同步模型到数据库失败:', error);
                  });
              }, 1000);
            }
          }
        }
      },

      // 获取所有模型
      getAllModels: () => {
        const { connectionModels } = get()
        // 先获取连接模型
        const allConnectionModels = Object.values(connectionModels).flat()
        
        // 再获取预设模型和动态模型
        const allPresetModels = getAllModelPresets()
        
        // 将预设模型转换为LLMConnectionModel格式
        const presetConnectionModels: LLMConnectionModel[] = []
        Object.entries(allPresetModels).forEach(([provider, models]) => {
          Object.entries(models).forEach(([modelName, modelInfo]) => {
            // 为预设模型创建虚拟的connectionId
            const virtualConnectionId = `preset-${provider}-${modelName}`
            presetConnectionModels.push({
              name: modelName,
              raw: {
                ...modelInfo,
                provider: provider // 添加提供商信息
              },
              connectionId: virtualConnectionId
            })
          })
        })
        
        // 合并连接模型和预设模型
        return [...allConnectionModels, ...presetConnectionModels]
      },

      // 清除所有模型数据
      clearAllModels: () => {
        set({
          connectionModels: initialConnectionModels,
          adminDefaultModels: [],
          configs: [],
          connections: [],
          defaultConfigId: null
        })
      },

      // 启动自动刷新
      startAutoRefresh: () => {
        const { refreshTimer, refreshAllModels, lastRefreshTime } = get();
        
        // 如果已经有定时器，先清除
        if (refreshTimer) {
          clearInterval(refreshTimer);
        }
        
        // 创建新的定时器
        const timer = setInterval(async () => {
          try {
            await refreshAllModels();
          } catch (error) {
            console.error('自动刷新模型失败:', error);
          }
        }, REFRESH_INTERVAL);
        
        // 更新状态
        set({ refreshTimer: timer });
        
        // 如果距离上次刷新已经超过24小时，立即刷新一次
        if (Date.now() - lastRefreshTime > REFRESH_INTERVAL) {
          refreshAllModels().catch(error => {
            console.error('立即刷新模型失败:', error);
          });
        }
      },

      // 停止自动刷新
      stopAutoRefresh: () => {
        const { refreshTimer } = get();
        if (refreshTimer) {
          clearInterval(refreshTimer);
          set({ refreshTimer: null });
        }
      },

      // 模态框操作
      openAddModal: () => {
        set({ 
          modalVisible: true, 
          isEditMode: false,
          editingConfigId: null
        })
      },

      openEditModal: (configId) => {
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
      name: 'ai-service-storage',
      partialize: (state) => ({ 
        configs: state.configs,
        defaultConfigId: state.defaultConfigId,
        connections: state.connections,
        connectionModels: state.connectionModels,
        adminDefaultModels: state.adminDefaultModels,
        lastRefreshTime: state.lastRefreshTime
      }),
    }
  )
)