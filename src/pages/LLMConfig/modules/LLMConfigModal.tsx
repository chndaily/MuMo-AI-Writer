import React, { useEffect } from 'react'
import { Form, Input, Select, Modal, Button, Space, InputNumber, AutoComplete, message, Alert } from 'antd'
import { LLMProvider, LLMConfig, LLMConnectionModel } from '#/llm'
import { useAIServiceStore } from '@/stores/aiServiceStore'
import { mapLLMProviderToAIServiceType } from '@/utils/aiProviderUtils'
import { generateUUID } from '@/utils'
import { MODEL_PRESETS } from '@/ai/modelPresets'
import { defaultModelService } from '@/services/defaultModelService'

const { Option } = Select

interface LLMConfigModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess?: () => void
}

export const LLMConfigModal: React.FC<LLMConfigModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm<LLMConfig>()
  const {
    editingConfigId,
    isEditMode,
    addConfig,
    updateConfig,
    closeModal,
    getConfig,
    connections,
    refreshModel,
  } = useAIServiceStore()
  const formProvider = Form.useWatch('provider', form)

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

  // 获取模型选项
  const getModelOptions = (provider: LLMProvider) => {
    const presets = MODEL_PRESETS[provider] || {}
    console.log(presets)
    return Object.entries(presets).map(([model, config]) => ({
      value: model,
      label: `${model} - ${(config as any).description}`,
    }))
  }

  // 处理提供商变更
  const handleProviderChange = (provider: LLMProvider) => {
    form.resetFields(['model', 'baseURL'])

    // 设置默认值
    const presets = MODEL_PRESETS[provider]
    if (presets) {
      const firstModel = Object.keys(presets)[0]
      if (firstModel) {
        const preset = (presets as any)[firstModel]
        form.setFieldsValue({
          model: firstModel,
          temperature: preset.temperature,
          maxTokens: preset.maxTokens,
        })
      }
    }

    // 设置默认baseURL
    const defaultURLs = {
      [LLMProvider.OPENAI]: 'https://api.openai.com/v1',
      [LLMProvider.ANTHROPIC]: 'https://api.anthropic.com/v1',
      [LLMProvider.GOOGLE]: 'https://generativelanguage.googleapis.com/v1beta',
      [LLMProvider.AZURE]: '',
      [LLMProvider.LOCAL]: 'http://localhost:11434',
      [LLMProvider.DEEPSEEK]: 'https://api.deepseek.com/v1',
      [LLMProvider.MODELSCOPE]: 'https://api-inference.modelscope.cn/v1',
    }

    if (defaultURLs[provider]) {
      form.setFieldsValue({ baseURL: defaultURLs[provider] })
    }
  }

  // 处理模型变更
  const handleModelChange = (model: string) => {
    const currentProvider = form.getFieldValue('provider') as LLMProvider
    const presets = MODEL_PRESETS[currentProvider]
    if (presets && (presets as any)[model]) {
      // 如果是预设模型，使用预设参数
      const preset = (presets as any)[model]
      form.setFieldsValue({
        temperature: preset.temperature,
        maxTokens: preset.maxTokens,
      })
    } else {
      // 如果是自定义模型，使用默认参数
      form.setFieldsValue({
        temperature: 0.7,
        maxTokens: 4096,
      })
    }
  }

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      const configData = {
        name: values.name,
        provider: values.provider,
        apiKey: values.apiKey,
        baseURL: values.baseURL,
        model: values.model,
        temperature: values.temperature,
        maxTokens: values.maxTokens,
        timeout: values.timeout,
      }

      console.log('handleSubmit: configData=', configData)

      // 同步更新连接存储
      const serviceType = mapLLMProviderToAIServiceType(configData.provider)
      
      console.log('handleSubmit: serviceType=', serviceType)
      
      if (serviceType) {
        let connectionId = '';
        if (isEditMode && editingConfigId) {
          // 更新现有配置
          updateConfig(editingConfigId, configData)
          connectionId = editingConfigId;
          message.success('配置修改成功')
        } else {
          // 创建新的配置
          const newConfigId = generateUUID()
          console.log('handleSubmit: newConfigId=', newConfigId)
          
          addConfig({
            ...configData,
            id: newConfigId,
          })
          
          connectionId = newConfigId;
          message.success('配置添加成功')
        }
        
        // 查找或创建对应的连接
        let connection = connections.find(c => c.id === connectionId);
        if (!connection) {
          // 创建新的连接
          connection = {
            id: connectionId,
            name: configData.name,
            disabled: false,
            apiKey: configData.apiKey,
            baseUrl: configData.baseURL || '',
            provider: serviceType,
            organizationId: undefined, // 如果需要，可以添加organizationId
            projectId: undefined, // 如果需要，可以添加projectId
          };
          // 注意：这里我们没有调用addConnection，因为连接会在刷新模型时自动创建
        }
        
        // 构造要存储到数据库的raw字段数据
        const rawModelData = {
          name: configData.name,  // 配置名称
          apiKey: configData.apiKey,
          baseURL: configData.baseURL,
          model: configData.model,  // 实际模型名称
          provider: configData.provider,
          temperature: configData.temperature,
          maxTokens: configData.maxTokens,
          timeout: configData.timeout,
          serviceType: serviceType
        };
        
        // 更新store中的模型数据，确保包含完整的raw字段
        const modelToUpdate: LLMConnectionModel = {
          name: configData.name,  // 使用配置名称作为模型显示名称
          connectionId: connectionId,
          raw: rawModelData
        };
        
        // 注意：我们不再直接操作store，而是通过defaultModelService来同步数据库和store
        // 如果是编辑模式，先移除旧的模型数据
        // if (isEditMode && editingConfigId) {
        //   useAIServiceStore.getState().removeAdminDefaultModel(editingConfigId);
        // }
        
        // 添加或更新模型数据到store
        // useAIServiceStore.getState().addAdminDefaultModel(modelToUpdate);
        
        // 不再调用refreshModel来避免自动获取所有模型
        // 直接同步到数据库
        try {
          console.log('准备同步模型数据到数据库:');
          console.log('modelToUpdate:', modelToUpdate);
          
          // 直接添加或更新单个模型到数据库，为后续专业会员添加模型权限做准备
          if (isEditMode && editingConfigId) {
            // 编辑模式：更新现有模型
            await defaultModelService.addAdminDefaultModel(modelToUpdate);
          } else {
            // 添加模式：添加新模型
            await defaultModelService.addAdminDefaultModel(modelToUpdate);
          }
          
          console.log('模型数据同步到数据库成功');
        } catch (error) {
          console.error('同步模型数据到数据库失败:', error);
          message.error(`同步模型数据到数据库失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      } else {
        message.error('不支持的AI提供商')
        return
      }

      closeModal()
      form.resetFields()
      // 确保在关闭模态框后再调用onSuccess
      setTimeout(() => {
        onSuccess?.()
      }, 100)
    } catch (error) {
      console.error('handleSubmit: error=', error)
      message.error(isEditMode ? '配置修改失败' : '配置添加失败')
    }
  }

  // 处理取消
  const handleCancel = () => {
    closeModal()
    form.resetFields()
    onCancel()
  }

  // 初始化表单数据
  useEffect(() => {
    if (visible && isEditMode && editingConfigId) {
      // 编辑模式，填充现有数据
      const config = getConfig(editingConfigId)
      if (config) {
        form.setFieldsValue({
          name: config.name,
          provider: config.provider,
          apiKey: config.apiKey,
          baseURL: config.baseURL,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          timeout: config.timeout,
        })
      }
    } else if (visible && !isEditMode) {
      // 添加模式，设置默认值
      form.setFieldsValue({
        provider: LLMProvider.OPENAI,
        temperature: 0.7,
        maxTokens: 2048,
        timeout: 30000,
      })
      handleProviderChange(LLMProvider.OPENAI)
    }
  }, [visible, isEditMode, editingConfigId, form, getConfig])

  return (
    <Modal
      title={isEditMode ? '编辑配置' : '添加配置'}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <Alert
        message="配置说明"
        description={
          <div>
            <div style={{ marginTop: '8px', color: '#ff4d4f' }}><strong>重要</strong>：配置名称与模型名称请务必保持一致，否则会导致调用失败！</div>
            <div style={{ marginTop: '4px' }}>例如：如果使用OpenAI的gpt-4-turbo模型，配置名称可以是"gpt-4-turbo"，模型名称必须是"gpt-4-turbo"</div>
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          temperature: 0.7,
          maxTokens: 2048,
          timeout: 30000,
        }}
      >
        <Form.Item
          label="配置名称"
          name="name"
          rules={[{ required: true, message: '请输入配置名称' }]}
          extra="给此配置起一个易于识别的名称"
        >
          <Input placeholder="例如：OpenAI GPT-4、魔搭社区、火山引擎等" />
        </Form.Item>

        <Form.Item
          label="AI提供商"
          name="provider"
          rules={[{ required: true, message: '请选择AI提供商' }]}
        >
          <Select
            placeholder="选择AI提供商"
            onChange={handleProviderChange}
          >
            {providerOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="API密钥"
          name="apiKey"
          rules={[{ required: true, message: '请输入API密钥' }]}
        >
          <Input.Password placeholder="输入API密钥" />
        </Form.Item>

        <Form.Item
          label="基础URL"
          name="baseURL"
          extra="可选，留空使用默认URL"
        >
          <Input placeholder="输入基础URL" />
        </Form.Item>

        <Form.Item
          label="模型"
          name="model"
          rules={[{ required: true, message: '请选择或输入模型名称' }]}
          extra="可以从预设中选择，也可以手动输入自定义模型名称"
        >
          <AutoComplete
            placeholder="选择或输入模型名称"
            onChange={handleModelChange}
            options={formProvider ? getModelOptions(formProvider) : []}
            filterOption={(inputValue, option) =>
              option?.label.toLowerCase().includes(inputValue.toLowerCase()) ||
              option?.value.toLowerCase().includes(inputValue.toLowerCase())
            }
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="温度 (Temperature)"
          name="temperature"
          extra="控制输出的随机性，0-1之间"
        >
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="最大Token数"
          name="maxTokens"
          extra="生成文本的最大长度"
        >
          <InputNumber
            min={1}
            max={128000}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="超时时间 (毫秒)"
          name="timeout"
          extra="API请求超时时间"
        >
          <InputNumber
            min={1000}
            max={120000}
            step={1000}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {isEditMode ? '保存修改' : '添加配置'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}