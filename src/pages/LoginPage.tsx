import React, { useState } from 'react';
import { 
  Layout, 
  Form, 
  Input, 
  Button, 
  Card, 
  Space, 
  Typography, 
  message,
  Tabs,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  LoginOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMembershipStore, MembershipLevel } from '@/stores/membershipStore';
import { realAuthService } from '@/services/realAuthService';
import { addUser } from '@/services/userService';

const { Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { setMembershipInfo, setIsAuthenticated, setAuthToken, isAuthenticated } = useMembershipStore();
  
  // 检查URL参数确定默认激活的标签页
  const getDefaultActiveTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') === 'register' ? 'register' : 'login';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultActiveTab());
  
  // 如果已经登录，直接跳转到首页
  React.useEffect(() => {
    if (isAuthenticated) {
      // 检查是否有重定向URL
      const from = location.state?.from?.pathname || '/creation-center';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // 登录表单提交
  const onFinishLogin = async (values: any) => {
    setLoading(true);
    
    try {
      // 调用真实认证服务进行登录
      const response = await realAuthService.login(values.email, values.password);
      
      if (response.success && response.user) {
        console.log('Login response:', response);
        // 设置认证状态
        setIsAuthenticated(true);
        if (response.token) {
          setAuthToken(response.token);
        }
        
        console.log('Membership info from response:', response.user.membershipInfo);
        // 设置会员信息，包括用户名和邮箱
        setMembershipInfo({
          ...response.user.membershipInfo,
          username: response.user.username,
          email: response.user.email
        });
        console.log('Membership info after setting:', useMembershipStore.getState().membershipInfo);
        
        // 添加调试日志
        console.log('Auth token after login:', response.token);
        console.log('Is authenticated after login:', useMembershipStore.getState().isAuthenticated);
        console.log('Auth token after login (from store):', useMembershipStore.getState().authToken);
        
        // 登录成功后执行数据同步
        try {
          const { optimizedDataSyncService } = await import('@/services/optimizedDataSyncService');
          message.loading('正在同步数据...', 0);
          const syncResult = await optimizedDataSyncService.syncAllData();
          message.destroy();
          if (syncResult.success) {
            message.success('数据同步完成');
          } else {
            message.warning('数据同步部分失败: ' + syncResult.message);
          }
        } catch (syncError) {
          message.destroy();
          message.error('数据同步失败');
          console.error('Sync error after login:', syncError);
        }
        
        // 再次检查认证状态
        console.log('Is authenticated after sync:', useMembershipStore.getState().isAuthenticated);
        console.log('Auth token after sync:', useMembershipStore.getState().authToken);
        
        message.success('登录成功！');
        // 跳转到首页或之前访问的页面
        const from = location.state?.from?.pathname || '/creation-center';
        navigate(from, { replace: true });
      } else {
        // 显示后端返回的具体错误消息，提供更友好的提示
        console.log('Login failed with message:', response.message);
        let errorMessage = '登录失败';
        if (response.message) {
          if (response.message.includes('用户不存在')) {
            errorMessage = '该账户不存在，请检查邮箱地址或先注册';
          } else if (response.message.includes('密码错误')) {
            errorMessage = '密码错误，请检查后重试';
          } else {
            errorMessage = response.message;
          }
        }
        message.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // 检查是否是API错误并显示具体的错误消息
      if (error && error.message) {
        console.log('Caught error with message:', error.message);
        message.error(error.message);
      } else {
        message.error('登录过程中发生错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 注册表单提交
  const onFinishRegister = async (values: any) => {
    setLoading(true);
    
    try {
      // 调用真实认证服务进行注册
      const response = await realAuthService.register(values.email, values.username, values.password);
      
      if (response.success && response.user) {
        console.log('Register response:', response);
        // 将新注册的用户添加到用户服务中
        addUser({
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          membershipLevel: response.user.membershipInfo.level,
          expiryDate: response.user.membershipInfo.expiryDate,
          isAdmin: response.user.membershipInfo.isAdmin || false,
          lastLoginAt: response.user.lastLoginAt,
          createdAt: response.user.createdAt
        });
        console.log('User added to service');
        
        // 设置认证状态
        setIsAuthenticated(true);
        if (response.token) {
          setAuthToken(response.token);
        }
        
        // 设置会员信息，包括用户名和邮箱
        setMembershipInfo({
          ...response.user.membershipInfo,
          username: response.user.username,
          email: response.user.email
        });
        
        message.success('注册成功！欢迎加入我们。');
        // 跳转到首页
        navigate('/creation-center', { replace: true });
      } else {
        // 提供更友好的错误消息
        let errorMessage = '注册失败';
        if (response.message) {
          if (response.message.includes('该邮箱已被注册')) {
            errorMessage = '该邮箱已被注册，请直接登录或使用其他邮箱';
          } else if (response.message.includes('该用户名已被使用')) {
            errorMessage = '该用户名已被使用，请选择其他用户名';
          } else {
            errorMessage = response.message;
          }
        }
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error('注册过程中发生错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Content style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '50px 0'
      }}>
        <Card style={{ 
          width: 450, 
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <Title level={2}>木墨文坊</Title>
            <Text type="secondary">开启您的创作之旅</Text>
          </div>
          
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            centered
          >
            <TabPane 
              tab={
                <span>
                  <LoginOutlined />
                  登录
                </span>
              } 
              key="login"
            >
              <Form
                name="login"
                onFinish={onFinishLogin}
                layout="vertical"
              >
                <Form.Item
                  name="email"
                  rules={[{ required: true, message: '请输入邮箱地址!' }]}
                >
                  <Input 
                    prefix={<MailOutlined />} 
                    placeholder="邮箱地址" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码!' }]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="密码" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    size="large"
                    block
                  >
                    登录
                  </Button>
                </Form.Item>
                
                {/* 已移除测试账号按钮，生产环境中不应暴露测试账号 */}
              </Form>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <UserAddOutlined />
                  注册
                </span>
              } 
              key="register"
            >
              <Form
                name="register"
                onFinish={onFinishRegister}
                layout="vertical"
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入用户名!' }]}
                >
                  <Input 
                    prefix={<UserOutlined />} 
                    placeholder="用户名" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="email"
                  rules={[{ required: true, message: '请输入邮箱地址!' }]}
                >
                  <Input 
                    prefix={<MailOutlined />} 
                    placeholder="邮箱地址" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码!' }]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="密码" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item
                  name="confirm"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined />} 
                    placeholder="确认密码" 
                    size="large"
                  />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    size="large"
                    block
                  >
                    注册
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPage;