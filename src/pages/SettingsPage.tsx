import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Space, 
  Typography, 
  Button, 
  Form, 
  Input, 
  message,
  Divider,
  Row,
  Col,
  Switch,
  Select
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  SaveOutlined,
  NotificationOutlined,
  GlobalOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useMembershipStore } from '@/stores/membershipStore';
import { realAuthService } from '@/services/realAuthService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { membershipInfo, authToken, setMembershipInfo, clearAuth } = useMembershipStore();
  console.log('SettingsPage rendered, membershipInfo:', membershipInfo);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 保存设置
  const handleSave = async (values: any) => {
    setLoading(true);
    
    try {
      // 如果有认证token且邮箱或用户名有变化，则调用服务更新
      if (authToken && (values.email !== membershipInfo.email || values.username !== membershipInfo.username)) {
        const updates: Partial<any> = {};
        if (values.email !== membershipInfo.email) {
          updates.email = values.email;
        }
        if (values.username !== membershipInfo.username) {
          updates.username = values.username;
        }
        
        const response = await realAuthService.updateUserInfo(authToken, updates);
        if (response.success && response.user) {
          // 更新本地会员信息
          setMembershipInfo({
            ...membershipInfo,
            username: response.user.membershipInfo.username,
            email: response.user.membershipInfo.email
          });
          message.success('账户信息保存成功！');
        } else {
          message.error(response.message || '账户信息保存失败');
          setLoading(false);
          return;
        }
      }
      
      // 如果有新密码，则修改密码
      if (authToken && values.newPassword) {
        if (values.newPassword !== values.confirmPassword) {
          message.error('两次输入的密码不一致!');
          setLoading(false);
          return;
        }
        
        const response = await realAuthService.changePassword(authToken, 'oldPasswordPlaceholder', values.newPassword);
        if (response.success) {
          message.success('密码修改成功！');
        } else {
          message.error(response.message || '密码修改失败');
          setLoading(false);
          return;
        }
      }
      
      message.success('设置保存成功！');
    } catch (error) {
      message.error('保存过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={2}>
              <UserOutlined /> 账户设置
            </Title>
            
            <Row gutter={24}>
              <Col span={16}>
                <Card size="small" title="基本信息">
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    initialValues={{
                      username: membershipInfo.username || '测试用户',
                      email: membershipInfo.email || 'test@example.com',
                      theme: 'light',
                      language: 'zh-CN'
                    }}
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
                      rules={[
                        { required: true, message: '请输入邮箱地址!' },
                        { type: 'email', message: '请输入有效的邮箱地址!' }
                      ]}
                    >
                      <Input prefix={<MailOutlined />} />
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
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} />
                    </Form.Item>
                    
                    <Divider />
                    
                    <Title level={4}>偏好设置</Title>
                    
                    <Form.Item
                      label="主题"
                      name="theme"
                    >
                      <Select>
                        <Option value="light">浅色主题</Option>
                        <Option value="dark">深色主题</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      label="语言"
                      name="language"
                    >
                      <Select>
                        <Option value="zh-CN">中文</Option>
                        <Option value="en-US">English</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      label="通知设置"
                      name="notifications"
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text>邮件通知</Text>
                          <Switch style={{ float: 'right' }} defaultChecked />
                        </div>
                        <div>
                          <Text>系统通知</Text>
                          <Switch style={{ float: 'right' }} defaultChecked />
                        </div>
                        <div>
                          <Text>AI生成完成通知</Text>
                          <Switch style={{ float: 'right' }} defaultChecked />
                        </div>
                      </Space>
                    </Form.Item>
                    
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        icon={<SaveOutlined />}
                      >
                        保存设置
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              
              <Col span={8}>
                <Card size="small" title="账户信息">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>会员等级：</Text>
                      <Text>
                        {membershipInfo.level === 'free' ? '免费会员' : 
                         membershipInfo.level === 'basic' ? '基础会员' : '专业会员'}
                      </Text>
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
                      <Text>{membershipInfo.aiGenerationUsed} / {membershipInfo.aiGenerationLimit}</Text>
                    </div>
                    
                    <Button 
                      type="primary" 
                      onClick={() => navigate('/membership')}
                    >
                      管理订阅
                    </Button>
                  </Space>
                </Card>
                
                <Card size="small" title="安全设置" style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>密码安全：</Text>
                      <Text type="success">✓ 已设置</Text>
                    </div>
                    
                    <div>
                      <Text strong>登录历史：</Text>
                      <Text type="secondary">最近登录：{new Date().toLocaleString()}</Text>
                    </div>
                    
                    <Button 
                      type="primary" 
                      icon={<LockOutlined />}
                      onClick={() => form.setFieldsValue({ newPassword: '', confirmPassword: '' })}
                    >
                      修改密码
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default SettingsPage;