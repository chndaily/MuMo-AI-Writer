import React from 'react';
import { Button, Card, Typography, Space, Row, Col, Alert, Divider, Statistic, Tag } from 'antd';
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
  ToolOutlined,
  EditOutlined,
  FolderOpenOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';
import { CollectionType } from '#/promptLibrary';

const { Title, Paragraph } = Typography;

const NewPromptLibraryHome: React.FC = () => {
  const navigate = useNavigate();
  const { collections } = usePromptLibraryStore();

  // 统计数据
  const stats = {
    total: collections.length,
    personas: collections.filter(c => c.type === CollectionType.Personas).length,
    prompts: collections.filter(c => c.type === CollectionType.Prompts).length,
    models: collections.filter(c => c.type === CollectionType.Models).length,
  };

  // 功能卡片
  const features = [
    {
      icon: <FolderOpenOutlined />,
      title: '浏览模板库',
      description: '查看系统预设的提示词模板',
      action: () => navigate('/prompts/library'),
      color: 'blue'
    },
    {
      icon: <PlusOutlined />,
      title: '创建新模板',
      description: '创建可复用的提示词模板',
      action: () => navigate('/prompts/create'),
      color: 'green'
    },
    {
      icon: <EyeOutlined />,
      title: '预览内容',
      description: '预览提示词库中的所有内容',
      action: () => {},
      color: 'purple'
    }
  ];

  // 提示词类型说明
  const promptTypes = [
    {
      icon: <BulbOutlined />,
      title: '角色设定',
      description: '定义小说中的角色信息、性格特征和背景故事',
      color: '#1890ff',
      count: stats.personas
    },
    {
      icon: <ApiOutlined />,
      title: '创作辅助',
      description: '提供创作过程中的辅助工具和提示词模板',
      color: '#52c41a',
      count: 0
    },
    {
      icon: <ToolOutlined />,
      title: '内容处理',
      description: '用于处理和优化已有内容的提示词工具',
      color: '#722ed1',
      count: 0
    },
    {
      icon: <FileTextOutlined />,
      title: '文本编辑',
      description: '帮助修改和完善文本内容的编辑工具',
      color: '#faad14',
      count: 0
    },
    {
      icon: <ThunderboltOutlined />,
      title: '模型配置',
      description: 'AI模型配置和管理',
      color: '#ff7a45',
      count: stats.models
    },
    {
      icon: <DatabaseOutlined />,
      title: '案例库',
      description: '经典案例和示例内容',
      color: '#36cfc9',
      count: 0
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className='border-b p-6 bg-gradient-to-r from-blue-50 to-purple-50'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <Title level={3} style={{ margin: 0, color: '#1d39c4' }}>
              <Space>
                <TagsOutlined />
                <span>AI智能提示词库</span>
              </Space>
            </Title>
            <Paragraph type="secondary" style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              利用预设的AI提示词模板提升创作效率，系统提供多种类型的提示词支持
            </Paragraph>
          </div>
          <Button 
            type="text" 
            icon={<HomeOutlined />} 
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* 统计卡片 */}
          <Row gutter={[16, 16]} className="mb-8">
            <Col span={6}>
              <Card 
                size="small" 
                className="shadow-sm hover:shadow-md transition-shadow"
                style={{ borderLeft: '4px solid #1890ff' }}
              >
                <Statistic 
                  title="总集合数" 
                  value={stats.total} 
                  prefix={<BookOutlined />} 
                  valueStyle={{ color: '#1890ff' }} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card 
                size="small" 
                className="shadow-sm hover:shadow-md transition-shadow"
                style={{ borderLeft: '4px solid #52c41a' }}
              >
                <Statistic 
                  title="角色设定" 
                  value={stats.personas} 
                  prefix={<BulbOutlined />} 
                  valueStyle={{ color: '#52c41a' }} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card 
                size="small" 
                className="shadow-sm hover:shadow-md transition-shadow"
                style={{ borderLeft: '4px solid #722ed1' }}
              >
                <Statistic 
                  title="提示词模板" 
                  value={stats.prompts} 
                  prefix={<ApiOutlined />} 
                  valueStyle={{ color: '#722ed1' }} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card 
                size="small" 
                className="shadow-sm hover:shadow-md transition-shadow"
                style={{ borderLeft: '4px solid #faad14' }}
              >
                <Statistic 
                  title="模型配置" 
                  value={stats.models} 
                  prefix={<ThunderboltOutlined />} 
                  valueStyle={{ color: '#faad14' }} 
                />
              </Card>
            </Col>
          </Row>
          
          {/* 快速操作 */}
          <div className="mb-8">
            <Title level={4} className="mb-4">快速操作</Title>
            <Row gutter={[16, 16]}>
              {features.map((feature, index) => (
                <Col span={8} key={index}>
                  <Card 
                    hoverable 
                    className="h-full"
                    onClick={feature.action}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                        style={{ backgroundColor: `${feature.color}10` }}
                      >
                        <span style={{ color: feature.color, fontSize: '20px' }}>
                          {feature.icon}
                        </span>
                      </div>
                      <div>
                        <Title level={5} style={{ margin: '0 0 4px 0' }}>{feature.title}</Title>
                        <Paragraph type="secondary" style={{ margin: 0, fontSize: '12px' }}>
                          {feature.description}
                        </Paragraph>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
          
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
          
          {/* 提示词类型说明 */}
          <Title level={4} className="mb-6">提示词类型</Title>
          <Row gutter={[16, 16]} className="mb-8">
            {promptTypes.map((type, index) => (
              <Col span={8} key={index}>
                <Card 
                  size="small" 
                  className="h-full hover:shadow-md transition-all"
                  style={{ borderTop: `3px solid ${type.color}` }}
                >
                  <div className="text-center">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: `${type.color}10` }}
                    >
                      <span style={{ color: type.color, fontSize: '20px' }}>
                        {type.icon}
                      </span>
                    </div>
                    <Title level={5} style={{ margin: '0 0 8px 0' }}>
                      {type.title}
                      {type.count > 0 && (
                        <Tag color={type.color} style={{ marginLeft: 8 }}>
                          {type.count}
                        </Tag>
                      )}
                    </Title>
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
              onClick={() => {}}
            >
              开始使用提示词库
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPromptLibraryHome;