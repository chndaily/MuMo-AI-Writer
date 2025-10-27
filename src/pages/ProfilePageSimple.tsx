import React from 'react';
import { Layout, Card, Typography, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title } = Typography;

const ProfilePageSimple: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Card>
          <Title level={2}>
            <UserOutlined /> 个人资料测试页面
          </Title>
          <p>这是一个简化的个人资料页面，用于测试路由是否正常工作。</p>
          <Button type="primary">测试按钮</Button>
        </Card>
      </Content>
    </Layout>
  );
};

export default ProfilePageSimple;