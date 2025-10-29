import React, { useCallback, useEffect, useState } from 'react';
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
  LockOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useMembership } from '@/hooks/useMembership';

const { Title, Paragraph } = Typography;

const NovelPromptsPage: React.FC = () => {
  const navigate = useNavigate();
  const { novelId } = useParams<{ novelId: string }>();
  const { checkPermission, isFree } = useMembership();
  
  // 检查用户是否有访问权限
  const hasPermission = checkPermission('prompts');
  
  // 如果没有权限，显示升级提示
  if (!hasPermission) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <Alert
          message="权限不足"
          description={
            <div>
              <p>当前功能需要基础会员或更高等级才能使用。</p>
              <p className="mt-2">
                <Button 
                  type="primary" 
                  onClick={() => navigate('/membership')}
                >
                  升级会员
                </Button>
              </p>
            </div>
          }
          type="warning"
          showIcon
          icon={<LockOutlined />}
        />
      </div>
    );
  }
  
  const [novelInfo, setNovelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 直接使用 databaseManager 获取数据
  const getNovel = useCallback(async (id: string) => {
    const { databaseManager } = await import('@/services/index');
    return await databaseManager.novels.getNovel(id);
  }, []);

  // 获取小说信息的函数
  const fetchNovelInfo = useCallback(async () => {
    if (novelId) {
      try {
        setLoading(true);
        const novel = await getNovel(novelId);
        setNovelInfo(novel || null);
      } catch (error) {
        console.error('获取小说信息失败:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [novelId, getNovel]);

  useEffect(() => {
    fetchNovelInfo();
  }, [fetchNovelInfo]);

  const handleCreatePrompt = () => {
    // 跳转到提示词创建页面
    navigate(`/prompts`);
  };

  const handleViewGlobalPrompts = () => {
    // 跳转到全局提示词库
    navigate(`/prompts`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className='border-b p-4 bg-gray-50'>
        <div className='flex justify-between items-center mb-2'>
          <Title level={4} style={{ margin: 0 }}>
            <Space>
              <TagsOutlined />
              <span>{novelInfo?.title || '未命名小说'} - 个性化提示词库</span>
            </Space>
          </Title>
          <Button 
            type="text" 
            icon={<HomeOutlined />} 
            onClick={() => navigate(`/novels/${novelId}`)}
          >
            返回小说工作区
          </Button>
        </div>
        <Paragraph type="secondary" style={{ margin: 0 }}>
          为这本小说定制专属提示词库，在全局模板基础上进行个性化调整
        </Paragraph>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-4">
              <TagsOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </div>
            <Title level={3}>个性化提示词库</Title>
            <Paragraph type="secondary">
              为《{novelInfo?.title || '当前小说'}》量身定制的提示词集合
            </Paragraph>
          </div>
          
          <Alert
            message="功能说明"
            description={
              <div>
                <p>1. 个性化提示词库基于全局提示词库模板创建</p>
                <p>2. 可在此基础上添加、修改或删除提示词，满足特定小说的创作需求</p>
                <p>3. 所有个性化提示词仅对当前小说生效，不影响全局模板</p>
                <p>4. 全局提示词库中新增的提示词会自动同步到此页面</p>
              </div>
            }
            type="info"
            showIcon
            className="mb-6"
          />
          
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Card>
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded mr-3">
                    <DatabaseOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                  </div>
                  <Title level={5} style={{ margin: 0 }}>使用全局模板</Title>
                </div>
                <Paragraph>
                  基于系统预设的提示词模板创建个性化提示词库
                </Paragraph>
                <Button type="primary" onClick={handleViewGlobalPrompts}>
                  查看全局模板
                </Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <div className="flex items-center mb-3">
                  <div className="bg-green-100 p-2 rounded mr-3">
                    <FileTextOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                  </div>
                  <Title level={5} style={{ margin: 0 }}>进入提示词库</Title>
                </div>
                <Paragraph>
                  为当前小说创建专属提示词，在全局模板基础上进行定制
                </Paragraph>
                <Button type="primary" onClick={() => navigate(`/novels/${novelId}/prompts/library`)}>
                  进入提示词库
                </Button>
              </Card>
            </Col>
          </Row>
          
          <Divider className="my-8" />
          
          <div className="text-center">
            <Title level={4} style={{ marginBottom: '24px' }}>如何使用个性化提示词库</Title>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small">
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-gray-600">1</span>
                    </div>
                    <Paragraph strong>选择模板</Paragraph>
                    <Paragraph type="secondary">从全局提示词库中选择适合的模板</Paragraph>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-gray-600">2</span>
                    </div>
                    <Paragraph strong>定制内容</Paragraph>
                    <Paragraph type="secondary">根据小说特点调整提示词内容</Paragraph>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-gray-600">3</span>
                    </div>
                    <Paragraph strong>应用创作</Paragraph>
                    <Paragraph type="secondary">在AI创作过程中使用个性化提示词</Paragraph>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
          
          <div className="mt-8 text-center">
            <Button 
              type="primary" 
              size="large"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/novels/${novelId}/prompts/library`)}
            >
              开始使用提示词库
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovelPromptsPage;