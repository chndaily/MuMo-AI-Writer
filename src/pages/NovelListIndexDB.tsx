import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Table,
  Dropdown,
  message,
  Alert,
  Spin,
  Modal,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNovelIndexDBStore } from '@/stores/novelIndexDBStore'
import { Novel } from '#/novel'
import { databaseManager } from '@/services'  // 修改导入，移除 getDatabaseStatus
import CreateNovelModal from '@/pages/Novels/modules/CreateNovelModal'
import EditNovelModal from '@/pages/Novels/modules/EditNovelModal'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const NovelListIndexDB: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dbStatus, setDbStatus] = useState<string>('未知')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentEditingNovel, setCurrentEditingNovel] = useState<Novel | null>(null)

  const {
    novels,
    genres,
    isLoading,
    error,
    addNovel,
    deleteNovel,
    refreshNovels,
    refreshGenres,
  } = useNovelIndexDBStore()

  // 初始化数据
  useEffect(() => {
    const initialize = async () => {
      try {
        // 检查数据库状态
        setDbStatus('MongoDB 已就绪');
        
        // 刷新小说列表（移除refreshGenres调用，因为genres模块已移除）
        await refreshNovels();
      } catch (err) {
        console.error('初始化失败:', err);
        setDbStatus('错误');
        message.error('数据库初始化失败，请尝试刷新页面或访问 /database-test 页面进行诊断');
      }
    };
    
    initialize();
  }, [refreshNovels]);

  // 当类型数据变化时，确保UI能正确更新
  useEffect(() => {
    console.log('类型数据更新:', genres);
  }, [genres]);

  // 获取类型显示名称
  const getGenreDisplayName = (genre: string): string => {
    // 由于genres模块已移除，使用默认的类型映射
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
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default'
      case 'publishing':
        return 'processing'
      case 'completed':
        return 'success'
      default:
        return 'default'
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '草稿'
      case 'publishing':
        return '连载中'
      case 'completed':
        return '已完结'
      default:
        return '未知'
    }
  }

  // 获取类型颜色
  const getGenreColor = (genre: string): string => {
    // 由于genres模块已移除，使用默认的颜色映射
    const colorMap: Record<string, string> = {
      'fantasy': 'purple',
      'scifi': 'cyan',
      'romance': 'pink',
      'mystery': 'blue',
      'thriller': 'red',
      'horror': 'dark',
      'adventure': 'green',
      'historical': 'gold',
      'biography': 'volcano',
      'urban': 'orange',
      'martial': 'magenta',
      'other': 'lime'
    };
    
    return colorMap[genre] || 'blue';
  };

  // 创建示例小说
  const createSampleNovel = async () => {
    try {
      await addNovel({
        title: `示例小说 ${Date.now()}`,
        content: '这是一个示例小说的内容...',
        genre: 'fantasy',
        wordCount: 1000,
        progress: 10,
        status: 'draft',
        description: '这是一个示例小说',
        tags: ['示例', '测试'],
      })
      message.success('示例小说创建成功')
    } catch (error) {
      message.error('创建示例小说失败')
    }
  }

  // 删除小说
  const handleDeleteNovel = async (id: string, title: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除小说《${title}》吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteNovel(id)
          message.success('小说删除成功')
        } catch (error) {
          message.error('删除小说失败')
        }
      }
    })
  }

  // 处理编辑小说
  const handleEditNovel = (novel: Novel) => {
    setCurrentEditingNovel(novel)
    setEditModalVisible(true)
  }

  // 处理开始创作
  const handleStartCreation = (novelId: string) => {
    navigate(`/novels/${novelId}`)
  }

  // 处理预览小说
  const handlePreviewNovel = (novelId: string) => {
    // 导航到小说预览页面
    navigate(`/novels/${novelId}`)
  }

  // 获取活跃的类型（由于genres模块已移除，使用默认的类型列表）
  const activeGenres = [
    { name: 'fantasy', displayName: '奇幻' },
    { name: 'scifi', displayName: '科幻' }, 
    { name: 'romance', displayName: '言情' },
    { name: 'mystery', displayName: '悬疑' },
    { name: 'thriller', displayName: '惊悚' },
    { name: 'horror', displayName: '恐怖' },
    { name: 'adventure', displayName: '冒险' },
    { name: 'historical', displayName: '历史' },
    { name: 'biography', displayName: '传记' },
    { name: 'urban', displayName: '都市' },
    { name: 'martial', displayName: '武侠' },
    { name: 'other', displayName: '其他' }
  ];

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Novel) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {text}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            最后修改：{record.lastModified}
          </Text>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'genre',
      key: 'genre',
      render: (genre: string) => {
        return (
          <Tag color={getGenreColor(genre)}>
            {getGenreDisplayName(genre)}
          </Tag>
        )
      },
    },
    {
      title: '字数',
      dataIndex: 'wordCount',
      key: 'wordCount',
      render: (count: number) => `${count.toLocaleString()}字`,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <Text strong>{progress}%</Text>
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#f0f0f0',
              borderRadius: '2px',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#1890ff',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: Novel) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStartCreation(record.id)}
          >
            创作
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: '编辑',
                  onClick: () => handleEditNovel(record),
                },
                {
                  key: 'view',
                  icon: <EyeOutlined />,
                  label: '预览',
                  onClick: () => handlePreviewNovel(record.id),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  onClick: () => handleDeleteNovel(record.id, record.title),
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  // 过滤小说
  const filteredNovels = novels.filter((novel) => {
    const matchesSearch = novel.title.toLowerCase().includes(searchText.toLowerCase())
    const matchesGenre = !filterGenre || novel.genre === filterGenre
    const matchesStatus = !filterStatus || novel.status === filterStatus
    return matchesSearch && matchesGenre && matchesStatus
  })

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={refreshNovels}>
            重试
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>我的小说</Title>
        <Text type="secondary">
          使用MongoDB存储的小说列表，数据持久化在云端
        </Text>
        <div style={{ marginTop: '8px' }}>
          <Text type="secondary">
            数据库状态: <Text strong style={{ color: dbStatus === '已就绪' ? '#52c41a' : dbStatus === '错误' ? '#ff4d4f' : '#faad14' }}>
              {dbStatus}
            </Text>
            {dbStatus !== '已就绪' && (
              <Button 
                type="link" 
                size="small" 
                onClick={() => navigate('/database-test')}
                style={{ marginLeft: '8px' }}
              >
                前往数据库诊断页面
              </Button>
            )}
          </Text>
        </div>
      </div>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Search
                placeholder="搜索小说标题"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="筛选类型"
                value={filterGenre}
                onChange={setFilterGenre}
                allowClear
                style={{ width: '100%' }}
              >
                {[
                  { name: 'fantasy', displayName: '奇幻' },
                  { name: 'scifi', displayName: '科幻' },
                  { name: 'romance', displayName: '言情' },
                  { name: 'mystery', displayName: '悬疑' },
                  { name: 'thriller', displayName: '惊悚' },
                  { name: 'horror', displayName: '恐怖' },
                  { name: 'adventure', displayName: '冒险' },
                  { name: 'historical', displayName: '历史' },
                  { name: 'biography', displayName: '传记' },
                  { name: 'urban', displayName: '都市' },
                  { name: 'martial', displayName: '武侠' },
                  { name: 'other', displayName: '其他' }
                ].map((genre) => (
                  <Option key={genre.name} value={genre.name}>
                    {genre.displayName}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="筛选状态"
                value={filterStatus}
                onChange={setFilterStatus}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="draft">草稿</Option>
                <Option value="publishing">连载中</Option>
                <Option value="completed">已完结</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={10}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  创建新小说
                </Button>
                <Button 
                  icon={<PlusOutlined />}
                  onClick={createSampleNovel}
                >
                  创建示例
                </Button>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={refreshNovels}
                  loading={isLoading}
                >
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>

          <div>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                共 {filteredNovels.length} 部小说
                {searchText && ` (搜索: "${searchText}")`}
              </Text>
            </div>

            <Spin spinning={isLoading}>
              <Table
                columns={columns}
                dataSource={filteredNovels}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </Spin>
          </div>
        </Space>
      </Card>

      {/* 创建小说模态框 */}
      <CreateNovelModal 
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false)
          refreshNovels()
          message.success('新书创建成功！')
        }}
      />
      
      {/* 编辑小说模态框 */}
      <EditNovelModal
        visible={editModalVisible}
        novel={currentEditingNovel}
        onCancel={() => {
          setEditModalVisible(false)
          setCurrentEditingNovel(null)
        }}
        onSuccess={() => {
          setEditModalVisible(false)
          setCurrentEditingNovel(null)
          refreshNovels()
          message.success('小说信息更新成功！')
        }}
      />
    </div>
  )
}

export default NovelListIndexDB