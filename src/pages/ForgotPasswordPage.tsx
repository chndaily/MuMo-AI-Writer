import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Alert, Typography, Space } from 'antd';
import { apiService } from '@/services/apiService';

const { Title, Text } = Typography;

const ForgotPasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.users.forgotPassword(values.email);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || '请求密码重置失败');
      }
    } catch (err) {
      setError('请求密码重置过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: 500 }}>
        <Title level={2} style={{ textAlign: 'center' }}>找回密码</Title>
        
        {success ? (
          <Alert
            message="邮件已发送"
            description="如果该邮箱存在，我们已发送密码重置邮件。请检查您的邮箱并按照指示操作。"
            type="success"
            showIcon
          />
        ) : (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
              请输入您的邮箱地址，我们将发送密码重置链接到您的邮箱。
            </Text>
            
            {error && (
              <Alert
                message="错误"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: 20 }}
              />
            )}
            
            <Form
              form={form}
              name="forgot-password"
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>
              
              <Form.Item>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    block
                  >
                    发送重置链接
                  </Button>
                  <Button 
                    onClick={handleBackToLogin}
                    block
                  >
                    返回登录
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;