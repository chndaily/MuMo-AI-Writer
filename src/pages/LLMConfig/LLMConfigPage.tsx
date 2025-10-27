import React, { useState, useEffect } from 'react'
import { LLMConfigPanel } from './modules/LLMConfigPanel'
import { Tabs } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useMembershipStore } from '@/stores/membershipStore'
import { Result } from 'antd'
import { LockOutlined } from '@ant-design/icons'

const { TabPane } = Tabs

export const LLMConfigPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin } = useMembershipStore()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const [refresh, setRefresh] = useState(0);
  
  const handleConfigChange = () => {
    // 触发重新渲染以显示新添加的配置
    setRefresh(prev => prev + 1);
  };

  useEffect(() => {
    // 检查用户权限
    const checkPermission = () => {
      const isAdminUser = isAdmin()
      setHasPermission(isAdminUser)
      
      // 如果不是管理员，跳转到创作中心
      if (!isAdminUser) {
        navigate('/')
      }
    }

    checkPermission()
  }, [isAdmin, navigate])

  // 如果还在检查权限，显示加载状态
  if (hasPermission === null) {
    return <div>验证权限中...</div>
  }

  // 如果没有权限，显示403页面
  if (!hasPermission) {
    return (
      <div style={{ padding: '24px' }}>
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面。只有管理员可以配置AI模型。"
          icon={<LockOutlined />}
        />
      </div>
    )
  }

  return (
    <Tabs defaultActiveKey="1">
      <TabPane tab="模型配置" key="1">
        <LLMConfigPanel key={refresh} onConfigChange={handleConfigChange} />
      </TabPane>
    </Tabs>
  )
}