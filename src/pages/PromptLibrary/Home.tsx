import React from 'react';
import { Button, Card, Typography, Space, Row, Col, Alert, Divider } from 'antd';
import { 
  BookOutlined, 
  TagsOutlined, 
  ApiOutlined, 
  FileTextOutlined, 
  PlusOutlined, 
  EyeOutlined,
  HomeOutlined,
  DatabaseOutlined,
  RocketOutlined,
  BulbOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';
import { CollectionType } from '#/promptLibrary';

const { Title, Paragraph } = Typography;

const PromptLibraryHome: React.FC = () => {
  const navigate = useNavigate();
  const { collections } = usePromptLibraryStore();

  // 统计数据
  const stats = {
    total: collections.length,
    personas: collections.filter(c => c.type === CollectionType.Personas).length,
    prompts: collections.filter(c => c.type === CollectionType.Prompts).length,
    models: collections.filter(c => c.type === CollectionType.Models).length,
  };

  // 提示词类型说明
  const promptTypes = [
    {
      icon: <BulbOutlined />,
      title: '角色设定',
      description: '定义小说中的角色信息、性格特征和背景故事',
      color: '#1890ff'
    },
    {
      icon: <ApiOutlined />,
      title: '创作辅助',
      description: '提供创作过程中的辅助工具和提示词模板',
      color: '#52c41a'
    },
    {
      icon: <ToolOutlined />,
      title: '内容处理',
      description: '用于处理和优化已有内容的提示词工具',
      color: '#722ed1'
    },
    {
      icon: <FileTextOutlined />,
      title: '文本编辑',
      description: '帮助修改和完善文本内容的编辑工具',
      color: '#faad14'
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className='border-b p-4 bg-gray-50'>
        <div className='flex justify-between items-center mb-2'>
          <Title level={4} style={{ margin: 0 }}>
            <Space>
              <BookOutlined />
              <span>全局提示词库</span>
            </Space>
          </Title>
          <Button 
            type="text" 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        </div>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          系统预设的提示词模板，可作为所有小说创作的基础
        </Paragraph>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-4">
              <TagsOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </div>
            <Title level={2}>AI提示词库</Title>
            <Paragraph type="secondary" style={{ fontSize: '16px' }}>
              利用预设的AI提示词模板提升创作效率，系统提供多种类型的提示词支持
            </Paragraph>
          </div>
          
          {/* 统计卡片 */}
          <Row gutter={[16, 16]} className="mb-8">
            <Col span={6}>
              <Card size="small">
                <div className="text-center">
                  <Title level={3} style={{ margin: '0 0 8px 0', color: '#1890ff' }}>{stats.total}</Title>
                  <Paragraph style={{ margin: 0 }}>总集合数</Paragraph>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div className="text-center">
                  <Title level={3} style={{ margin: '0 0 8px 0', color: '#52c41a' }}>{stats.personas}</Title>
                  <Paragraph style={{ margin: 0 }}>角色设定</Paragraph>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div className="text-center">
                  <Title level={3} style={{ margin: '0 0 8px 0', color: '#722ed1' }}>{stats.prompts}</Title>
                  <Paragraph style={{ margin: 0 }}>提示词模板</Paragraph>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div className="text-center">
                  <Title level={3} style={{ margin: '0 0 8px 0', color: '#faad14' }}>{stats.models}</Title>
                  <Paragraph style={{ margin: 0 }}>模型配置</Paragraph>
                </div>
              </Card>
            </Col>
          </Row>
          
          <Alert
            message={
              <Space>
                <RocketOutlined />
                <span>使用说明</span>
              </Space>
            }
            description={
              <div>
                <p>1. 全局提示词库提供系统预设的模板，可作为所有小说创作的基础</p>
                <p>2. 每本小说可在全局模板基础上创建个性化提示词库</p>
                <p>3. 支持多种类型的提示词：角色设定、创作辅助、内容处理、文本编辑等</p>
              </div>
            }
            type="info"
            showIcon
            className="mb-8"
          />
          
          <Row gutter={[24, 24]} className="mb-8">
            <Col span={12}>
              <Card>
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded mr-3">
                    <DatabaseOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                  </div>
                  <Title level={5} style={{ margin: 0 }}>基础模板</Title>
                </div>
                <Paragraph>
                  系统提供的预设提示词模板，涵盖角色设定、场景描述、情节发展等创作要素
                </Paragraph>
                <Button type="primary" onClick={() => navigate('/prompts/library')}>
                  浏览模板
                </Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 p-2 rounded mr-3">
                    <FileTextOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                  </div>
                  <Title level={5} style={{ margin: 0 }}>创建新模板</Title>
                </div>
                <Paragraph>
                  创建可复用的提示词模板，为所有小说提供统一的创作支持
                </Paragraph>
                <Button 
                  type="primary" 
                  onClick={() => navigate('/prompts/create')}
                >
                  创建模板
                </Button>
              </Card>
            </Col>
          </Row>
          
          <Divider className="my-8" />
          
          <Title level={4} className="mb-6">提示词类型说明</Title>
          <Row gutter={[16, 16]} className="mb-8">
            {promptTypes.map((type, index) => (
              <Col span={6} key={index}>
                <Card size="small" className="h-full">
                  <div className="text-center">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: `${type.color}20` }}
                    >
                      <span style={{ color: type.color, fontSize: '20px' }}>
                        {type.icon}
                      </span>
                    </div>
                    <Title level={5} style={{ margin: '0 0 8px 0' }}>{type.title}</Title>
                    <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                      {type.description}
                    </Paragraph>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          
          <div className="text-center">
            <Button 
              type="primary" 
              size="large"
              icon={<EyeOutlined />}
              onClick={() => navigate('/prompts/library')}
            >
              开始使用提示词库
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptLibraryHome;