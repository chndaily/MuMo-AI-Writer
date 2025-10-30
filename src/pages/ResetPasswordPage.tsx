import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Alert, Typography, Space, Spin } from 'antd';
import { apiService } from '@/services/apiService';

const { Title, Text } = Typography;

const ResetPasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const validateToken = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        setError('缺少重置token');
        setValidating(false);
        return;
      }

      try {
        const response = await apiService.users.validateResetToken(token);
        if (response.success) {
          setTokenValid(true);
        } else {
          setError(response.message || '重置链接无效或已过期');
        }
      } catch (err) {
        setError('验证重置链接过程中发生错误');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [location.search]);

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    setError('');

    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    try {
      const response = await apiService.users.resetPassword(token!, values.password);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || '密码重置失败');
      }
    } catch (err) {
      setError('密码重置过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (validating) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '20px'
      }}>
        <Card style={{ width: '100%', maxWidth: 500 }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <Text>正在验证重置链接，请稍候...</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Card style={{ width: '100%', maxWidth: 500 }}>
        <Title level={2} style={{ textAlign: 'center' }}>重置密码</Title>
        
        {!tokenValid ? (
          <Alert
            message="无效的重置链接"
            description={error || '重置链接无效或已过期，请重新申请密码重置。'}
            type="error"
            showIcon
          />
        ) : success ? (
          <div>
            <Alert
              message="密码重置成功"
              description="您的密码已成功重置，现在可以使用新密码登录系统了。"
              type="success"
              showIcon
            />
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Button 
                type="primary" 
                onClick={handleGoToLogin}
              >
                前往登录
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
              请输入新密码
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
              name="reset-password"
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度至少6位' }
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                rules={[
                  { required: true, message: '请确认新密码' },
                  { min: 6, message: '密码长度至少6位' }
                ]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              
              <Form.Item>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    block
                  >
                    重置密码
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
        
        {!validating && !tokenValid && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Button 
              type="primary" 
              onClick={handleBackToLogin}
            >
              返回登录
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResetPasswordPage;