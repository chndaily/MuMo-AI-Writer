import React, { useState } from 'react'
import { Button, Modal, Space, Typography, Card, Row, Col } from 'antd'
import {
  EditOutlined,
  BookOutlined,
  ThunderboltOutlined,
  StarOutlined,
  RobotOutlined,
  BarChartOutlined,
  GlobalOutlined,
  CloudSyncOutlined,
  TagsOutlined,
  DatabaseOutlined,
  SettingOutlined,
  PlusOutlined,
  RocketOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PublicLayoutNoHeader from '@/components/common/PublicLayoutNoHeader'
import './HomePage.scss' // 复用首页样式

const { Title, Paragraph } = Typography

const PublicHomePage: React.FC = () => {
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)

  // 处理登录
  const handleLogin = () => {
    navigate('/login')
    setShowLoginModal(false)
  }

  // 处理注册
  const handleRegister = () => {
    // 导航到注册标签页
    navigate('/login?tab=register')
    setShowLoginModal(false)
  }

  return (
    <PublicLayoutNoHeader>
      <div 
        style={{ 
          padding: '0',
          minHeight: '100vh',
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        {/* 登录模态框 */}
        <Modal
          title="欢迎使用木墨文坊"
          open={showLoginModal}
          onCancel={() => setShowLoginModal(false)}
          footer={null}
          closable={true}
          maskClosable={true}
          width={400}
        >
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ marginBottom: '24px' }}>
              <BookOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </div>
            <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
              请登录或注册以开始您的创作之旅
            </Paragraph>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" size="large" block onClick={handleLogin}>
                登录
              </Button>
              <Button size="large" block onClick={handleRegister}>
                注册
              </Button>
            </Space>
          </div>
        </Modal>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <Title level={1} style={{ color: '#fff', marginBottom: '16px' }}>
              木墨文坊
            </Title>
            <Paragraph style={{ fontSize: '18px', color: '#fff', maxWidth: '800px', margin: '0 auto' }}>
              借助AI技术，让您的创作更加高效和精彩
            </Paragraph>
          </div>

          <Row gutter={[24, 24]} style={{ marginBottom: '48px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card className="feature-card" style={{ height: '100%' }}>
                <div className="feature-icon">
                  <RobotOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
                </div>
                <Title level={5} style={{ marginTop: '16px', marginBottom: '8px', color: '#333' }}>AI智能辅助</Title>
                <Paragraph type="secondary" style={{ fontSize: '14px', minHeight: '60px' }}>
                  集成先进的AI技术，提供智能写作建议、情节推荐和角色塑造辅助，激发创作灵感
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="feature-card" style={{ height: '100%' }}>
                <div className="feature-icon">
                  <EditOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                </div>
                <Title level={5} style={{ marginTop: '16px', marginBottom: '8px', color: '#333' }}>专业编辑器</Title>
                <Paragraph type="secondary" style={{ fontSize: '14px', minHeight: '60px' }}>
                  功能强大的在线编辑器，支持实时预览、版本管理和协作编辑，提升写作效率
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="feature-card" style={{ height: '100%' }}>
                <div className="feature-icon">
                  <BookOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                </div>
                <Title level={5} style={{ marginTop: '16px', marginBottom: '8px', color: '#333' }}>丰富模板库</Title>
                <Paragraph type="secondary" style={{ fontSize: '14px', minHeight: '60px' }}>
                  提供多种小说类型模板和提示词库，快速开始创作，降低创作门槛
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="feature-card" style={{ height: '100%' }}>
                <div className="feature-icon">
                  <BarChartOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                </div>
                <Title level={5} style={{ marginTop: '16px', marginBottom: '8px', color: '#333' }}>数据驱动</Title>
                <Paragraph type="secondary" style={{ fontSize: '14px', minHeight: '60px' }}>
                  详细的创作数据统计和分析，帮助您了解创作进度，优化写作习惯
                </Paragraph>
              </Card>
            </Col>
          </Row>

          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>
              平台核心功能
            </Title>
            
            <Row gutter={[24, 24]} justify="center">
              <Col xs={24} sm={12} md={4}>
                <Card size="small" className="feature-highlight">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div className="highlight-icon">
                      <ThunderboltOutlined style={{ color: '#722ed1' }} />
                    </div>
                    <Paragraph strong style={{ margin: 0 }}>智能续写</Paragraph>
                    <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>AI辅助情节发展</Paragraph>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Card size="small" className="feature-highlight">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div className="highlight-icon">
                      <UserOutlined style={{ color: '#1890ff' }} />
                    </div>
                    <Paragraph strong style={{ margin: 0 }}>角色塑造</Paragraph>
                    <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>智能角色设定工具</Paragraph>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Card size="small" className="feature-highlight">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div className="highlight-icon">
                      <GlobalOutlined style={{ color: '#52c41a' }} />
                    </div>
                    <Paragraph strong style={{ margin: 0 }}>世界观构建</Paragraph>
                    <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>完整设定体系</Paragraph>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Card size="small" className="feature-highlight">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div className="highlight-icon">
                      <FileTextOutlined style={{ color: '#faad14' }} />
                    </div>
                    <Paragraph strong style={{ margin: 0 }}>大纲管理</Paragraph>
                    <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>结构化创作规划</Paragraph>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Card size="small" className="feature-highlight">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div className="highlight-icon">
                      <CloudSyncOutlined style={{ color: '#722ed1' }} />
                    </div>
                    <Paragraph strong style={{ margin: 0 }}>云端同步</Paragraph>
                    <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>多设备数据同步</Paragraph>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Card size="small" className="feature-highlight">
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div className="highlight-icon">
                      <TagsOutlined style={{ color: '#1890ff' }} />
                    </div>
                    <Paragraph strong style={{ margin: 0 }}>提示词库</Paragraph>
                    <Paragraph type="secondary" style={{ fontSize: '12px', margin: 0 }}>创作模板资源</Paragraph>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>

          <div style={{ textAlign: 'center', padding: '40px 0', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
            <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>
              开始您的创作之旅
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#fff', marginBottom: '32px', maxWidth: '600px', margin: '0 auto' }}>
              加入我们，体验AI驱动的全新创作方式，让您的想象力得到最大程度的发挥
            </Paragraph>
            <Button 
              type="primary" 
              size="large" 
              style={{ 
                fontSize: '16px', 
                height: '48px', 
                padding: '0 48px',
                backgroundColor: '#fff',
                color: '#722ed1',
                borderColor: '#fff'
              }}
              onClick={() => setShowLoginModal(true)}
            >
              立即开始创作
            </Button>
          </div>
        </div>
      </div>
    </PublicLayoutNoHeader>
  )
}

export default PublicHomePage