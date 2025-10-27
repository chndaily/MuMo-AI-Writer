import React, { useState, useEffect } from 'react';
import { Layout, Button, Card, Col, Row, Space, Typography, message, Tabs, Dropdown, Breadcrumb } from 'antd';
import { 
  TeamOutlined, 
  EnvironmentOutlined, 
  BookOutlined, 
  ApiOutlined, 
  ExperimentOutlined, 
  HistoryOutlined,
  BarChartOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  ReloadOutlined,
  DownOutlined,
  BranchesOutlined,
  HeatMapOutlined,
  RadarChartOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  TagOutlined
} from '@ant-design/icons';
import CharacterNetwork from './visualization/CharacterNetwork';
import WorldSettingNetwork from './visualization/WorldSettingNetwork';
import { useNovel } from '@/hooks/useNovel';
import TimelineChart from './visualization/TimelineChart';
import ChapterNetwork from './visualization/ChapterNetwork';
import ThemeSymbolChart from './visualization/ThemeSymbolChart';
// DataDebug 组件已移除
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const VisualizationPage: React.FC = () => {
  const { novelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { novel, loading: novelLoading } = useNovel(novelId);
  // 直接使用 databaseManager 获取数据
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [cultures, setCultures] = useState<any[]>([]);
  const [technologies, setTechnologies] = useState<any[]>([]);
  const [magics, setMagics] = useState<any[]>([]);
  const [histories, setHistories] = useState<any[]>([]);
  
  const refreshCharacters = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const charactersData = await databaseManager.characters.getCharactersByNovelId(novelId);
      setCharacters(charactersData);
    }
  };
  
  const refreshLocations = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const locationsData = await databaseManager.locations.getLocationsByNovelId(novelId);
      setLocations(locationsData);
    }
  };
  
  const refreshCultures = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const culturesData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'culture');
      setCultures(culturesData);
    }
  };
  
  const refreshTechnologies = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const technologiesData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'technology');
      setTechnologies(technologiesData);
    }
  };
  
  const refreshMagics = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const magicsData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'magic');
      setMagics(magicsData);
    }
  };
  
  const refreshHistories = async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const historiesData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'history');
      setHistories(historiesData);
    }
  };

  const [activeTab, setActiveTab] = useState('overview');

  // 刷新所有数据
  const refreshAllData = () => {
    if (novelId) {
      refreshCharacters(novelId);
      refreshLocations(novelId);
      refreshCultures(novelId);
      refreshTechnologies(novelId);
      refreshMagics(novelId);
      refreshHistories(novelId);
      message.success('数据已刷新');
    }
  };

  // 获取当前小说的数据统计
  const getDataStats = () => {
    if (!novelId) return null;
    
    return {
      characters: characters.filter(c => c.novelId === novelId).length,
      locations: locations.filter(l => l.novelId === novelId).length,
      cultures: cultures.filter(c => c.novelId === novelId).length,
      technologies: technologies.filter(t => t.novelId === novelId).length,
      magics: magics.filter(m => m.novelId === novelId).length,
      histories: histories.filter(h => h.novelId === novelId).length,
    };
  };

  const stats = getDataStats();

  // 初始化时刷新数据
  useEffect(() => {
    refreshAllData();
  }, []);

  // 监听数据变化，重新计算统计数据
  useEffect(() => {
    // 数据变化时会自动重新渲染
  }, [characters, locations, cultures, technologies, magics, histories, novelId]);

  // 处理导航到具体可视化图表
  const handleNavigateToChart = (chartType: string) => {
    setActiveTab('detail');
    updateViewParam(chartType);
  };

  // 获取当前视图类型
  const getCurrentView = () => {
    const params = new URLSearchParams(location.search);
    return params.get('view') || 'characters';
  };

  const currentView = getCurrentView();

  // 监听location变化，确保当URL参数变化时能够正确更新
  useEffect(() => {
    // 当location变化时，会重新计算currentView
    // 如果有view参数，自动切换到详细视图
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    // URL参数变化处理
    if (view) {
      setActiveTab('detail');
    }
  }, [location]);

  // 更新URL参数
  const updateViewParam = (viewType: string) => {
    navigate(`/novels/${novelId}/visualization?view=${viewType}`);
  };

  // 渲染具体图表
  const renderChart = () => {
    switch (currentView) {
      case 'characters':
        return <div className="w-full overflow-hidden"><CharacterNetwork /></div>;
      case 'location':
      case 'culture':
      case 'technology':
      case 'magic':
      case 'history':
        // 处理单数形式的世界设定类型
        return <div className="w-full overflow-hidden"><WorldSettingNetwork settingType={currentView} /></div>;
      case 'locations':
      case 'cultures':
      case 'technologies':
      case 'magics':
      case 'histories':
        // 处理复数形式的世界设定类型，转换为单数形式
        let singularForm;
        switch (currentView) {
          case 'technologies':
            singularForm = 'technology';
            break;
          case 'histories':
            singularForm = 'history';
            break;
          default:
            singularForm = currentView.slice(0, -1); // 移除复数形式的's'
        }
        // 复数形式转换为单数形式
        return <div className="w-full overflow-hidden"><WorldSettingNetwork settingType={singularForm} /></div>;
      case 'world-settings':
        return <div className="w-full overflow-hidden"><WorldSettingNetwork /></div>;
      case 'plot':
        return <div className="w-full overflow-hidden"><TimelineChart /></div>;
      case 'chapters':
        return <div className="w-full overflow-hidden"><ChapterNetwork /></div>;
      case 'themes':
        return <div className="w-full overflow-hidden"><ThemeSymbolChart /></div>;
      // 调试图表已移除
      case 'timeline':
        return (
          <Card title="时间轴" className="h-full">
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <HeatMapOutlined className="text-4xl text-gray-300 mb-4" />
                <Title level={4} className="text-gray-500">时间轴图表</Title>
                <Text type="secondary">按时间顺序展示所有重要事件</Text>
              </div>
            </div>
          </Card>
        );
      case 'overview':
        return (
          <Card title="综合分析" className="h-full">
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <RadarChartOutlined className="text-4xl text-gray-300 mb-4" />
                <Title level={4} className="text-gray-500">综合分析图表</Title>
                <Text type="secondary">多维度综合分析小说世界</Text>
              </div>
            </div>
          </Card>
        );
      default:
        return (
          <Card title="可视化图表" className="h-full">
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChartOutlined className="text-4xl text-gray-300 mb-4" />
                <Title level={4} className="text-gray-500">请选择可视化类型</Title>
                <Text type="secondary">从上方概览中选择要查看的图表类型</Text>
              </div>
            </div>
          </Card>
        );
    }
  };

  // 渲染概览视图
  const renderOverview = () => (
    <div className="w-full overflow-hidden">
      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6" wrap>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card 
            hoverable 
            onClick={() => handleNavigateToChart('characters')}
            cover={<div className="bg-blue-100 h-16 flex items-center justify-center"><TeamOutlined className="text-2xl text-blue-500" /></div>}
          >
            <Card.Meta 
              title="角色关系" 
              description={`人物网络分析 (${stats?.characters || 0}个角色)`} 
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card 
            hoverable 
            onClick={() => handleNavigateToChart('locations')}
            cover={<div className="bg-green-100 h-16 flex items-center justify-center"><EnvironmentOutlined className="text-2xl text-green-500" /></div>}
          >
            <Card.Meta 
              title="地点网络" 
              description={`地理关系图谱 (${stats?.locations || 0}个地点)`} 
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card 
            hoverable 
            onClick={() => handleNavigateToChart('cultures')}
            cover={<div className="bg-purple-100 h-16 flex items-center justify-center"><BookOutlined className="text-2xl text-purple-500" /></div>}
          >
            <Card.Meta 
              title="文化体系" 
              description={`文明演化分析 (${stats?.cultures || 0}个文化)`} 
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card 
            hoverable 
            onClick={() => handleNavigateToChart('technologies')}
            cover={<div className="bg-cyan-100 h-16 flex items-center justify-center"><ApiOutlined className="text-2xl text-cyan-500" /></div>}
          >
            <Card.Meta 
              title="科技树" 
              description={`技术发展路径 (${stats?.technologies || 0}项科技)`} 
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card 
            hoverable 
            onClick={() => handleNavigateToChart('magics')}
            cover={<div className="bg-orange-100 h-16 flex items-center justify-center"><ExperimentOutlined className="text-2xl text-orange-500" /></div>}
          >
            <Card.Meta 
              title="魔法系统" 
              description={`法术关联网络 (${stats?.magics || 0}种魔法)`} 
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card 
            hoverable 
            onClick={() => handleNavigateToChart('histories')}
            cover={<div className="bg-gray-100 h-16 flex items-center justify-center"><HistoryOutlined className="text-2xl text-gray-500" /></div>}
          >
            <Card.Meta 
              title="历史脉络" 
              description={`时间线事件 (${stats?.histories || 0}段历史)`} 
            />
          </Card>
        </Col>
      </Row>

      {/* 高级可视化选项 */}
      <div className="mb-6">
        <Title level={4} className="mb-4">高级分析</Title>
        <Row gutter={[16, 16]} wrap>
          <Col xs={24} sm={12} md={4}>
            <Card 
              hoverable 
              onClick={() => handleNavigateToChart('plot')}
              className="h-full"
            >
              <div className="flex items-center">
                <BranchesOutlined className="text-2xl text-blue-500 mr-3" />
                <div>
                  <div className="font-medium">情节线索</div>
                  <div className="text-sm text-gray-500">故事发展脉络</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card 
              hoverable 
              onClick={() => handleNavigateToChart('timeline')}
              className="h-full"
            >
              <div className="flex items-center">
                <HeatMapOutlined className="text-2xl text-green-500 mr-3" />
                <div>
                  <div className="font-medium">时间轴</div>
                  <div className="text-sm text-gray-500">历史事件排序</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card 
              hoverable 
              onClick={() => handleNavigateToChart('chapters')}
              className="h-full"
            >
              <div className="flex items-center">
                <FileTextOutlined className="text-2xl text-orange-500 mr-3" />
                <div>
                  <div className="font-medium">章节网络</div>
                  <div className="text-sm text-gray-500">章节关联分析</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card 
              hoverable 
              onClick={() => handleNavigateToChart('themes')}
              className="h-full"
            >
              <div className="flex items-center">
                <TagOutlined className="text-2xl text-purple-500 mr-3" />
                <div>
                  <div className="font-medium">主题象征</div>
                  <div className="text-sm text-gray-500">主题与象征分析</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card 
              hoverable 
              onClick={() => handleNavigateToChart('overview')}
              className="h-full"
            >
              <div className="flex items-center">
                <RadarChartOutlined className="text-2xl text-purple-500 mr-3" />
                <div>
                  <div className="font-medium">综合分析</div>
                  <div className="text-sm text-gray-500">多维度分析</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 操作按钮 */}
      <div className="mb-6">
        <Space wrap>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={refreshAllData}
          >
            刷新数据
          </Button>
          
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'export-png',
                  label: '导出为PNG',
                  icon: <DownloadOutlined />,
                  onClick: () => message.info('导出功能即将推出')
                },
                {
                  key: 'export-svg',
                  label: '导出为SVG',
                  icon: <DownloadOutlined />,
                  onClick: () => message.info('导出功能即将推出')
                },
                {
                  key: 'export-pdf',
                  label: '导出为PDF',
                  icon: <DownloadOutlined />,
                  onClick: () => message.info('导出功能即将推出')
                }
              ]
            }}
          >
            <Button icon={<DownloadOutlined />}>
              导出 <DownOutlined />
            </Button>
          </Dropdown>
          
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'share-link',
                  label: '分享链接',
                  icon: <ShareAltOutlined />,
                  onClick: () => message.info('分享功能即将推出')
                },
                {
                  key: 'share-image',
                  label: '分享图片',
                  icon: <ShareAltOutlined />,
                  onClick: () => message.info('分享功能即将推出')
                }
              ]
            }}
          >
            <Button icon={<ShareAltOutlined />}>
              分享 <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </div>
    </div>
  );

  return (
    <Layout style={{ height: '100%', overflow: 'hidden', backgroundColor: '#ffffff' }}>
      <div style={{ padding: '24px', height: '100%', overflow: 'auto' }} className="w-full">
        <div style={{ maxWidth: 1400, margin: '0 auto' }} className="w-full">
          {/* 面包屑导航和返回按钮 */}
          <div className="mb-4 flex items-center justify-between">
            <Breadcrumb>
              <Breadcrumb.Item>首页</Breadcrumb.Item>
              {/* 修复面包屑导航中小说名称显示问题 */}
              <Breadcrumb.Item>
                {novelLoading ? '加载中...' : (novel?.title ? novel.title : '小说')}
              </Breadcrumb.Item>
              <Breadcrumb.Item>关系网</Breadcrumb.Item>
            </Breadcrumb>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(`/novels/${novelId}`)}
            >
              返回小说
            </Button>
          </div>
          
          <div className="mb-6">
            <Title level={3}>关系网</Title>
            <Text type="secondary">通过可视化图表探索和分析您的小说世界</Text>
          </div>

          {/* 标签页切换 */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden w-full"
          >
            <TabPane 
              tab={
                <span>
                  <BarChartOutlined />
                  概览
                </span>
              } 
              key="overview" 
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-auto w-full">
                {renderOverview()}
              </div>
            </TabPane>
            <TabPane 
              tab={
                <span>
                  <RadarChartOutlined />
                  详细视图
                </span>
              } 
              key="detail" 
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-auto w-full">
                {renderChart()}
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default VisualizationPage;