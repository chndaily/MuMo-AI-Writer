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
  Form,
  Select,
  Input,
  DatePicker,
  Switch,
  Divider,
  Popconfirm
} from 'antd'
import { 
  UserOutlined, 
  EditOutlined, 
  SaveOutlined,
  ArrowLeftOutlined,
  CrownOutlined,
  ReloadOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMembershipStore, MembershipLevel } from '@/stores/membershipStore'
import { realAuthService } from '@/services/realAuthService'
import { getAllUsers, updateUser, updateUserMembership, updateUserAdminPermission, deleteUser, adminChangeUserPassword } from '@/services/userService'
import { isUserAdminAccount } from '@/services/adminProtectionService'
import type { UserInfo } from '@/services/userService'

const { Title, Text } = Typography
const { Option } = Select

const UserManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAdmin } = useMembershipStore()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  // 检查权限
  useEffect(() => {
    // 检查用户权限
    const checkPermission = () => {
      const isAdminUser = isAdmin()
      setHasPermission(isAdminUser)
      
      // 如果不是管理员，跳转到首页
      if (!isAdminUser) {
        navigate('/')
      }
    }

    checkPermission()
  }, [isAdmin, navigate])

  // 获取会员等级标签颜色
  const getLevelTagColor = (level: MembershipLevel | string) => {
    // 处理可能的字符串值，包括从数据库获取的原始值
    if (level === 'free' || level === MembershipLevel.FREE || (typeof level === 'string' && level.toLowerCase() === 'free')) return 'default'
    if (level === 'basic' || level === MembershipLevel.BASIC || (typeof level === 'string' && level.toLowerCase() === 'basic')) return 'blue'
    if (level === 'professional' || level === MembershipLevel.PROFESSIONAL || (typeof level === 'string' && level.toLowerCase() === 'professional')) return 'gold'
    
    // 如果是其他值，尝试匹配
    const levelStr = String(level).toLowerCase()
    if (levelStr.includes('professional') || levelStr.includes('pro')) return 'gold'
    if (levelStr.includes('basic')) return 'blue'
    if (levelStr.includes('free')) return 'default'
    
    return 'default'
  }

  // 获取会员等级名称
  const getLevelName = (level: MembershipLevel | string) => {
    // 处理可能的字符串值，包括从数据库获取的原始值
    if (level === 'free' || level === MembershipLevel.FREE || (typeof level === 'string' && level.toLowerCase() === 'free')) return '免费会员'
    if (level === 'basic' || level === MembershipLevel.BASIC || (typeof level === 'string' && level.toLowerCase() === 'basic')) return '基础会员'
    if (level === 'professional' || level === MembershipLevel.PROFESSIONAL || (typeof level === 'string' && level.toLowerCase() === 'professional')) return '专业会员'
    
    // 如果是其他值，尝试匹配
    const levelStr = String(level).toLowerCase()
    if (levelStr.includes('professional') || levelStr.includes('pro')) return '专业会员'
    if (levelStr.includes('basic')) return '基础会员'
    if (levelStr.includes('free')) return '免费会员'
    
    return '未知'
  }

  // 获取所有用户列表
  const loadUsers = async () => {
    setLoading(true)
    try {
      const userList = await getAllUsers()
      console.log('Loaded user list:', userList)
      setUsers(userList)
    } catch (error) {
      message.error('加载用户列表失败')
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  // 刷新用户列表
  const handleRefresh = () => {
    loadUsers()
  }

  // 编辑用户
  const handleEditUser = (user: UserInfo) => {
    console.log('Editing user:', user);
    
    // 确保用户有有效的ID
    if (!user.id) {
      message.error('用户信息不完整，缺少用户ID');
      return;
    }
    
    setEditingUser(user)
    setEditModalVisible(true)
    
    // 延迟设置表单值，确保模态框完全渲染后再设置
    // 根据经验教训，避免直接通过form.setFieldsValue设置日期值
    setTimeout(() => {
      try {
        console.log('Setting form values for user:', user);
        
        // 处理会员等级，确保使用正确的枚举值
        let membershipLevelValue = MembershipLevel.FREE;
        if (user.membershipLevel) {
          // 标准化会员等级值
          const levelStr = String(user.membershipLevel).toLowerCase();
          if (levelStr === 'free' || levelStr === MembershipLevel.FREE) {
            membershipLevelValue = MembershipLevel.FREE;
          } else if (levelStr === 'basic' || levelStr === MembershipLevel.BASIC) {
            membershipLevelValue = MembershipLevel.BASIC;
          } else if (levelStr === 'professional' || levelStr === MembershipLevel.PROFESSIONAL) {
            membershipLevelValue = MembershipLevel.PROFESSIONAL;
          } else {
            // 默认为免费会员
            membershipLevelValue = MembershipLevel.FREE;
          }
        }
        
        // 根据经验教训"Ant Design表单日期字段初始化规范"
        // 完全避免直接设置日期字段，只设置其他字段
        const formValues: any = {
          membershipLevel: membershipLevelValue,
          isAdmin: Boolean(user.isAdmin)  // 确保是布尔值
        };
        
        // 只有当用户有有效的到期时间时才设置日期字段
        // 这样可以避免date.isValid is not a function的错误
        if (user.expiryDate && membershipLevelValue !== MembershipLevel.FREE) {
          // 不直接设置expiryDate字段，而是让用户手动操作
          // 这样可以避免Ant Design DatePicker的类型错误
          console.log('User has expiry date, but not setting it directly to avoid date validation errors');
        }
        
        console.log('Final form values (without date):', formValues);
        form.setFieldsValue(formValues);
        
      } catch (error) {
        console.error('Error setting form values:', error);
        message.error('设置用户信息时出现错误');
        // 出现任何错误都设置安全的默认值，但不包括日期字段
        form.setFieldsValue({
          membershipLevel: MembershipLevel.FREE,
          isAdmin: false
        });
      }
    }, 100);
  }

  // 保存用户修改
  const handleSaveUser = async (values: any) => {
    if (!editingUser) {
      message.error('未选择要编辑的用户');
      return;
    }
    
    // 确保用户有有效的ID
    if (!editingUser.id) {
      message.error('用户信息不完整，缺少用户ID');
      return;
    }
    
    // 检查是否尝试修改管理员账户的权限
    if (isUserAdminAccount(editingUser.username)) {
      // 管理员账户不能被降级
      if (values.membershipLevel !== MembershipLevel.PROFESSIONAL) {
        message.error('管理员账户不能被降级为其他会员等级');
        return;
      }
      
      // 管理员账户必须保持管理员权限
      if (!values.isAdmin) {
        message.error('管理员账户必须保持管理员权限');
        return;
      }
      
      // 管理员账户不能修改用户名和邮箱
      if (values.username && values.username !== editingUser.username) {
        message.error('管理员账户的用户名不能被修改');
        return;
      }
      
      if (values.email && values.email !== editingUser.email) {
        message.error('管理员账户的邮箱不能被修改');
        return;
      }
    }
    
    try {
      console.log('Saving user with values:', values);
      
      // 标准化会员等级值
      let membershipLevelValue = MembershipLevel.FREE;
      if (values.membershipLevel) {
        // 标准化会员等级值
        const levelStr = String(values.membershipLevel).toLowerCase();
        if (levelStr === 'free' || levelStr === MembershipLevel.FREE) {
          membershipLevelValue = MembershipLevel.FREE;
        } else if (levelStr === 'basic' || levelStr === MembershipLevel.BASIC) {
          membershipLevelValue = MembershipLevel.BASIC;
        } else if (levelStr === 'professional' || levelStr === MembershipLevel.PROFESSIONAL) {
          membershipLevelValue = MembershipLevel.PROFESSIONAL;
        } else {
          // 默认为免费会员
          membershipLevelValue = MembershipLevel.FREE;
        }
      }
      
      // 采用最安全的方式处理日期
      let expiryDateValue = null;
      if (values.expiryDate) {
        console.log('Processing expiryDate:', values.expiryDate, 'Type:', typeof values.expiryDate);
        // 处理Ant Design DatePicker返回的不同格式
        if (typeof values.expiryDate === 'string') {
          const parsedDate = new Date(values.expiryDate);
          if (parsedDate.toString() !== 'Invalid Date') {
            expiryDateValue = parsedDate;
          }
        } else if (values.expiryDate instanceof Date) {
          if (values.expiryDate.toString() !== 'Invalid Date') {
            expiryDateValue = values.expiryDate;
          }
        } else if (typeof values.expiryDate === 'object' && values.expiryDate !== null) {
          // 处理dayjs或其他日期库对象
          // 检查是否有toDate方法
          if (typeof values.expiryDate.toDate === 'function') {
            const convertedDate = values.expiryDate.toDate();
            if (convertedDate.toString() !== 'Invalid Date') {
              expiryDateValue = convertedDate;
            }
          } else if (typeof values.expiryDate.format === 'function') {
            // 处理dayjs对象
            try {
              const dateString = values.expiryDate.format('YYYY-MM-DD');
              const parsedDate = new Date(dateString);
              if (parsedDate.toString() !== 'Invalid Date') {
                expiryDateValue = parsedDate;
              }
            } catch (formatError) {
              console.error('Error formatting date with dayjs:', formatError);
              // 如果格式化失败，尝试直接转换
              const directParsedDate = new Date(values.expiryDate);
              if (directParsedDate.toString() !== 'Invalid Date') {
                expiryDateValue = directParsedDate;
              }
            }
          } else {
            // 尝试转换为字符串再解析
            const dateString = values.expiryDate.toString();
            const parsedDate = new Date(dateString);
            if (parsedDate.toString() !== 'Invalid Date') {
              expiryDateValue = parsedDate;
            }
          }
        } else {
          // 处理其他可能的日期格式
          const parsedDate = new Date(values.expiryDate);
          if (parsedDate.toString() !== 'Invalid Date') {
            expiryDateValue = parsedDate;
          }
        }
      }
      
      console.log('Processed expiryDateValue for saving:', expiryDateValue);
      console.log('Processed membershipLevelValue for saving:', membershipLevelValue);
      
      // 更新用户会员信息
      const membershipSuccess = await updateUserMembership(
        editingUser.id,
        membershipLevelValue,
        expiryDateValue
      ).catch(error => {
        console.error('Error updating user membership:', error);
        message.error('更新会员等级时出现错误: ' + (error.message || '未知错误'));
        return false;
      });
      
      if (!membershipSuccess) {
        message.error('保存用户信息失败：无法更新会员等级');
        return;
      }
      
      // 更新管理员权限
      const adminSuccess = await updateUserAdminPermission(
        editingUser.id,
        Boolean(values.isAdmin)  // 确保是布尔值
      ).catch(error => {
        console.error('Error updating user admin permission:', error);
        message.error('更新管理员权限时出现错误: ' + (error.message || '未知错误'));
        return false;
      });
      
      if (!adminSuccess) {
        message.error('保存用户信息失败：无法更新管理员权限');
        return;
      }
      
      // 检查是否提供了新密码并进行修改
      let passwordSuccess = true;
      if (values.newPassword && values.confirmPassword) {
        if (values.newPassword === values.confirmPassword) {
          try {
            await handleAdminChangePassword(editingUser.email, values.newPassword);
          } catch (error) {
            passwordSuccess = false;
            console.error('Failed to change password:', error);
            message.error('修改密码时出现错误: ' + (error.message || '未知错误'));
          }
        } else {
          message.error('两次输入的密码不一致');
          return;
        }
      }
      
      if (membershipSuccess && adminSuccess && passwordSuccess) {
        message.success(`用户 ${editingUser.username} 信息更新成功`)
        
        // 更新本地用户列表
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === editingUser.id 
              ? { 
                  ...user, 
                  membershipLevel: membershipLevelValue,
                  expiryDate: expiryDateValue,
                  isAdmin: Boolean(values.isAdmin)
                } 
              : user
          )
        )
        
        setEditModalVisible(false)
        setEditingUser(null)
        form.resetFields()
      } else {
        message.error('保存用户信息失败')
      }
    } catch (error) {
      message.error('保存用户信息失败: ' + (error.message || '未知错误'))
      console.error('Failed to save user:', error)
    }
  }

  // 管理员修改用户密码
  const handleAdminChangePassword = async (targetEmail: string, newPassword: string) => {
    try {
      // 获取当前管理员的邮箱
      const adminEmail = useMembershipStore.getState().membershipInfo.email;
      
      if (!adminEmail) {
        message.error('无法获取管理员信息');
        return;
      }
      
      // 调用服务修改用户密码
      const success = await adminChangeUserPassword(adminEmail, targetEmail, newPassword);
      
      if (success) {
        message.success('用户密码修改成功');
      }
    } catch (error) {
      message.error('修改用户密码失败');
      console.error('Failed to change user password:', error);
    }
  }

  // 删除用户
  const handleDeleteUser = async (user: UserInfo) => {
    try {
      const success = await deleteUser(user.id);
      
      if (success) {
        // 更新本地用户列表
        setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
        message.success(`用户 ${user.username} 删除成功`);
      }
    } catch (error) {
      message.error('删除用户失败');
      console.error('Failed to delete user:', error);
    }
  }

  // 初始化
  useEffect(() => {
    console.log('UserManagement component mounted');
    if (hasPermission) {
      loadUsers();
    }
  }, [hasPermission])

  // 如果权限检查还未完成，显示加载状态
  if (hasPermission === null) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text>权限检查中...</Text>
      </div>
    )
  }

  // 如果没有权限，显示权限拒绝页面
  if (!hasPermission) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="danger">您没有权限访问此页面</Text>
        <div style={{ marginTop: '16px' }}>
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: UserInfo) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
          {record.isAdmin && <Tag icon={<CrownOutlined />} color="red">管理员</Tag>}
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '会员等级',
      dataIndex: 'membershipLevel',
      key: 'membershipLevel',
      render: (level: MembershipLevel) => (
        <Tag color={getLevelTagColor(level)}>{getLevelName(level)}</Tag>
      )
    },
    {
      title: '到期时间',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: Date | null, record: UserInfo) => {
        // 管理员和免费会员显示为"永久有效"
        if (record.isAdmin || record.membershipLevel === MembershipLevel.FREE) {
          return '永久有效';
        }
        
        // 付费会员显示具体的到期时间
        if (date) {
          return new Date(date).toLocaleDateString();
        }
        
        // 如果付费会员没有设置到期时间，默认显示为"永久有效"
        return '永久有效';
      }
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: Date | null) => (
        date ? new Date(date).toLocaleString() : '从未登录'
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserInfo) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditUser(record)}
            size="small"
          >
            编辑
          </Button>
          {!record.isAdmin && (
            <Popconfirm
              title="确认删除用户"
              description={`确定要删除用户 ${record.username} 吗？此操作不可撤销。`}
              onConfirm={() => handleDeleteUser(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
        >
          返回
        </Button>
      </div>
      
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ marginBottom: 0 }}>
              <Space>
                <UserOutlined />
                <span>会员管理</span>
              </Space>
            </Title>
            <Text type="secondary">管理平台所有会员信息</Text>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </div>
        
        <Table 
          dataSource={users} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          pagination={false}
          style={{ marginTop: '16px' }}
        />
      </Card>
      
      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveUser}
        >
          <Form.Item
            label="会员等级"
            name="membershipLevel"
            rules={[{ required: true, message: '请选择会员等级!' }]}
          >
            <Select>
              <Option value={MembershipLevel.FREE}>免费会员</Option>
              <Option value={MembershipLevel.BASIC}>基础会员</Option>
              <Option value={MembershipLevel.PROFESSIONAL}>专业会员</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="到期时间"
            name="expiryDate"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            label="管理员权限"
            name="isAdmin"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          {editingUser && !isUserAdminAccount(editingUser.username) && (
            <>
              <Divider>修改密码</Divider>
              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[
                  { min: 6, message: '密码长度至少6位' },
                  { pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, message: '密码必须包含字母和数字' }
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              
              <Form.Item
                label="确认新密码"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致!'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    const values = await form.validateFields(['newPassword', 'confirmPassword']);
                    if (values.newPassword && editingUser) {
                      await handleAdminChangePassword(editingUser.email, values.newPassword);
                      // 清空密码字段
                      form.setFieldsValue({ newPassword: '', confirmPassword: '' });
                    }
                  } catch (error) {
                    console.error('Password validation error:', error);
                  }
                }}
              >
                修改密码
              </Button>
            </>
          )}
          
          <Divider />
          
          <Text type="warning">
            注意：管理员账户的会员等级必须保持为专业会员，且不能取消管理员权限。
          </Text>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagementPage