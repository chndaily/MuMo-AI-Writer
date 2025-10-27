import React, { useState } from 'react'
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
  Modal,
  Form,
  InputNumber,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

interface Novel {
  id: string
  title: string
  genre: string
  wordCount: number
  progress: number
  lastModified: string
  status: 'draft' | 'publishing' | 'completed'
  author?: string
  description?: string
  targetWordCount?: number
}

const NovelList: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editForm] = Form.useForm()

  // 模拟数据
  const novels: Novel[] = [
    {
      id: '1',
      title: '星辰大海的传说',
      genre: '奇幻',
      wordCount: 156789,
      progress: 85,
      lastModified: '2024-01-15',
      status: 'publishing',
      author: '张三',
      description: '一个关于星辰大海的奇幻故事',
      targetWordCount: 200000,
    },
    {
      id: '2',
      title: '都市之最强医仙',
      genre: '现代',
      wordCount: 234567,
      progress: 60,
      lastModified: '2024-01-14',
      status: 'draft',
      author: '李四',
      description: '现代都市中的医仙传奇',
      targetWordCount: 300000,
    },
    {
      id: '3',
      title: '古代王朝的崛起',
      genre: '历史',
      wordCount: 98765,
      progress: 100,
      lastModified: '2024-01-13',
      status: 'completed',
      author: '王五',
      description: '讲述古代王朝的兴衰历程',
      targetWordCount: 150000,
    },
  ]

  const genres = [
    { value: 'fantasy', label: '奇幻' },
    { value: 'romance', label: '言情' },
    { value: 'mystery', label: '悬疑' },
    { value: 'scifi', label: '科幻' },
    { value: 'historical', label: '历史' },
    { value: 'modern', label: '现代' },
  ]

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

  // 处理开始创作
  const handleStartCreation = (record: Novel) => {
    navigate(`/novels/${record.id}/manuscript`)
  }

  // 处理编辑小说资料
  const handleEditNovel = (record: Novel) => {
    setEditingNovel(record)
    editForm.setFieldsValue({
      title: record.title,
      genre: record.genre,
      author: record.author || '',
      description: record.description || '',
      targetWordCount: record.targetWordCount || 100000,
    })
    setEditModalVisible(true)
  }

  // 处理保存编辑
  const handleSaveEdit = async (values: any) => {
    try {
      // 这里应该是调用API保存数据
      console.log('保存小说资料:', { ...editingNovel, ...values })
      message.success('小说资料保存成功')
      setEditModalVisible(false)
      setEditingNovel(null)
    } catch (error) {
      message.error('保存失败，请重试')
    }
  }

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
      render: (text: string) => <Tag color="blue">{text}</Tag>,
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
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: progress === 100 ? '#52c41a' : '#1890ff',
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
      key: 'action',
      render: (_: any, record: Novel) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStartCreation(record)}
          >
            开始创作
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: '编辑资料',
                  onClick: () => handleEditNovel(record),
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  onClick: () => {
                    Modal.confirm({
                      title: '确认删除',
                      content: `确定要删除小说《${record.title}》吗？`,
                      okText: '确认',
                      okType: 'danger',
                      cancelText: '取消',
                      onOk() {
                        console.log('删除小说:', record.id)
                        message.success('删除成功')
                      },
                    })
                  },
                },
              ],
            }}
            trigger={['click']}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  const filteredNovels = novels.filter(
    (novel) =>
      novel.title.toLowerCase().includes(searchText.toLowerCase()) ||
      novel.genre.toLowerCase().includes(searchText.toLowerCase()) ||
      novel.author?.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          我的小说
        </Title>
        <Button type="primary" icon={<PlusOutlined />} size="large">
          创建新书
        </Button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Search
          placeholder="搜索小说标题、类型或作者"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '300px' }}
        />
      </div>

      <Table
        dataSource={filteredNovels}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
        }}
      />

      <Modal
        title="编辑小说资料"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false)
          setEditingNovel(null)
        }}
        onOk={() => {
          editForm
            .validateFields()
            .then((values) => {
              handleSaveEdit(values)
              editForm.resetFields()
            })
            .catch((info) => {
              console.log('验证失败:', info)
            })
        }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="title"
            label="小说标题"
            rules={[{ required: true, message: '请输入小说标题' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="genre" label="类型">
            <Select>
              {genres.map((genre) => (
                <Option key={genre.value} value={genre.value}>
                  {genre.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="author" label="作者">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="targetWordCount" label="目标字数">
            <InputNumber
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '') as any}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default NovelList