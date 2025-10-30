import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin, Alert, Card, Button, Typography } from 'antd';
import { apiService } from '@/services/apiService';

const { Title, Paragraph } = Typography;

const EmailVerificationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        setError('缺少验证token');
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.users.verifyEmail(token);
        if (response.success) {
          setSuccess(true);
          setError(''); // 清除任何之前的错误信息
        } else {
          setError(response.message || '邮箱验证失败');
        }
      } catch (err) {
        setError('邮箱验证过程中发生错误');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [location.search]);

  const handleLoginRedirect = () => {
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
        <Title level={2} style={{ textAlign: 'center' }}>邮箱验证</Title>
        
        {loading && (
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <Paragraph>正在验证邮箱，请稍候...</Paragraph>
          </div>
        )}
        
        {success && (
          <Alert
            message="邮箱验证成功"
            description="您的邮箱已成功验证，现在可以登录系统了。"
            type="success"
            showIcon
          />
        )}
        
        {!success && error && (
          <Alert
            message="邮箱验证提示"
            description={error}
            type={error.includes('已验证') ? 'info' : 'error'}
            showIcon
          />
        )}
        
        {!loading && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Button 
              type="primary" 
              onClick={handleLoginRedirect}
            >
              前往登录
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmailVerificationPage;