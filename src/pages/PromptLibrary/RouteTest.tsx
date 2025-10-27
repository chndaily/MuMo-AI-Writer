import React from 'react';
import { Card, Typography } from 'antd';
import { useParams, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

const RouteTest: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  
  return (
    <Card style={{ height: '100%' }}>
      <Title level={4}>路由测试</Title>
      <Text>当前路由参数:</Text>
      <pre>{JSON.stringify(params, null, 2)}</pre>
      <Text>当前路由位置:</Text>
      <pre>{JSON.stringify(location, null, 2)}</pre>
    </Card>
  );
};

export default RouteTest;