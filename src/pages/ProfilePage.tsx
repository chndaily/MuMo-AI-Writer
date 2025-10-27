import React, { useState } from 'react'
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Divider,
  Avatar,
  Row,
  Col,
  message,
  Alert
} from 'antd'
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  CrownOutlined,
  EditOutlined,
  SaveOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useMembershipStore, MembershipLevel } from '@/stores/membershipStore'
import { realAuthService } from '@/services/realAuthService'

const { Content } = Layout;
const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { membershipInfo, authToken, setMembershipInfo, clearAuth } = useMembershipStore();
  console.log('ProfilePage rendered, membershipInfo:', membershipInfo);
  
  // 检查会员信息是否完整
  React.useEffect(() => {
    console.log('Membership info in useEffect:', membershipInfo);
  }, [membershipInfo]);
  
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  // 获取会员等级信息
  const getLevelInfo = (level: MembershipLevel) => {
    switch (level) {
      case MembershipLevel.FREE:
        return {
          name: '免费会员',
          color: 'default',
          description: '适合体验基本功能'
        };
      case MembershipLevel.BASIC:
        return {
          name: '基础会员',
          color: 'blue',
          description: '适合个人创作者的基础功能'
        };
      case MembershipLevel.PROFESSIONAL:
        return {
          name: '专业会员',
          color: 'gold',
          description: '适合专业创作者和团队的完整功能'
        };
      default:
        // 处理可能的字符串值
        if (level === 'free') return {
          name: '免费会员',
          color: 'default',
          description: '适合体验基本功能'
        };
        if (level === 'basic') return {
          name: '基础会员',
          color: 'blue',
          description: '适合个人创作者的基础功能'
        };
        if (level === 'professional') return {
          name: '专业会员',
          color: 'gold',
          description: '适合专业创作者和团队的完整功能'
        };
        // 如果是其他值，尝试匹配
        const levelStr = String(level).toLowerCase();
        if (levelStr.includes('professional') || levelStr.includes('pro')) return {
          name: '专业会员',
          color: 'gold',
          description: '适合专业创作者和团队的完整功能'
        };
        if (levelStr.includes('basic')) return {
          name: '基础会员',
          color: 'blue',
          description: '适合个人创作者的基础功能'
        };
        return {
          name: '免费会员',
          color: 'default',
          description: '适合体验基本功能'
        };
    }
  };

  const levelInfo = getLevelInfo(membershipInfo.level);

  // 获取AI使用统计
  const getAIUsageInfo = () => {
    // 检查除零错误
    const limit = membershipInfo.aiGenerationLimit === Infinity ? 999999 : membershipInfo.aiGenerationLimit;
    const used = membershipInfo.aiGenerationUsed;
    const usagePercent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    
    return {
      used: used,
      limit: membershipInfo.aiGenerationLimit === Infinity ? '无限制' : membershipInfo.aiGenerationLimit,
      percent: usagePercent
    };
  };

  const aiUsageInfo = getAIUsageInfo();

  // 编辑资料
  const handleEdit = () => {
    setEditing(true);
    form.setFieldsValue({
      username: membershipInfo.username || '测试用户',
      email: membershipInfo.email || 'test@example.com'
    });
  };

  // 保存资料
  const handleSave = async (values: any) => {
    try {
      console.log('开始保存资料，values:', values);
      console.log('authToken:', authToken);
      console.log('当前用户名:', membershipInfo.username);
      
      // 如果有认证token且用户名有变化，则调用服务更新
      // 注意：邮箱地址不能修改，所以不包含在更新中
      if (authToken && values.username !== membershipInfo.username) {
        console.log('用户名有变化，准备更新...');
        const updates: Partial<any> = {};
        updates.username = values.username;
        console.log('准备发送的更新数据:', updates);
        
        const response = await realAuthService.updateUserInfo(authToken, updates);
        console.log('更新用户信息响应:', response);
        
        if (response.success && response.user) {
          console.log('更新成功，用户信息:', response.user);
          // 更新本地会员信息，确保处理null值
          const updatedMembershipInfo = {
            ...membershipInfo,
            ...response.user.membershipInfo,
            username: response.user.membershipInfo.username || response.user.username,
            email: response.user.membershipInfo.email || response.user.email,
            maxNovels: response.user.membershipInfo.maxNovels === null ? 
              (response.user.membershipInfo.level === MembershipLevel.PROFESSIONAL ? Infinity : 
               response.user.membershipInfo.level === MembershipLevel.BASIC ? Infinity : 3) : 
              response.user.membershipInfo.maxNovels,
            aiGenerationLimit: response.user.membershipInfo.aiGenerationLimit === null ? 
              (response.user.membershipInfo.level === MembershipLevel.PROFESSIONAL ? Infinity : 
               response.user.membershipInfo.level === MembershipLevel.BASIC ? 100 : 10) : 
              response.user.membershipInfo.aiGenerationLimit,
            isAdmin: response.user.membershipInfo.isAdmin ?? false
          };
          console.log('更新后的会员信息:', updatedMembershipInfo);
          
          setMembershipInfo(updatedMembershipInfo);
          message.success('资料保存成功！');
        } else {
          console.error('更新失败:', response.message);
          // 提供更友好的错误消息
          let errorMessage = '资料保存失败';
          if (response.message) {
            if (response.message.includes('用户不存在')) {
              errorMessage = '用户不存在，请重新登录';
            } else if (response.message.includes('认证失败')) {
              errorMessage = '认证失败，请重新登录';
            } else if (response.message.includes('邮箱已被其他用户使用')) {
              errorMessage = '该邮箱已被其他用户使用';
            } else if (response.message.includes('用户名已被其他用户使用')) {
              errorMessage = '该用户名已被其他用户使用';
            } else {
              errorMessage = response.message;
            }
          }
          message.error(errorMessage);
          return;
        }
      }
      
      // 如果有新密码，则修改密码
      if (authToken && values.newPassword) {
        console.log('准备修改密码...');
        if (values.newPassword !== values.confirmPassword) {
          message.error('两次输入的密码不一致!');
          return;
        }
        
        // 调用真正的密码修改接口
        const response = await realAuthService.changePassword(authToken, values.oldPassword, values.newPassword);
        console.log('修改密码响应:', response);
        
        if (response.success) {
          message.success('密码修改成功！');
        } else {
          // 提供更友好的错误信息
          let errorMessage = '密码修改失败';
          if (response.message) {
            if (response.message.includes('用户不存在')) {
              errorMessage = '用户不存在，请重新登录';
            } else if (response.message.includes('旧密码错误')) {
              errorMessage = '旧密码错误，请检查后重试';
            } else if (response.message.includes('认证失败')) {
              errorMessage = '认证失败，请重新登录';
            } else {
              errorMessage = response.message;
            }
          }
          message.error(errorMessage);
          return;
        }
      }
      
      setEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      message.error('保存过程中发生错误，请稍后重试');
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
  };

  // 处理升级
  const handleUpgrade = () => {
    navigate('/membership');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={2}>
              <UserOutlined /> 个人资料
            </Title>
            
            {/* 到期提醒 */}
            {membershipInfo.expiryDate && membershipInfo.level !== MembershipLevel.FREE && (
              <Alert
                message="会员即将到期"
                description={`您的${levelInfo.name}会员将在${new Date(membershipInfo.expiryDate).toLocaleDateString()}到期，请及时续费以保持服务。`}
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}
            
            <Row gutter={24}>
              <Col span={8}>
                <Card size="small" title="基本信息">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Avatar size={80} icon={<UserOutlined />} />
                      <div style={{ marginTop: 16 }}>
                        <Text strong>{membershipInfo.username || '测试用户'}</Text>
                      </div>
                      <Text type="secondary">{membershipInfo.email || 'test@example.com'}</Text>
                    </div>
                    
                    <Divider />
                    
                    <div>
                      <Text strong>会员等级：</Text>
                      <Tag icon={<CrownOutlined />} color={levelInfo.color}>
                        {levelInfo.name}
                      </Tag>
                    </div>
                    
                    <div>
                      <Text strong>会员描述：</Text>
                      <Text type="secondary">{levelInfo.description}</Text>
                    </div>
                    
                    <div>
                      <Text strong>到期时间：</Text>
                      <Text type="secondary">
                        {membershipInfo.expiryDate 
                          ? new Date(membershipInfo.expiryDate).toLocaleDateString() 
                          : '永久有效'}
                      </Text>
                    </div>
                    
                    <Button 
                      type="primary" 
                      icon={<CrownOutlined />}
                      onClick={handleUpgrade}
                      block
                    >
                      {membershipInfo.level === MembershipLevel.PROFESSIONAL 
                        ? '管理订阅' 
                        : '升级会员'}
                    </Button>
                  </Space>
                </Card>
                
                <Card size="small" title="AI使用统计" style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>今日AI生成次数：</Text>
                      <Text>{aiUsageInfo.used} / {aiUsageInfo.limit}</Text>
                    </div>
                    <div>
                      <div style={{ 
                        width: '100%', 
                        height: 8, 
                        backgroundColor: '#f0f0f0',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${aiUsageInfo.percent}%`,
                          height: '100%',
                          backgroundColor: aiUsageInfo.percent >= 90 ? '#ff4d4f' : '#1890ff',
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {membershipInfo.level === MembershipLevel.FREE && '免费会员每日限制10次AI生成'}
                        {membershipInfo.level === MembershipLevel.BASIC && '基础会员每日限制100次AI生成'}
                        {membershipInfo.level === MembershipLevel.PROFESSIONAL && '专业会员无限制AI生成'}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Col>
              
              <Col span={16}>
                <Card 
                  size="small" 
                  title={editing ? "编辑资料" : "账户信息"}
                  extra={
                    !editing && (
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                        size="small"
                      >
                        编辑
                      </Button>
                    )
                  }
                >
                  {editing ? (
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSave}
                    >
                      <Form.Item
                        label="用户名"
                        name="username"
                        rules={[{ required: true, message: '请输入用户名!' }]}
                      >
                        <Input prefix={<UserOutlined />} />
                      </Form.Item>
                      
                      <Form.Item
                        label="邮箱地址"
                        name="email"
                      >
                        <Input prefix={<MailOutlined />} disabled readOnly />
                      </Form.Item>
                      
                      <Form.Item
                        label="旧密码"
                        name="oldPassword"
                      >
                        <Input.Password prefix={<LockOutlined />} />
                      </Form.Item>
                      
                      <Form.Item
                        label="新密码"
                        name="newPassword"
                      >
                        <Input.Password prefix={<LockOutlined />} />
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
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const newPassword = getFieldValue('newPassword');
                              const oldPassword = getFieldValue('oldPassword');
                              if (newPassword && !oldPassword) {
                                return Promise.reject(new Error('请输入旧密码!'));
                              }
                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <Input.Password prefix={<LockOutlined />} />
                      </Form.Item>
                      
                      <Form.Item>
                        <Space>
                          <Button 
                            type="primary" 
                            htmlType="submit" 
                            icon={<SaveOutlined />}
                          >
                            保存
                          </Button>
                          <Button onClick={handleCancel}>
                            取消
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>用户名：</Text>
                        <Text>{membershipInfo.username || '测试用户'}</Text>
                      </div>
                      
                      <div>
                        <Text strong>邮箱地址：</Text>
                        <Text>{membershipInfo.email || 'test@example.com'}</Text>
                      </div>
                      
                      <div>
                        <Text strong>会员等级：</Text>
                        <Tag icon={<CrownOutlined />} color={levelInfo.color}>
                          {levelInfo.name}
                        </Tag>
                      </div>
                      
                      <div>
                        <Text strong>到期时间：</Text>
                        <Text>
                          {membershipInfo.expiryDate 
                            ? new Date(membershipInfo.expiryDate).toLocaleDateString() 
                            : '永久有效'}
                        </Text>
                      </div>
                      
                      <div>
                        <Text strong>AI生成次数：</Text>
                        <Text>{aiUsageInfo.used} / {aiUsageInfo.limit}</Text>
                      </div>
                    </Space>
                  )}
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default ProfilePage;