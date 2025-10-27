import React from 'react'
import { Layout } from 'antd'
import AppHeader from '@/components/common/AppHeader'

const { Content } = Layout

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Content style={{ margin: '0 16px' }}>
        {children}
      </Content>
    </Layout>
  )
}

export default PublicLayout