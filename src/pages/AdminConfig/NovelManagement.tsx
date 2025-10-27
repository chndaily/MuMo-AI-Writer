import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  message,
  Modal,
  Popconfirm,
  Input,
  Select,
  Descriptions,
  Alert
} from 'antd'
import { 
  BookOutlined, 
  UserOutlined, 
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  FilterOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMembershipStore } from '@/stores/membershipStore'
import { apiService } from '@/services/apiService'
import type { Novel } from '#/novel'

const { Title, Text } = Typography
const { Option } = Select

const NovelManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin, membershipInfo } = useMembershipStore()
  const [novels, setNovels] = useState<Novel[]>([])
  const [filteredNovels, setFilteredNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [allAuthors, setAllAuthors] = useState<string[]>([])
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // 检查权限
  const checkAdminPermission = () => {
    return isAdmin()
  }

  // 加载所有小说
  const loadNovels = async () => {
    setLoading(true)
    try {
      let novelList: Novel[] = [];
      
      // 检查是否为管理员
      if (isAdmin()) {
        // 管理员可以看到所有小说
        novelList = await apiService.novels.getAllNovels()
      } else {
        // 普通用户只能看到自己的小说
        const currentUserId = membershipInfo.email || 'anonymous';
        novelList = await apiService.novels.getCurrentUserNovels(currentUserId)
      }
      
      console.log('Loaded novel list:', novelList)
      setNovels(novelList)
      setFilteredNovels(novelList)
      
      // 提取所有作者
      const authors = Array.from(new Set(novelList.map(novel => novel.author || '未知作者')))
      setAllAuthors(authors)
    } catch (error) {
      // 静默处理错误，不显示错误消息
      console.error('Failed to load novels:', error)
    } finally {
      setLoading(false)
    }
  }

  // 刷新小说列表
  const handleRefresh = () => {
    loadNovels()
  }

  // 删除小说
  const handleDeleteNovel = async (novel: Novel) => {
    try {
      // 删除小说
      await apiService.novels.deleteNovel(novel.id);
      
      message.success(`小说《${novel.title}》删除成功`);
      // 重新加载小说列表
      loadNovels();
    } catch (error) {
      message.error('删除小说失败');
      console.error('Failed to delete novel:', error);
    }
  }

  // 批量删除小说
  const handleBatchDeleteNovels = async () => {
    if (selectedRowKeys.length === 0) {
      message.info('请先选择要删除的小说');
      return;
    }
    
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 本小说吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 获取要删除的小说
          const novelsToDelete = novels.filter(novel => selectedRowKeys.includes(novel.id));
          
          let successCount = 0;
          
          // 逐个删除
          for (const novel of novelsToDelete) {
            try {
              await apiService.novels.deleteNovel(novel.id);
              successCount++;
            } catch (error) {
              console.error(`删除小说 ${novel.id} 失败:`, error);
            }
          }
          
          message.success(`成功删除 ${successCount} 本小说`);
          // 清空选择
          setSelectedRowKeys([]);
          // 重新加载小说列表
          loadNovels();
        } catch (error) {
          message.error('批量删除小说失败');
          console.error('Failed to batch delete novels:', error);
        }
      }
    });
  }

  // 查看小说详情
  const handleViewNovel = (novel: Novel) => {
    setSelectedNovel(novel)
    setViewModalVisible(true)
  }

  // 搜索和过滤
  useEffect(() => {
    let result = [...novels]
    
    // 搜索过滤
    if (searchText) {
      result = result.filter(novel => 
        novel.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (novel.author && novel.author.toLowerCase().includes(searchText.toLowerCase()))
      )
    }
    
    // 作者过滤
    if (authorFilter) {
      result = result.filter(novel => novel.author === authorFilter)
    }
    
    setFilteredNovels(result)
  }, [searchText, authorFilter, novels])

  // 初始化
  useEffect(() => {
    console.log('NovelManagement component mounted')
    loadNovels()
  }, [])

  // 检查权限
  const hasPermission = checkAdminPermission()
  console.log('Admin permission check result:', hasPermission)
  
  if (!hasPermission) {
    console.log('User does not have admin permission, showing permission denied page')
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="danger">您没有权限访问此页面</Text>
        <div style={{ marginTop: '16px' }}>
          <Button 
            type="primary" 
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        </div>
      </div>
    )
  } else {
    const columns = [
      {
        title: '书名',
        dataIndex: 'title',
        key: 'title',
        render: (text: string, record: Novel) => (
          <Space>
            <BookOutlined />
            <span>{text}</span>
          </Space>
        )
      },
      {
        title: '作者',
        dataIndex: 'author',
        key: 'author',
        render: (text: string) => (
          <Space>
            <UserOutlined />
            <span>{text || '未知'}</span>
          </Space>
        )
      },
      {
        title: '类型',
        dataIndex: 'genre',
        key: 'genre',
        render: (text: string) => {
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
          }
          return <Tag>{genreMap[text] || text}</Tag>
        }
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (text: string) => {
          const statusMap: Record<string, { text: string, color: string }> = {
            'draft': { text: '草稿', color: 'default' },
            'publishing': { text: '发布中', color: 'processing' },
            'completed': { text: '已完成', color: 'success' }
          }
          const status = statusMap[text] || { text: text, color: 'default' }
          return <Tag color={status.color}>{status.text}</Tag>
        }
      },
      {
        title: '进度',
        dataIndex: 'progress',
        key: 'progress',
        render: (text: number) => `${text}%`
      },
      {
        title: '字数',
        dataIndex: 'wordCount',
        key: 'wordCount',
        render: (text: number) => (text != null ? text.toLocaleString() : '0')
      },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: Novel) => (
          <Space size="middle">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => handleViewNovel(record)}
              size="small"
            >
              查看
            </Button>
            <Popconfirm
              title="确认删除"
              description={`确定要删除小说《${record.title}》吗？此操作不可恢复。`}
              onConfirm={() => handleDeleteNovel(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button 
                icon={<DeleteOutlined />} 
                danger 
                size="small"
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ]

    return (
      <div style={{ padding: '24px' }}>
        {/* 添加返回按钮 */}
        <div style={{ marginBottom: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/')}
          >
            返回
          </Button>
        </div>
        
        <Card>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>
              <BookOutlined /> 小说管理
            </Title>
            <Space>
              <Button 
                type="primary" 
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDeleteNovels}
                disabled={selectedRowKeys.length === 0}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
              <Button onClick={handleRefresh}>刷新</Button>
            </Space>
          </div>
          
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Input
              placeholder="搜索书名或作者"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="按作者筛选"
              style={{ width: 150 }}
              allowClear
              value={authorFilter}
              onChange={(value) => setAuthorFilter(value || '')}
            >
              {allAuthors.map(author => (
                <Option key={author} value={author}>{author}</Option>
              ))}
            </Select>
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => {
                setSearchText('')
                setAuthorFilter('')
              }}
            >
              清除筛选
            </Button>
          </div>
          
          <Table
            dataSource={filteredNovels}
            columns={columns}
            rowKey="id"
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true
            }}
          />
        </Card>

        {/* 查看小说详情模态框 */}
        <Modal
          title="小说详情"
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={null}
          width={600}
        >
          {selectedNovel && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="书名">{selectedNovel.title}</Descriptions.Item>
              <Descriptions.Item label="作者">{selectedNovel.author || '未知'}</Descriptions.Item>
              <Descriptions.Item label="类型">
                {(() => {
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
                  }
                  return genreMap[selectedNovel.genre] || selectedNovel.genre
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const statusMap: Record<string, string> = {
                    'draft': '草稿',
                    'publishing': '发布中',
                    'completed': '已完成'
                  }
                  return statusMap[selectedNovel.status] || selectedNovel.status
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="进度">{selectedNovel.progress}%</Descriptions.Item>
              <Descriptions.Item label="字数">{selectedNovel.wordCount != null ? selectedNovel.wordCount.toLocaleString() : '0'}</Descriptions.Item>
              <Descriptions.Item label="目标字数">{selectedNovel.targetWordCount != null ? selectedNovel.targetWordCount.toLocaleString() : '未设置'}</Descriptions.Item>
              <Descriptions.Item label="简介">{selectedNovel.description || '无'}</Descriptions.Item>
              <Descriptions.Item label="标签">
                {selectedNovel.tags && selectedNovel.tags.length > 0 
                  ? selectedNovel.tags.join(', ') 
                  : '无'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedNovel.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="最后修改">
                {new Date(selectedNovel.lastModified).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    )
  }
}

export default NovelManagementPage