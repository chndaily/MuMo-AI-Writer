// DebugAIModels.tsx - 用于调试AI模型数据的页面组件
import React, { useState, useEffect } from 'react'
import { databaseManager } from '@/services/index'
import { Button, Table, Space, Card } from 'antd'

const DebugAIModels: React.FC = () => {
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  // 获取所有AI模型
  const fetchModels = async () => {
    setLoading(true)
    try {
      console.log('开始获取AI模型数据...')
      const allModels = await databaseManager.aiModels.getAllAIModels()
      console.log('获取到的模型数据:', allModels)
      setModels(allModels)
      setStatus(`成功获取到 ${allModels.length} 个模型`)
    } catch (error) {
      console.error('获取模型数据失败:', error)
      setStatus(`获取模型数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 获取默认AI模型
  const fetchDefaultModels = async () => {
    setLoading(true)
    try {
      console.log('开始获取默认AI模型数据...')
      const defaultModels = await databaseManager.aiModels.getDefaultAIModels()
      console.log('获取到的默认模型数据:', defaultModels)
      setModels(defaultModels)
      setStatus(`成功获取到 ${defaultModels.length} 个默认模型`)
    } catch (error) {
      console.error('获取默认模型数据失败:', error)
      setStatus(`获取默认模型数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 清空所有模型
  const clearModels = async () => {
    setLoading(true)
    try {
      console.log('开始清空AI模型数据...')
      const allModels = await databaseManager.aiModels.getAllAIModels()
      for (const model of allModels) {
        await databaseManager.aiModels.deleteAIModel(model.id)
      }
      setModels([])
      setStatus(`成功清空 ${allModels.length} 个模型`)
    } catch (error) {
      console.error('清空模型数据失败:', error)
      setStatus(`清空模型数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
    },
    {
      title: '连接ID',
      dataIndex: 'connectionId',
      key: 'connectionId',
    },
    {
      title: '是否默认',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault: boolean) => (isDefault ? '是' : '否'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <Card title="AI模型调试页面">
        <Space style={{ marginBottom: '16px' }}>
          <Button onClick={fetchModels} loading={loading}>获取所有模型</Button>
          <Button onClick={fetchDefaultModels} loading={loading}>获取默认模型</Button>
          <Button onClick={clearModels} loading={loading} danger>清空所有模型</Button>
        </Space>
        
        <div style={{ marginBottom: '16px' }}>
          <strong>状态:</strong> {status}
        </div>
        
        <Table 
          dataSource={models} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default DebugAIModels