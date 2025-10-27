import React from 'react'
import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  EditOutlined,
  BookOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  TagsOutlined,
  CreditCardOutlined,
  UserOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { useMembershipStore } from '@/stores/membershipStore'

const { Sider } = Layout

const AppSider: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isProfessionalOrAdmin, isAdmin } = useMembershipStore();
  // 修改权限检查，只允许管理员访问AI模型配置
  const canAccessLLM = isAdmin();
  const canAccessDatabase = isAdmin();

  // 根据权限动态构建菜单项
  const menuItems = [
    {
      key: '/home',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/novels',
      icon: <BookOutlined />,
      label: '我的小说',
    },
    {
      key: '/creation-center',
      icon: <EditOutlined />,
      label: '创作中心',
    },
    {
      key: '/ai-workspace',
      icon: <ThunderboltOutlined />,
      label: 'AI智能工作台',
    },
    {
      key: '/prompts',
      icon: <TagsOutlined />,
      label: '提示词库',
    },
    {
      key: '/ai-test',
      icon: <ExperimentOutlined />,
      label: 'AI模型测试',
    },
    // 仅管理员可见（取消专业会员的访问权限）
    ...(canAccessLLM ? [{
      key: '/llm-config',
      icon: <SettingOutlined />,
      label: 'AI模型配置',
    }] : []),
    // 仅管理员可见
    ...(canAccessDatabase ? [{
      key: '/config/supabase',
      icon: <DatabaseOutlined />,
      label: '数据库配置',
    }] : []),
    // 仅管理员可见
    ...(canAccessDatabase ? [{
      key: '/config/payment',
      icon: <CreditCardOutlined />,
      label: '支付配置',
    }] : []),
    // 仅管理员可见
    ...(canAccessDatabase ? [{
      key: '/config/users',
      icon: <UserOutlined />,
      label: '会员管理',
    }] : []),
    // 仅管理员可见 - 新增的小说管理
    ...(canAccessDatabase ? [{
      key: '/config/novels',
      icon: <BookOutlined />,
      label: '小说管理',
    }] : []),
    // 仅管理员可见 - 数据同步配置
    ...(canAccessDatabase ? [{
      key: '/sync-config',
      icon: <SyncOutlined />,
      label: '数据同步',
    }] : []),

  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    // 检查是否有权限访问该页面
    if (key === '/llm-config' && !canAccessLLM) {
      return;
    }
    if ((key === '/config/supabase' || key === '/config/payment' || key === '/config/users' || key === '/config/novels') && !canAccessDatabase) {
      return;
    }
    
    navigate(key)
  }

  return (
    <Sider width={200} theme="light">
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}

export default AppSider