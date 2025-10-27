import React from 'react'
import { Layout, Typography, Button, Space, Avatar, Dropdown, message } from 'antd'
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMembershipStore } from '@/stores/membershipStore'
import { MembershipLevel } from '@/stores/membershipStore'
import { authService } from '@/services/authService'

const { Header } = Layout
const { Title } = Typography

const AppHeader: React.FC = () => {
  const navigate = useNavigate()
  const { clearAuth, authToken } = useMembershipStore()

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  const handleMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        // 跳转到个人资料页面
        navigate('/profile');
        break
      case 'settings':
        // 跳转到设置页面
        navigate('/settings');
        break
      case 'logout':
        // 处理退出登录
        try {
          // 调用认证服务登出
          if (authToken) {
            await authService.logout(authToken);
          }
          
          // 清除本地认证信息
          clearAuth();
          
          message.success('已退出登录');
          navigate('/');
        } catch (error) {
          message.error('登出过程中发生错误');
        }
        break
    }
  }

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Title
          level={3}
          style={{
            margin: 0,
            color: '#1890ff',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          木墨文坊
        </Title>
      </div>

      <Space>
        <Button type="primary" onClick={() => navigate('/creation-center')}>
          开始创作
        </Button>
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: handleMenuClick,
          }}
          placement="bottomRight"
        >
          <Avatar
            icon={<UserOutlined />}
            style={{ cursor: 'pointer' }}
          />
        </Dropdown>
      </Space>
    </Header>
  )
}

export default AppHeader