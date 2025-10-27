import React, { useState, useEffect } from 'react'
import {
  Card,
  List,
  Button,
  Space,
  Typography,
  Tag,
  Alert,
  message,
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Divider
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useAIServiceStore } from '@/stores/aiServiceStore'
import { useMembership } from '@/hooks/useMembership'
import { databaseManager } from '@/services/index'
import { adminAIModelService } from '@/services/adminAIModelService'
import { apiService } from '@/services/apiService'
import { defaultModelService } from '@/services/defaultModelService'
import { LLMProvider, LLMConfig, LLMConnectionModel } from '#/llm'
import { LLMConfigModal } from './LLMConfigModal'

const { Text, Title } = Typography

interface AIModelManagementPanelProps {}

export const AIModelManagementPanel: React.FC<AIModelManagementPanelProps> = () => {
  const { checkPermission, membershipInfo } = useMembership()
  const [dbModels, setDbModels] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingModel, setEditingModel] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [defaultModelId, setDefaultModelId] = useState<string | null>(null)

  // 检查是否为管理员（取消专业会员的访问权限）
  const isUserAuthorized = membershipInfo.isAdmin;

  // 如果不是管理员，显示权限不足提示
  if (!isUserAuthorized) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="权限不足"
          description="只有管理员可以管理AI模型和设置默认模型。"
          type="error"
          showIcon
        />
      </div>
    )
  }

  // 获取数据库中的所有模型
  const fetchDBModels = async () => {
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

  // 删除模型
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

  // 设置默认模型
  const handleSetDefaultModel = async (modelId: string) => {
    try {
      await adminAIModelService.setDefaultModel(modelId)
      message.success('默认模型设置成功')
      fetchDBModels()
      // 同时更新默认模型服务中的缓存
      setTimeout(() => {
        defaultModelService.initializeAdminDefaultModels()
          .catch(error => {
            console.error('初始化默认模型服务失败:', error);
          });
      }, 1000);
    } catch (error) {
      console.error('设置默认模型失败:', error)
      message.error('设置默认模型失败')
    }
  }

  // 取消默认模型设置
  const handleUnsetDefaultModel = async (modelId: string) => {
    try {
      // 使用后端API取消默认模型设置，保持与设置默认模型的一致性
      await apiService.aiModels.unsetDefaultAIModel(modelId);
      message.success('已取消默认模型设置')
      fetchDBModels()
    } catch (error) {
      console.error('取消默认模型设置失败:', error)
      message.error('取消默认模型设置失败')
    }
  }

  // 编辑模型
  const handleEditModel = (model: any) => {
    setEditingModel(model)
    setModalVisible(true)
  }

  // 处理模型编辑成功
  const handleModelEditSuccess = () => {
    setModalVisible(false)
    setEditingModel(null)
    fetchDBModels()
  }

  // 初始化数据
  useEffect(() => {
    fetchDBModels()
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>AI模型管理</Title>
      
      <Alert
        message="默认模型说明"
        description="默认模型将提供给所有会员（包括免费会员和基础会员）使用。只有管理员可以配置默认模型。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Alert
        message="重要提醒"
        description={
          <div>
            <div>在配置AI模型时，请注意区分<strong>配置名称</strong>和<strong>模型名称</strong>：</div>
            <div style={{ marginTop: '8px' }}>
              • <strong>配置名称</strong>：用于在系统中标识此配置的自定义名称，仅在系统内部显示
            </div>
            <div>
              • <strong>模型名称</strong>：实际调用的AI模型ID，必须与提供商的模型名称完全一致
            </div>
            <div style={{ marginTop: '8px' }}>
              • <strong>示例</strong>：如果使用OpenAI的gpt-4-turbo模型，配置名称可以是"OpenAI GPT-4 Turbo"，模型名称必须是"gpt-4-turbo"
            </div>
            <div style={{ marginTop: '8px', color: '#ff4d4f' }}>
              <strong>请务必确保模型名称正确，否则会导致调用失败！</strong>
            </div>
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Card 
        title="数据库中的AI模型" 
        style={{ marginBottom: '24px' }}
        extra={
          <Text type="secondary">
            共 {dbModels.length} 个模型
            {defaultModelId && (
              <span>
                ，默认模型: {dbModels.find((m: any) => m.id === defaultModelId)?.name || '未知'}
              </span>
            )}
          </Text>
        }
      >
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
              // 获取实际的模型名称
              const actualModelName = model.raw?.model || model.name
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
                        <Text type="secondary">Model: {actualModelName}</Text>
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
      </Card>

      {/* 编辑模型弹框 */}
      {editingModel && (
        <Modal
          title="编辑AI模型"
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            setEditingModel(null)
          }}
          footer={null}
          width={600}
        >
          <Form
            layout="vertical"
            initialValues={{
              name: editingModel.name,
              provider: editingModel.provider,
              connectionId: editingModel.connectionId,
              description: editingModel.description,
              isDefault: editingModel.isDefault,
              raw: editingModel.raw ? JSON.stringify(editingModel.raw, null, 2) : ''
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
                
                const updatedModel = {
                  ...editingModel,
                  name: values.name,
                  provider: values.provider,
                  connectionId: values.connectionId,
                  description: values.description,
                  isDefault: values.isDefault,
                  raw: raw
                }
                
                await databaseManager.aiModels.updateAIModel(updatedModel)
                message.success('模型更新成功')
                handleModelEditSuccess()
              } catch (error) {
                console.error('更新模型失败:', error)
                message.error('更新模型失败')
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
                  setModalVisible(false)
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