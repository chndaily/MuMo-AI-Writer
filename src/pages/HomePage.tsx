import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Row, Col, Card, Typography, Button, Statistic, Space, Divider, List, Avatar, Modal } from 'antd'
import {
  EditOutlined,
  BookOutlined,
  TrophyOutlined,
  UserOutlined,
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
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMembershipStore } from '@/stores/membershipStore'
import { MembershipLevel } from '@/stores/membershipStore'
import './HomePage.scss' // 引入样式文件

const { Title, Paragraph, Text } = Typography

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  // 直接使用 databaseManager 获取数据
  const [novels, setNovels] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const { membershipInfo, isAuthenticated } = useMembershipStore()
  
  const refreshNovels = useCallback(async () => {
    const { databaseManager } = await import('@/services/index');
    // 修改为只获取当前用户的小说
    const novelsData = await databaseManager.novels.getNovelsByUserId(membershipInfo.email || 'anonymous');
    setNovels(novelsData);
  }, [membershipInfo.email]);
  
  const refreshGenres = useCallback(async () => {
    const { databaseManager } = await import('@/services/index');
    // 获取所有文化设定并过滤出类型
    const allCultures = await databaseManager.worldSettings.getAllData('culture');
    // 过滤出系统级别的类型
    const genresData = allCultures
      .filter(culture => culture.tags?.includes('genre'))
      .map(culture => ({
        id: culture.id,
        name: culture.name,
        displayName: culture.description || culture.name,
        color: '#1890ff',
        isActive: true,
        createdAt: culture.createdAt,
      }));
    setGenres(genresData);
  }, []);

  const [totalWords, setTotalWords] = useState(0)
  const [completionRate, setCompletionRate] = useState(0)
  const [writingDays, setWritingDays] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // 当用户未登录时显示登录模态框
  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
    }
  }, [isAuthenticated])

  // 初始化数据
  useEffect(() => {
    const initialize = async () => {
      try {
        // 刷新小说列表和类型数据
        await Promise.all([
          refreshNovels(),
          refreshGenres()
        ]);
      } catch (err) {
        console.error('初始化数据失败:', err);
      }
    };
    
    initialize();
  }, [refreshNovels, refreshGenres]); // 添加依赖项

  // 计算统计数据
  const calculateStats = useCallback(() => {
    // 计算总字数
    const totalWords = novels.reduce((sum, novel) => sum + (novel.wordCount || 0), 0);
    setTotalWords(totalWords);
    
    // 计算平均完成度
    if (novels.length > 0) {
      const totalProgress = novels.reduce((sum, novel) => sum + (novel.progress || 0), 0);
      setCompletionRate(Math.round(totalProgress / novels.length));
    } else {
      setCompletionRate(0);
    }
    
    // 计算创作天数（简化计算，实际应该从统计数据中获取）
    setWritingDays(novels.length > 0 ? novels.length * 2 : 0);
  }, [novels]);

  // 当小说数据变化时重新计算统计
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

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

  // 快速操作
  const quickActions = useMemo(() => [
    {
      title: 'AI智能工作台',
      description: '进入专业的AI辅助创作环境',
      icon: <ThunderboltOutlined style={{ fontSize: '24px' }} />,
      action: () => navigate('/ai-workspace'),
      color: '#722ed1',
    },
    {
      title: '创作中心',
      description: '查看和管理已有作品',
      icon: <BookOutlined style={{ fontSize: '24px' }} />,
      action: () => navigate('/creation-center'),
      color: '#52c41a',
    },
    {
      title: '新建小说',
      description: '快速创建新的小说作品',
      icon: <EditOutlined style={{ fontSize: '24px' }} />,
      action: () => navigate('/novels'),
      color: '#1890ff',
    },
    {
      title: '提示词库',
      description: '管理和使用创作提示词模板',
      icon: <TagsOutlined style={{ fontSize: '24px' }} />,
      action: () => navigate('/prompts'),
      color: '#faad14',
    },
  ], [navigate]);

  // 新增功能快捷操作
  const featureActions = useMemo(() => [
    {
      title: '基础提示词模板',
      description: '系统预设的提示词模板，可作为创作基础',
      icon: <DatabaseOutlined style={{ fontSize: '18px' }} />,
      action: () => navigate('/prompts'),
      color: '#1890ff',
    },
    {
      title: '个性化提示词',
      description: '为每本小说定制专属提示词库',
      icon: <SettingOutlined style={{ fontSize: '18px' }} />,
      action: () => {
        // 如果有小说，跳转到第一本小说的提示词库
        if (novels.length > 0 && novels[0].id) {
          navigate(`/novels/${novels[0].id}/prompts`);
        } else {
          // 否则跳转到创作中心
          navigate('/creation-center');
        }
      },
      color: '#52c41a',
    },
    {
      title: '创建新模板',
      description: '创建可复用的提示词模板',
      icon: <PlusOutlined style={{ fontSize: '18px' }} />,
      action: () => navigate('/prompts'),
      color: '#722ed1',
    }
  ], [navigate, novels]);

  // 定义小说类型映射
  const genreMap: Record<string, string> = {
    'fantasy': '奇幻',
    'scifi': '科幻',
    'romance': '言情',
    'mystery': '悬疑',
    'thriller': '惊悚',
    'horror': '恐怖',
    'adventure': '冒险',
    'historical': '历史',
    'biography': '传记',
    'urban': '都市',
    'martial': '武侠',
    'other': '其他'
  };

  // 获取类型显示名称
  const getGenreDisplayName = useCallback((genre: string): string => {
    // 首先尝试从store中的genres查找匹配的类型
    const genreInfo = genres.find(g => g.name === genre);
    if (genreInfo) {
      return genreInfo.displayName;
    }
    
    // 如果在genres中找不到，使用默认的类型映射
    const genreMap: Record<string, string> = {
      'fantasy': '奇幻',
      'scifi': '科幻',
      'romance': '言情',
      'mystery': '悬疑',
      'thriller': '惊悚',
      'horror': '恐怖',
      'adventure': '冒险',
      'historical': '历史',
      'biography': '传记',
      'urban': '都市',
      'martial': '武侠',
      'other': '其他'
    };
    
    return genreMap[genre] || genre;
  }, [genres]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 登录模态框 */}
      <Modal
        title="欢迎使用木墨文坊"
        open={showLoginModal}
        onCancel={() => setShowLoginModal(false)}
        footer={null}
        closable={false}
        maskClosable={false}
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

      <div style={{ marginBottom: '32px' }}>
        <Title level={2}>欢迎使用木墨文坊</Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          借助AI技术，让您的创作更加高效和精彩
        </Paragraph>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总作品数"
              value={novels.length}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="创作字数"
              value={totalWords.toLocaleString()}
              suffix="字"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成度"
              value={completionRate}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="创作天数"
              value={writingDays}
              suffix="天"
            />
          </Card>
        </Col>
      </Row>

      <Title level={3} style={{ marginBottom: '24px' }}>
        快速操作
      </Title>

      <Row gutter={[16, 16]}>
        {quickActions.map((action, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}
              onClick={action.action}
            >
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    color: '#fff',
                  }}
                >
                  {action.icon}
                </div>
              </div>
              <Title level={4} style={{ marginBottom: '8px' }}>
                {action.title}
              </Title>
              <Paragraph style={{ color: '#666', marginBottom: '16px' }}>
                {action.description}
              </Paragraph>
              <Button type="primary" onClick={action.action} block>
                {action.title.includes('新建') ? '开始创作' : 
                 action.title.includes('提示词') ? '管理模板' : '进入页面'}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 新增功能区域 */}
      <div style={{ marginTop: '48px' }}>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <Space>
            <RocketOutlined />
            <span>提示词库功能</span>
          </Space>
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
          利用AI提示词模板提升创作效率，系统提供基础模板和个性化定制功能
        </Paragraph>
        
        <Row gutter={[16, 16]}>
          {featureActions.map((action, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                style={{ cursor: 'pointer', height: '100%' }}
                onClick={action.action}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: `${action.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: action.color,
                      marginRight: '12px',
                      flexShrink: 0,
                    }}
                  >
                    {action.icon}
                  </div>
                  <Title level={5} style={{ margin: 0 }}>
                    {action.title}
                  </Title>
                </div>
                <Paragraph style={{ color: '#666', marginBottom: '16px' }}>
                  {action.description}
                </Paragraph>
                <Button type="link" onClick={action.action} style={{ padding: 0 }}>
                  {action.title.includes('创建') ? '开始创建' : '立即体验'} →
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ marginTop: '48px' }}>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <Space>
            <StarOutlined />
            <span>平台核心优势</span>
          </Space>
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
          专为中文小说创作者打造的一站式AI辅助创作平台
        </Paragraph>
        
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="feature-card">
              <div className="feature-icon">
                <RobotOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
              </div>
              <Title level={5} style={{ marginTop: '16px', marginBottom: '8px' }}>AI智能辅助</Title>
              <Paragraph type="secondary" style={{ fontSize: '14px', minHeight: '60px' }}>
                集成先进的AI技术，提供智能写作建议、情节推荐和角色塑造辅助，激发创作灵感
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="feature-card">
              <div className="feature-icon">
                <EditOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              </div>
              <Title level={5} style={{ marginTop: '16px', marginBottom: '8px' }}>专业编辑器</Title>
              <Paragraph type="secondary" style={{ fontSize: '14px', minHeight: '60px' }}>
                功能强大的在线编辑器，支持实时预览、版本管理和协作编辑，提升写作效率
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="feature-card">
              <div className="feature-icon">
                <BookOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              </div>
              <Title level={5} style={{ marginTop: '16px', marginBottom: '8px' }}>丰富模板库</Title>
              <Paragraph type="secondary" style={{ fontSize: '14px', minHeight: '60px' }}>
                提供多种小说类型模板和提示词库，快速开始创作，降低创作门槛
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="feature-card">
              <div className="feature-icon">
                <BarChartOutlined style={{ fontSize: '24px', color: '#faad14' }} />
              </div>
              <Title level={5} style={{ marginTop: '16px', marginBottom: '8px' }}>数据驱动</Title>
              <Paragraph type="secondary" style={{ fontSize: '14px', minHeight: '60px' }}>
                详细的创作数据统计和分析，帮助您了解创作进度，优化写作习惯
              </Paragraph>
            </Card>
          </Col>
        </Row>
        
        {/* 新增特色功能展示 */}
        <div style={{ marginTop: '32px' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>特色功能</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={4}>
              <Card size="small" className="feature-highlight">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div className="highlight-icon">
                    <ThunderboltOutlined style={{ color: '#722ed1' }} />
                  </div>
                  <Text strong>智能续写</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>AI辅助情节发展</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Card size="small" className="feature-highlight">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div className="highlight-icon">
                    <UserOutlined style={{ color: '#1890ff' }} />
                  </div>
                  <Text strong>角色塑造</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>智能角色设定工具</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Card size="small" className="feature-highlight">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div className="highlight-icon">
                    <GlobalOutlined style={{ color: '#52c41a' }} />
                  </div>
                  <Text strong>世界观构建</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>完整设定体系</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Card size="small" className="feature-highlight">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div className="highlight-icon">
                    <FileTextOutlined style={{ color: '#faad14' }} />
                  </div>
                  <Text strong>大纲管理</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>结构化创作规划</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Card size="small" className="feature-highlight">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div className="highlight-icon">
                    <CloudSyncOutlined style={{ color: '#722ed1' }} />
                  </div>
                  <Text strong>云端同步</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>多设备数据同步</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Card size="small" className="feature-highlight">
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div className="highlight-icon">
                    <TagsOutlined style={{ color: '#1890ff' }} />
                  </div>
                  <Text strong>提示词库</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>创作模板资源</Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* 最近创作的小说 */}
      <div style={{ marginTop: '48px' }}>
        <Title level={3} style={{ marginBottom: '24px' }}>
          最近创作
        </Title>
        <Row gutter={[16, 16]}>
          {novels.length > 0 ? (
            novels
              .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
              .slice(0, 4)
              .map((novel) => (
                <Col xs={24} sm={12} md={6} key={novel.id}>
                  <Card
                    hoverable
                    cover={
                      novel.coverImage ? (
                        <img 
                          alt={novel.title} 
                          src={novel.coverImage} 
                          style={{ height: 140, objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ 
                          height: 140, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          backgroundColor: '#f0f0f0' 
                        }}>
                          <BookOutlined style={{ fontSize: 32, color: '#ccc' }} />
                        </div>
                      )
                    }
                    onClick={() => navigate(`/novels/${novel.id}`)}
                  >
                    <Card.Meta
                      title={novel.title}
                      description={
                        <div>
                          <div>{getGenreDisplayName(novel.genre)}</div>
                          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                            {novel.progress}% 完成 · {novel.wordCount?.toLocaleString() || 0} 字
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))
          ) : (
            <Col span={24}>
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <BookOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                  <Paragraph>暂无小说作品，点击下方按钮开始创作</Paragraph>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => navigate('/novels')}
                  >
                    创建第一部小说
                  </Button>
                </div>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </div>
  )
}

export default HomePage