import React, { useState, useEffect } from 'react'
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Select,
  InputNumber,
  Switch,
  Alert,
  Spin,
  Divider,
  Tag,
} from 'antd'
import { SendOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons'
import { LLMProvider } from '#/llm'
import { useLLM } from '@/hooks/useLLM'
import { useAIServiceStore } from '@/stores/aiServiceStore'
import { defaultModelService } from '@/services/defaultModelService'
import { useDefaultModels } from '@/hooks/useDefaultModels'
import { useMembershipStore } from '@/stores/membershipStore'
import { getAllModels } from '@/ai/modelPresets'

const { TextArea } = Input
const { Title, Text } = Typography
const { Option } = Select

interface AITestPanelProps {
  onConfigChange?: (configId: string) => void
}

export const AITestPanel: React.FC<AITestPanelProps> = ({ onConfigChange }) => {
  const {
    configs,
    defaultConfigId,
    getDefaultConfig
  } = useAIServiceStore()

  const { getAllAvailableModels, isDefaultModel } = useDefaultModels()
  
  // 使用会员存储hook来检查用户角色
  const { isAdmin } = useMembershipStore()
  
  // 使用useLLM hook
  const {
    generateText,
    generateTextStream,
    stopStream,
    loading,
    streaming,
    response,
    error,
    clearError,
    clearResponse
  } = useLLM()

  const [prompt, setPrompt] = useState('请写一个关于未来科技的小说开头')
  const [systemPrompt, setSystemPrompt] = useState('你是一个专业的小说创作助手，擅长创作科幻、奇幻等类型的小说。')
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>(undefined)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [useStream, setUseStream] = useState(true)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [loadingModels, setLoadingModels] = useState(true)

  // 获取可用模型
  useEffect(() => {
    const fetchAvailableModels = async () => {
      setLoadingModels(true)
      try {
        const models = await getAllAvailableModels()
        
        // 检查用户是否为管理员
        const isUserAdmin = isAdmin()
        
        // 如果不是管理员，只显示默认模型
        if (!isUserAdmin) {
          // 获取默认模型列表
          const defaultModels = await defaultModelService.getDefaultModelList()
          // 只保留默认模型
          const filteredModels = models.filter(model => 
            defaultModels.some(defaultModel => defaultModel.id === model.id)
          )
          setAvailableModels(filteredModels)
        } else {
          // 管理员可以看到所有模型
          setAvailableModels(models)
        }
        
        // 如果没有选中配置且有可用模型，自动选择第一个
        if (!selectedConfigId && models.length > 0) {
          // 管理员使用第一个模型，非管理员使用第一个默认模型
          if (isUserAdmin) {
            setSelectedConfigId(models[0].id)
          } else {
            const defaultModels = await defaultModelService.getDefaultModelList()
            const firstDefaultModel = models.find(model => 
              defaultModels.some(defaultModel => defaultModel.id === model.id)
            )
            if (firstDefaultModel) {
              setSelectedConfigId(firstDefaultModel.id)
            }
          }
        }
      } catch (error) {
        console.error('获取可用模型失败:', error)
      } finally {
        setLoadingModels(false)
      }
    }
    
    fetchAvailableModels()
  }, [isAdmin, getAllAvailableModels, selectedConfigId])

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

  // 获取当前配置
  const currentConfig = selectedConfigId 
    ? configs.find(c => c.id === selectedConfigId) 
    : getDefaultConfig()

  // 处理生成
  const handleGenerate = async () => {
    if (!prompt.trim()) return

    const request = {
      prompt: prompt.trim(),
      systemPrompt: systemPrompt.trim() || undefined,
      temperature,
      maxTokens,
    }

    if (useStream) {
      await generateTextStream(request, selectedConfigId)
    } else {
      await generateText(request, selectedConfigId)
    }
  }

  // 处理停止
  const handleStop = () => {
    stopStream()
  }

  // 处理清除
  const handleClear = () => {
    clearError()
    clearResponse()
  }

  // 快速提示
  const quickPrompts = [
    '请写一个关于未来科技的小说开头',
    '创作一个奇幻世界的设定',
    '写一个悬疑小说的开头',
    '描述一个外星文明的科技水平',
    '创作一个魔法师的角色设定',
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>AI模型测试</Title>

      {/* 配置选择 */}
      <Card title="模型配置" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>选择配置：</Text>
            <Select
              style={{ width: 300, marginLeft: 8 }}
              value={selectedConfigId}
              onChange={setSelectedConfigId}
              placeholder="使用默认配置"
              allowClear
              loading={loadingModels}
            >
              {availableModels.map(config => {
                const providerOption = providerOptions.find(p => p.value === config.provider)
                // 获取模型信息
                const allModels = getAllModels();
                const modelInfo = allModels[config.provider] && allModels[config.provider][config.model];
                
                return (
                  <Option key={config.id} value={config.id}>
                    <Space>
                      <Tag color={providerOption?.color}>{providerOption?.label}</Tag>
                      <Text strong>{config.name}</Text>
                      {config.model && <Text type="secondary">({config.model})</Text>}
                      {modelInfo && <Tag color="blue">动态模型</Tag>}
                      {config.isDefault && <Tag color="green">默认</Tag>}
                    </Space>
                  </Option>
                )
              })}
            </Select>
            {currentConfig && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  当前配置：{currentConfig.name} - {currentConfig.model}
                </Text>
                {defaultConfigId === currentConfig.id && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>默认</Tag>
                )}
                {isDefaultModel(currentConfig.id) && (
                  <Tag color="green" style={{ marginLeft: 8 }}>默认模型</Tag>
                )}
              </div>
            )}
          </div>

          {availableModels.length === 0 && !loadingModels && (
            <Alert
              message="暂无可用配置"
              description="请先在AI模型配置页面添加至少一个模型配置"
              type="warning"
              showIcon
            />
          )}
        </Space>
      </Card>

      {/* 参数设置 */}
      <Card title="生成参数" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <Text>温度 (Temperature):</Text>
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(value) => setTemperature(value || 0.7)}
                style={{ width: 100, marginLeft: 8 }}
              />
            </div>
            <div>
              <Text>最大Token数:</Text>
              <InputNumber
                min={100}
                max={128000}
                value={maxTokens}
                onChange={(value) => setMaxTokens(value || 1000)}
                style={{ width: 100, marginLeft: 8 }}
              />
            </div>
            <div>
              <Text>流式生成:</Text>
              <Switch
                checked={useStream}
                onChange={setUseStream}
                style={{ marginLeft: 8 }}
              />
            </div>
          </div>
        </Space>
      </Card>

      {/* 输入区域 */}
      <Card title="输入内容" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>系统提示词 (可选):</Text>
            <TextArea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="输入系统提示词..."
              rows={2}
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text strong>用户提示词:</Text>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入提示词..."
              rows={4}
              style={{ marginTop: 8 }}
            />
          </div>

          {/* 快速提示 */}
          <div>
            <Text strong>快速提示:</Text>
            <div style={{ marginTop: 8 }}>
              {quickPrompts.map((quickPrompt, index) => (
                <Button
                  key={index}
                  size="small"
                  style={{ margin: '4px' }}
                  onClick={() => setPrompt(quickPrompt)}
                >
                  {quickPrompt}
                </Button>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleGenerate}
                loading={loading || streaming}
                disabled={availableModels.length === 0}
              >
                {useStream ? '开始流式生成' : '生成'}
              </Button>
              {streaming && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={handleStop}
                >
                  停止
                </Button>
              )}
              <Button
                icon={<ReloadOutlined />}
                onClick={handleClear}
              >
                清除
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {/* 输出区域 */}
      <Card title="生成结果">
        <Space direction="vertical" style={{ width: '100%' }}>
          {error && (
            <Alert
              message="生成错误"
              description={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
            />
          )}

          {loading && !streaming && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text>正在生成中...</Text>
              </div>
            </div>
          )}

          {streaming && (
            <Alert
              message="流式生成中"
              description="正在实时生成内容..."
              type="info"
              showIcon
            />
          )}

          {response && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <Text strong>生成内容:</Text>
                {streaming && <Tag color="processing" style={{ marginLeft: 8 }}>实时生成中</Tag>}
              </div>
              <TextArea
                value={response}
                rows={10}
                readOnly
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          )}

          {!response && !loading && !streaming && !error && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <Text>暂无生成内容</Text>
            </div>
          )}
        </Space>
      </Card>
    </div>
  )
}