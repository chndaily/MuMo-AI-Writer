import React from 'react'
import { useMembership } from '@/hooks/useMembership'
import { Button, Tooltip } from 'antd'
import { LockOutlined } from '@ant-design/icons'

interface PermissionWrapperProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradeButton?: boolean
  onUpgrade?: (requiredLevel: string) => void
}

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  feature,
  children,
  fallback = null,
  showUpgradeButton = false,
  onUpgrade
}) => {
  const { checkPermission, getUpgradeSuggestion } = useMembership()
  
  // 检查权限
  const hasPermission = checkPermission(feature)
  
  // 如果有权限，直接渲染子组件
  if (hasPermission) {
    return <>{children}</>
  }
  
  // 如果没有权限，但提供了降级渲染内容
  if (fallback) {
    return <>{fallback}</>
  }
  
  // 如果需要显示升级按钮
  if (showUpgradeButton) {
    const requiredLevel = getUpgradeSuggestion(feature)
    
    if (requiredLevel) {
      return (
        <Tooltip title={`此功能需要${requiredLevel === 'professional' ? '专业会员' : '基础会员'}才能使用`}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ opacity: 0.5 }}>
              {children}
            </div>
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
            >
              <Button 
                type="primary" 
                icon={<LockOutlined />}
                onClick={() => onUpgrade && onUpgrade(requiredLevel)}
                size="small"
              >
                升级解锁
              </Button>
            </div>
          </div>
        </Tooltip>
      )
    }
  }
  
  // 默认情况下隐藏内容
  return null
}

export default PermissionWrapper