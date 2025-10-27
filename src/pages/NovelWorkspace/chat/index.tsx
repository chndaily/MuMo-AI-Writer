import React from 'react';
import { Layout } from 'antd';
import { useParams } from 'react-router-dom';
import ChatPanel from './ChatPanel';

const { Content } = Layout;

const NovelChat: React.FC = () => {
  const { novelId } = useParams<{ novelId: string }>();

  return (
    <Layout style={{ height: '100%', overflow: 'hidden', backgroundColor: '#ffffff' }}>
      <div style={{ padding: '24px', height: '100%', overflow: 'auto' }} className="w-full">
        <div style={{ maxWidth: 1400, margin: '0 auto' }} className="w-full">
          <Content style={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }}>
            <ChatPanel novelId={novelId || ''} />
          </Content>
        </div>
      </div>
    </Layout>
  );
};

export default NovelChat;