import React, { useState, useEffect } from 'react'
import {
  Card,
  List,
  Button,
  Space,
  Typography,
  Tag,
  Result,
  Alert,
  Collapse,
  Popconfirm,
  message,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Divider,
  Spin
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  LockOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { LLMProvider, LLMConfig, LLMConnection, LLMConnectionModel } from '#/llm'
import { useAIServiceStore } from '@/stores/aiServiceStore'
import { useMembership } from '@/hooks/useMembership'
import { useLLM } from '@/hooks/useLLM'
import { LLMConfigModal } from './LLMConfigModal'
import { databaseManager } from '@/services/index'
import { mapAIServiceTypeToLLMProvider } from '@/utils/aiProviderUtils'
import { adminAIModelService } from '@/services/adminAIModelService'
import { defaultModelService } from '@/services/defaultModelService'

const { Text, Title, Paragraph } = Typography
const { Panel } = Collapse

interface LLMConfigPanelProps {
  onConfigChange?: () => void
}

export const LLMConfigPanel: React.FC<LLMConfigPanelProps> = ({ onConfigChange }) => {
  const {
    configs,
    connections,
    connectionModels,
    modalVisible,
    defaultConfigId,
    addConfig,
    updateConfig,
    removeConfig,
    setDefaultConfig,
    refreshAllModels,
    openAddModal,
    openEditModal,
    closeModal,
  } = useAIServiceStore()

  const { checkPermission, isProfessional, membershipInfo } = useMembership()
  const { validateConfig } = useLLM() // 在这里正确调用useLLM hook
  const [validatingConfig, setValidatingConfig] = useState<string | null>(null)
  const [defaultModel, setDefaultModel] = useState<any>(null)
  const [dbModels, setDbModels] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingModel, setEditingModel] = useState<any>(null)
  const [modelModalVisible, setModelModalVisible] = useState(false)
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null)

  // 检查是否为管理员
  const isUserAdmin = membershipInfo.isAdmin || false;

  // 获取默认模型信息
  useEffect(() => {
    const fetchDefaultModel = async () => {
      try {
        // 使用defaultModelService获取默认模型，确保获取到管理员设置的默认模型
        const defaultModelList = await defaultModelService.getDefaultModelList();
        if (defaultModelList.length > 0) {
          // 使用第一个默认模型
          setDefaultModel(defaultModelList[0]);
        } else {
          // 如果没有默认模型，尝试从数据库获取默认AI模型
          const defaultModels = await databaseManager.aiModels.getDefaultAIModels();
          if (defaultModels.length > 0) {
            setDefaultModel(defaultModels[0]);
          }
        }
      } catch (error) {
        console.error('获取默认模型失败:', error);
      }
    }
    
    if (!isUserAdmin) {
      fetchDefaultModel();
    }
  }, [isUserAdmin])

  // 获取数据库中的所有模型（仅管理员）
  const fetchDBModels = async () => {
    if (!isUserAdmin) return;
    
    setLoading(true)
    try {
      const models = await databaseManager.aiModels.getAllAIModels()
      setDbModels(models)
      
      // 查找默认模型
      const defaultModel = models.find((model: any) => model.isDefault)
      setDefaultModelId(defaultModel ? defaultModel.id : null)
    } catch (error) {
      console.error('获取数据库模型失败:', error)
      message.error('获取数据库模型失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化数据
  useEffect(() => {
    if (isUserAdmin) {
      fetchDBModels()
    }
  }, [isUserAdmin])

  // 提供商选项
  const providerOptions = [
    { value: LLMProvider.OPENAI, label: 'OpenAI', color: 'blue' },
    { value: LLMProvider.ANTHROPIC, label: 'Anthropic', color: 'green' },
    { value: LLMProvider.GOOGLE, label: 'Google', color: 'orange' },
    { value: LLMProvider.AZURE, label: 'Azure OpenAI', color: 'purple' },
    { value: LLMProvider.DEEPSEEK, label: 'DeepSeek', color: 'cyan' },
    { value: LLMProvider.MODELSCOPE, label: 'ModelScope', color: 'blue' },
    { value: LLMProvider.LOCAL, label: '本地模型', color: 'red' },
  ]

  // 获取提供商标签颜色
  const getProviderColor = (provider: LLMProvider) => {
    const option = providerOptions.find(p => p.value === provider);
    return option ? option.color : 'default';
  }

  // 获取提供商标签文本
  const getProviderLabel = (provider: LLMProvider) => {
    const option = providerOptions.find(p => p.value === provider);
    return option ? option.label : provider;
  }

  // 删除配置
  const handleRemoveConfig = (configId: string) => {
    const success = removeConfig(configId);
    if (success) {
      message.success('配置删除成功');
      onConfigChange?.();
    } else {
      message.error('配置删除失败');
    }
  }

  // 验证配置
  const handleValidateConfig = async (configId: string) => {
    setValidatingConfig(configId);
    console.log('开始验证配置:', configId);
    
    try {
      // 使用useLLM hook中的validateConfig方法进行实际验证
      const result = await validateConfig(configId);
      
      if (result.success) {
        message.success(`配置验证成功！响应时间: ${result.responseTime}ms`);
      } else {
        message.error(`配置验证失败: ${result.error}`);
      }
    } catch (error) {
      console.error('验证失败:', error);
      message.error('配置验证失败');
    } finally {
      setValidatingConfig(null);
    }
  }

  // 设置默认配置
  const handleSetDefault = (configId: string) => {
    const config = configs.find(c => c.id === configId);
    if (config) {
      setDefaultConfig(configId);
      message.success(`已将 ${config.name} 设为默认`);
      onConfigChange?.();
    }
  }

  // 处理配置成功
  const handleConfigSuccess = () => {
    // 刷新所有模型以获取最新的模型列表
    refreshAllModels().then(() => {
      message.success('模型列表已刷新');
    }).catch((error) => {
      console.error('刷新模型列表失败:', error);
      message.warning('模型列表刷新失败，但配置已保存');
    });
    
    onConfigChange?.();
  }

  // 删除模型（仅管理员）
  const handleDeleteModel = async (modelId: string) => {
    try {
      console.log('Attempting to delete model with ID:', modelId);
      await databaseManager.aiModels.deleteAIModel(modelId);
      console.log('Model deleted successfully from database');
      message.success('模型删除成功');
      fetchDBModels();
    } catch (error: any) {
      console.error('删除模型失败:', error);
      // 检查是否是API错误并显示具体错误信息
      if (error && error.message) {
        message.error(`删除模型失败: ${error.message}`);
      } else {
        message.error(`删除模型失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }

  // 设置默认模型（仅管理员）
  const handleSetDefaultModel = async (modelId: string) => {
    try {
      await adminAIModelService.setDefaultModel(modelId)
      message.success('默认模型设置成功')
      fetchDBModels()
    } catch (error) {
      console.error('设置默认模型失败:', error)
      message.error('设置默认模型失败')
    }
  }

  // 取消默认模型设置（仅管理员）
  const handleUnsetDefaultModel = async (modelId: string) => {
    try {
      // 直接更新数据库中的模型记录，将isDefault设置为false
      const modelToUpdate = dbModels.find((m: any) => m.id === modelId);
      if (modelToUpdate) {
        const updatedModel = { ...modelToUpdate, isDefault: false };
        await databaseManager.aiModels.updateAIModel(updatedModel);
        message.success('已取消默认模型设置')
        fetchDBModels()
      }
    } catch (error) {
      console.error('取消默认模型设置失败:', error)
      message.error('取消默认模型设置失败')
    }
  }

  // 编辑模型（仅管理员）
  const handleEditModel = (model: any) => {
    setEditingModel(model)
    setModelModalVisible(true)
  }

  // 处理模型编辑成功（仅管理员）
  const handleModelEditSuccess = () => {
    setModelModalVisible(false)
    setEditingModel(null)
    fetchDBModels()
  }

  // 添加新模型（仅管理员）
  const handleAddModel = () => {
    setEditingModel(null)
    setModelModalVisible(true)
  }

  // 随机推荐模型列表
  const [randomRecommendedModels, setRandomRecommendedModels] = useState<any[]>([]);
  
  // 获取所有可用模型（用于随机推荐）
  const getAllAvailableModelsForRecommendation = () => {
    // 使用useAIServiceStore中的getAllModels函数获取所有模型
    const allModels = useAIServiceStore.getState().getAllModels();
    
    // 将LLMConnectionModel数组转换为推荐模型格式
    const modelsForRecommendation: any[] = [];
    
    allModels.forEach((model: LLMConnectionModel) => {
      // 初始化参数
      let provider = 'unknown';
      let description = `自动获取的模型: ${model.name}`;
      let temperature = 0.7;
      let maxTokens = 128000;
      
      // 从raw数据中提取信息
      if (model.raw) {
        // 提供商信息可能在不同的字段中
        provider = model.raw.provider || model.raw.serviceType || 'unknown';
        description = model.raw.description || description;
        temperature = model.raw.temperature !== undefined ? model.raw.temperature : temperature;
        maxTokens = model.raw.maxTokens !== undefined ? model.raw.maxTokens : maxTokens;
      }
      
      // 如果提供商是字符串形式的AIServiceType，尝试映射到LLMProvider
      if (typeof provider === 'string') {
        // 先尝试直接映射
        const directMappedProvider = mapAIServiceTypeToLLMProvider(provider as any);
        if (directMappedProvider) {
          provider = directMappedProvider;
        } else {
          // 如果直接映射失败，尝试其他可能的映射方式
          const lowerProvider = provider.toLowerCase();
          if (lowerProvider.includes('modelscope')) {
            provider = LLMProvider.MODELSCOPE;
          } else if (lowerProvider.includes('deepseek')) {
            provider = LLMProvider.DEEPSEEK;
          } else if (lowerProvider.includes('openai')) {
            provider = LLMProvider.OPENAI;
          } else if (lowerProvider.includes('anthropic')) {
            provider = LLMProvider.ANTHROPIC;
          } else if (lowerProvider.includes('google')) {
            provider = LLMProvider.GOOGLE;
          } else if (lowerProvider.includes('azure')) {
            provider = LLMProvider.AZURE;
          } else if (lowerProvider.includes('local') || lowerProvider.includes('ollama')) {
            provider = LLMProvider.LOCAL;
          } else {
            // 保持原值，但确保是有效的LLMProvider
            if (!Object.values(LLMProvider).includes(provider as LLMProvider)) {
              // 尝试更宽松的匹配
              const providerValues = Object.values(LLMProvider);
              const matchedProvider = providerValues.find(p => 
                p.toLowerCase() === lowerProvider || 
                lowerProvider.includes(p.toLowerCase())
              );
              if (matchedProvider) {
                provider = matchedProvider;
              } else {
                provider = 'unknown';
              }
            }
          }
        }
      }
      
      // 特别处理一些常见的最大令牌数值
      if (maxTokens === 128000) {
        // 如果是默认值，尝试从模型名称或其他信息中推断
        if (model.name.includes('gpt-3.5')) {
          maxTokens = 16385;
        } else if (model.name.includes('gpt-4') || model.name.includes('claude-3-haiku')) {
          maxTokens = 128000;
        } else if (model.name.includes('claude-3')) {
          maxTokens = 200000;
        } else if (model.name.includes('gemini-1.0')) {
          maxTokens = 32768;
        } else if (model.name.includes('gemini-1.5')) {
          maxTokens = 1048576; // 1M tokens for Gemini 1.5
        }
      }
      
      // 如果是预设模型，从预设中获取参数
      if (model.connectionId && model.connectionId.startsWith('preset-')) {
        const allPresetModels = useAIServiceStore.getState().getAllModels();
        // 查找预设模型参数
        Object.entries(allPresetModels).some(([providerKey, models]) => {
          if (models[model.name]) {
            const presetModel = models[model.name];
            provider = providerKey as LLMProvider;
            description = presetModel.description || description;
            temperature = presetModel.temperature !== undefined ? presetModel.temperature : temperature;
            maxTokens = presetModel.maxTokens !== undefined ? presetModel.maxTokens : maxTokens;
            return true;
          }
          return false;
        });
      }
      
      modelsForRecommendation.push({
        provider: provider,
        model: model.name,
        name: model.name.split('/').pop() || model.name, // 使用模型名称的最后一部分作为显示名称
        description: description,
        temperature: temperature,
        maxTokens: maxTokens
      });
    });
    
    return modelsForRecommendation;
  };
  
  // 生成随机推荐模型
  const generateRandomRecommendedModels = () => {
    const allModels = getAllAvailableModelsForRecommendation();
    
    // 如果模型数量少于6个，直接返回所有模型
    if (allModels.length <= 6) {
      setRandomRecommendedModels(allModels);
      return;
    }
    
    // 随机选择6个模型
    const shuffled = [...allModels].sort(() => 0.5 - Math.random());
    setRandomRecommendedModels(shuffled.slice(0, 6));
  };
  
  // 当组件挂载或模型更新时生成随机推荐
  useEffect(() => {
    generateRandomRecommendedModels();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>AI模型配置</Title>
      
      {/* 显示默认模型信息（非管理员用户） */}
      {!isUserAdmin && defaultModel && (
        <Card 
          title="默认模型信息" 
          style={{ marginBottom: '24px' }}
          extra={<Tag color="green">系统默认</Tag>}
        >
          <Space direction="vertical">
            <Text strong>模型名称: {defaultModel.name}</Text>
            <Text>提供商: {defaultModel.provider}</Text>
            <Text>描述: {defaultModel.description}</Text>
          </Space>
        </Card>
      )}
      
      {/* 配置管理 */}
      <Card 
        title="AI模型配置" 
        style={{ marginBottom: '24px' }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            添加配置
          </Button>
        }
      >
        {configs.length === 0 ? (
          <Alert
            message="暂无配置"
            description="请添加至少一个AI模型配置"
            type="info"
            showIcon
          />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {configs.map((config) => {
              const isDefault = defaultConfigId === config.id;
              return (
                <Card
                  key={config.id}
                  size="small"
                  style={{ border: isDefault ? '2px solid #1890ff' : undefined }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Space>
                        <Tag color={getProviderColor(config.provider)}>{getProviderLabel(config.provider)}</Tag>
                        <Text strong>{config.name}</Text>
                        <Text type="secondary">({config.model})</Text>
                        {isDefault && (
                          <Tag icon={<CheckCircleOutlined />} color="success">默认配置</Tag>
                        )}
                      </Space>
                    </div>
                    <div>
                      <Space>
                        <Button 
                          icon={<EditOutlined />} 
                          onClick={() => openEditModal(config.id)}
                          size="small"
                        >
                          编辑
                        </Button>
                        <Button 
                          icon={<ApiOutlined />} 
                          onClick={() => handleValidateConfig(config.id)}
                          loading={validatingConfig === config.id}
                          size="small"
                        >
                          验证
                        </Button>
                        <Button 
                          icon={<CheckCircleOutlined />} 
                          onClick={() => handleSetDefault(config.id)}
                          disabled={isDefault}
                          size="small"
                        >
                          设为默认
                        </Button>
                        <Popconfirm
                          title="确定要删除这个配置吗？"
                          onConfirm={() => handleRemoveConfig(config.id)}
                        >
                          <Button icon={<DeleteOutlined />} danger size="small">
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                  </div>
                </Card>
              )
            })}
          </Space>
        )}
      </Card>

      {/* 数据库中的AI模型（仅管理员） */}
      {isUserAdmin && (
        <Card 
          title="数据库中的AI模型" 
          style={{ marginBottom: '24px' }}
          extra={
            <>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddModel}
                style={{ marginRight: '8px' }}
              >
                添加模型
              </Button>
              <Text type="secondary">
                共 {dbModels.length} 个模型
                {defaultModelId && (
                  <span>
                    ，默认模型: {dbModels.find((m: any) => m.id === defaultModelId)?.name || '未知'}
                  </span>
                )}
              </Text>
            </>
          }
        >
          <Spin spinning={loading}>
            {dbModels.length === 0 ? (
              <Alert
                message="暂无模型"
                description="数据库中暂无AI模型数据"
                type="info"
                showIcon
              />
            ) : (
              <List
                dataSource={dbModels}
                renderItem={(model: any) => {
                  const isDefault = model.id === defaultModelId
                  return (
                    <List.Item
                      actions={[
                        <Button 
                          icon={<EditOutlined />} 
                          onClick={() => handleEditModel(model)}
                          size="small"
                        >
                          编辑
                        </Button>,
                        isDefault ? (
                          <Popconfirm
                            title="确定要取消默认设置吗？"
                            onConfirm={() => handleUnsetDefaultModel(model.id)}
                          >
                            <Button icon={<ExclamationCircleOutlined />} size="small">
                              取消默认
                            </Button>
                          </Popconfirm>
                        ) : (
                          <Button 
                            icon={<CheckCircleOutlined />} 
                            onClick={() => handleSetDefaultModel(model.id)}
                            size="small"
                          >
                            设为默认
                          </Button>
                        ),
                        <Popconfirm
                          title="确定要删除这个模型吗？"
                          onConfirm={() => handleDeleteModel(model.id)}
                        >
                          <Button icon={<DeleteOutlined />} danger size="small">
                            删除
                          </Button>
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{model.name}</Text>
                            {isDefault && <Tag color="green">默认模型</Tag>}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">ID: {model.id}</Text>
                            <Text type="secondary">Connection ID: {model.connectionId}</Text>
                            <Text type="secondary">Provider: {model.provider}</Text>
                            <Text type="secondary">Description: {model.description}</Text>
                            {model.raw && Object.keys(model.raw).length > 0 && (
                              <Text type="secondary">
                                Raw Data: {JSON.stringify(model.raw).substring(0, 100)}...
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            )}
          </Spin>
        </Card>
      )}

      {/* 推荐模型 */}
      <Card title="推荐模型" style={{ marginBottom: '24px' }}>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          以下是一些当前比较流行和性能优秀的AI模型，您可以参考这些模型进行配置。每次刷新页面都会随机展示不同的模型。
        </Paragraph>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={generateRandomRecommendedModels}
          style={{ marginBottom: 16 }}
        >
          换一批推荐
        </Button>
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={randomRecommendedModels}
          renderItem={(model) => (
            <List.Item>
              <Card 
                size="small" 
                title={
                  <Space>
                    <Tag color={getProviderColor(model.provider)}>{getProviderLabel(model.provider)}</Tag>
                    <Text strong>{model.name}</Text>
                  </Space>
                }
              >
                <Text type="secondary">{model.description}</Text>
                <Divider style={{ margin: '8px 0' }} />
                <Text strong>预设参数:</Text>
                {(() => {
                  // 直接使用模型对象中的参数信息
                  const temperature = model.temperature || '默认';
                  const maxTokens = model.maxTokens || '默认';
                  
                  return (
                    <div>
                      <Text type="secondary">
                        温度: {temperature}, 
                        最大令牌数: {maxTokens}
                      </Text>
                    </div>
                  );
                })()}
              </Card>
            </List.Item>
          )}
        />
      </Card>

      {/* 模型配置说明 */}
      <Card title="模型配置说明" style={{ marginBottom: '24px' }}>
        <Collapse ghost>
          <Panel header="如何配置AI模型" key="1">
            <Paragraph>
              <Text strong>1. 添加配置:</Text> 点击"添加配置"按钮，填写模型的相关信息。
            </Paragraph>
            <Paragraph>
              <Text strong>2. 配置参数:</Text>
              <ul>
                <li><Text strong>配置名称:</Text> 给您的配置起一个易于识别的名称</li>
                <li><Text strong>AI提供商:</Text> 选择您要使用的AI服务提供商</li>
                <li><Text strong>API密钥:</Text> 输入您的API密钥（请妥善保管）</li>
                <li><Text strong>基础URL:</Text> API的基础URL（可选，默认使用提供商的标准URL）</li>
                <li><Text strong>模型:</Text> 选择或输入具体的模型名称</li>
                <li><Text strong>温度:</Text> 控制输出的随机性，0-1之间（默认0.7）</li>
                <li><Text strong>最大Token数:</Text> 生成文本的最大长度</li>
                <li><Text strong>超时时间:</Text> API请求超时时间（毫秒）</li>
              </ul>
            </Paragraph>
            <Paragraph>
              <Text strong>3. 验证配置:</Text> 添加或编辑配置后，可以点击"验证"按钮测试配置是否正确。
            </Paragraph>
            <Paragraph>
              <Text strong>4. 设置默认:</Text> 可以将某个配置设为默认配置，系统会优先使用该配置。
            </Paragraph>
          </Panel>
          <Panel header="推荐模型说明" key="2">
            <Paragraph>
              我们推荐以下模型，它们在性能、成本和功能方面都有较好的表现：
            </Paragraph>
            <ul>
              <li><Text strong>GPT-4o:</Text> OpenAI的最新多模态模型，适用于复杂的文本和图像任务</li>
              <li><Text strong>GPT-4o Mini:</Text> 性价比高的小型模型，适合日常使用</li>
              <li><Text strong>Claude 3.5 Sonnet:</Text> Anthropic的智能模型，在安全性和对话质量方面表现出色</li>
              <li><Text strong>Gemini 1.5 Pro:</Text> Google的多模态模型，支持超长上下文</li>
              <li><Text strong>DeepSeek V3:</Text> 国产优秀模型，在中文任务上表现优异</li>
              <li><Text strong>通义千问 Qwen2-72B:</Text> 阿里巴巴的旗舰模型，参数量大，性能强劲</li>
            </ul>
          </Panel>
          {isUserAdmin && (
            <Panel header="管理员模型管理说明" key="3">
              <Paragraph>
                作为管理员，您可以在此处管理所有用户的默认AI模型：
              </Paragraph>
              <ul>
                <li><Text strong>添加模型:</Text> 点击"添加模型"按钮，添加新的AI模型供所有用户使用</li>
                <li><Text strong>编辑模型:</Text> 可以修改现有模型的信息</li>
                <li><Text strong>删除模型:</Text> 删除不再需要的模型</li>
                <li><Text strong>设置默认:</Text> 将某个模型设置为默认模型，所有用户都将使用该模型</li>
                <li><Text strong>取消默认:</Text> 取消某个模型的默认设置</li>
              </ul>
              <Alert
                message="重要说明"
                description="默认模型将提供给所有会员（包括免费会员和基础会员）使用。专业会员可以使用自定义模型和默认模型。"
                type="info"
                showIcon
              />
            </Panel>
          )}
        </Collapse>
      </Card>

      {/* 可用模型列表 */}
      {/* 根据用户偏好和项目优化要求，删除此功能模块以保持界面简洁 */}

      {/* 配置弹框 */}
      <LLMConfigModal
        visible={modalVisible}
        onCancel={closeModal}
        onSuccess={handleConfigSuccess}
      />

      {/* 模型管理弹框（仅管理员） */}
      {isUserAdmin && (
        <Modal
          title={editingModel ? "编辑AI模型" : "添加AI模型"}
          open={modelModalVisible}
          onCancel={() => {
            setModelModalVisible(false)
            setEditingModel(null)
          }}
          footer={null}
          width={600}
        >
          <Form
            layout="vertical"
            initialValues={{
              name: editingModel?.name || '',
              provider: editingModel?.provider || '',
              connectionId: editingModel?.connectionId || '',
              description: editingModel?.description || '',
              isDefault: editingModel?.isDefault || false,
              raw: editingModel?.raw ? JSON.stringify(editingModel.raw, null, 2) : ''
            }}
            onFinish={async (values) => {
              try {
                // 解析raw字段
                let raw = {}
                if (values.raw) {
                  try {
                    raw = JSON.parse(values.raw)
                  } catch (e) {
                    message.error('Raw字段必须是有效的JSON格式')
                    return
                  }
                }
                
                if (editingModel) {
                  // 更新现有模型
                  const updatedModel = {
                    ...editingModel,
                    name: values.name,
                    provider: values.provider,
                    connectionId: values.connectionId,
                    description: values.description,
                    isDefault: values.isDefault,
                    raw: raw,
                    // 确保保留原始模型的ID字段
                    id: editingModel.id || editingModel._id
                  }
                  
                  await databaseManager.aiModels.updateAIModel(updatedModel)
                  message.success('模型更新成功')
                } else {
                  // 添加新模型
                  const newModel = {
                    name: values.name,
                    provider: values.provider,
                    connectionId: values.connectionId,
                    description: values.description,
                    isDefault: values.isDefault,
                    raw: raw
                  }
                  
                  await databaseManager.aiModels.addAIModel(newModel)
                  message.success('模型添加成功')
                }
                
                handleModelEditSuccess()
              } catch (error) {
                console.error('保存模型失败:', error)
                message.error('保存模型失败')
              }
            }}
          >
            <Form.Item
              label="模型名称"
              name="name"
              rules={[{ required: true, message: '请输入模型名称' }]}
            >
              <Input placeholder="输入模型名称" />
            </Form.Item>
            
            <Form.Item
              label="提供商"
              name="provider"
              rules={[{ required: true, message: '请选择提供商' }]}
            >
              <Select placeholder="选择提供商">
                <Select.Option value="OpenAI">OpenAI</Select.Option>
                <Select.Option value="Anthropic">Anthropic</Select.Option>
                <Select.Option value="Google">Google</Select.Option>
                <Select.Option value="DeepSeek">DeepSeek</Select.Option>
                <Select.Option value="ModelScope">ModelScope</Select.Option>
                <Select.Option value="Azure">Azure</Select.Option>
                <Select.Option value="Local">Local</Select.Option>
                <Select.Option value="Unknown">Unknown</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              label="Connection ID"
              name="connectionId"
              rules={[{ required: true, message: '请输入Connection ID' }]}
            >
              <Input placeholder="输入Connection ID" />
            </Form.Item>
            
            <Form.Item
              label="描述"
              name="description"
            >
              <Input.TextArea placeholder="输入描述" rows={2} />
            </Form.Item>
            
            <Form.Item
              label="是否默认模型"
              name="isDefault"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="Raw数据 (JSON格式)"
              name="raw"
            >
              <Input.TextArea placeholder='{"apiKey": "sk-xxx", "baseURL": "https://api.openai.com/v1"}' rows={4} />
            </Form.Item>
            
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setModelModalVisible(false)
                  setEditingModel(null)
                }}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  保存
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  )
}