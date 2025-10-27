import React from 'react'
import { Layout } from 'antd'

const { Content } = Layout

const PublicLayoutNoHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: 0 }}>
        {children}
      </Content>
    </Layout>
  )
}

export default PublicLayoutNoHeader