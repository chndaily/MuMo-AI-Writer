import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Button, message, Modal, Alert, Dropdown, Space, Input } from 'antd';
import {
  BookOutlined,
  PlusOutlined,
  FileTextOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BookFilled,
  ExperimentOutlined,
  EditOutlined,
  PlayCircleOutlined,
  SearchOutlined // 新增导入
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreationCenterStore } from '@/stores/creationCenterStore';
import { useMembershipStore } from '@/stores/membershipStore'; // 新增导入
import OutlineBoard from './modules/OutlineBoard';
import WorldSettingPanel from './modules/WorldSettingPanel';
import CreateNovelModal from './modules/CreateNovelModal';
import EditNovelModal from './modules/EditNovelModal'; // 新增导入
// 导入新的独立面板组件
import CharacterPanel from './modules/world/CharacterPanel';
import LocationPanel from './modules/world/LocationPanel';
import CulturePanel from './modules/world/CulturePanel';
import TechnologyPanel from './modules/world/TechnologyPanel';
import MagicPanel from './modules/world/MagicPanel';
import HistoryPanel from './modules/world/HistoryPanel';
import WritingRecordPanel from './modules/writing/WritingRecordPanel';
import './index.scss';

const { Sider, Content } = Layout;

type ActiveSection = 'books' | 'outline' | 'worldsetting' | 'characters' | 'locations' | 'cultures' | 'technologies' | 'magics' | 'histories' | 'writing-records';

const NovelCrafter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<ActiveSection>('books');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditingNovel, setCurrentEditingNovel] = useState<any>(null);
  const [aiSyncData, setAiSyncData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState(''); // 新增搜索状态
  // 直接使用 databaseManager 获取数据
  const [novels, setNovels] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  
  const { membershipInfo, isAuthenticated } = useMembershipStore(); // 获取当前用户信息
  
  // 检查用户是否已认证
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('用户未认证，重定向到登录页');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  const refreshNovels = useCallback(async () => {
    const { databaseManager } = await import('@/services/index');
    // 修改为只获取当前用户的小说
    const novelsData = await databaseManager.novels.getNovelsByUserId(membershipInfo.email || 'anonymous');
    setNovels(novelsData);
  }, [membershipInfo]);
  
  const deleteNovel = async (id: string) => {
    const { databaseManager } = await import('@/services/index');
    await databaseManager.novels.deleteNovel(id);
  };
  
  const refreshGenres = useCallback(async () => {
    const { databaseManager } = await import('@/services/index');
    // 获取所有文化设定并过滤出类型
    const allCultures = await databaseManager.worldSettings.getAllData('culture');
    // 过滤出系统级别的类型
    const genresData = allCultures
      .filter(culture => culture.tags?.includes('genre'))
      .map(culture => ({
        id: culture.id,
        name: culture.name,
        displayName: culture.description || culture.name,
        color: '#1890ff',
        isActive: true,
        createdAt: culture.createdAt,
      }));
    setGenres(genresData);
  }, []);
  const { selectedNovel, setSelectedNovel, clearSelectedNovel } = useCreationCenterStore();

  useEffect(() => {
    refreshNovels();
    // 刷新类型数据
    refreshGenres();
  }, [refreshNovels, refreshGenres, membershipInfo]); // 添加membershipInfo作为依赖项

  // 处理来自AI工作台的数据
  useEffect(() => {
    const state = location.state as any;
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section') as ActiveSection;
    const novelId = searchParams.get('novelId');
    
    // 获取各种类型的元素ID参数
    const characterId = searchParams.get('characterId');
    const locationId = searchParams.get('locationId');
    const cultureId = searchParams.get('cultureId');
    const technologyId = searchParams.get('technologyId');
    const magicId = searchParams.get('magicId');
    const historyId = searchParams.get('historyId');

    if (state && state.fromAI) {
      setAiSyncData(state);
      if (state.mode === 'outline') {
        setActiveSection('outline');
        message.info('已接收到AI生成的大纲内容，请在大纲管理中查看');
      } else if (state.mode === 'worldsetting' || ['character', 'location', 'culture', 'technology', 'magic', 'history'].includes(state.mode)) {
        // 根据传入的类型设置对应的活动面板
        switch(state.mode) {
          case 'character':
            setActiveSection('characters');
            break;
          case 'location':
            setActiveSection('locations');
            break;
          case 'culture':
            setActiveSection('cultures');
            break;
          case 'technology':
            setActiveSection('technologies');
            break;
          case 'magic':
            setActiveSection('magics');
            break;
          case 'history':
            setActiveSection('histories');
            break;
          default:
            setActiveSection('worldsetting');
        }
        message.info('已接收到AI生成的世界观内容，请在对应的世界观设定中查看');
      }
    } else if (section) {
      // 处理URL参数
      setActiveSection(section);
    }
    
    // 检查localStorage中的AI生成内容
    const aiContent = localStorage.getItem('aiGeneratedContent');
    if (aiContent) {
      setAiSyncData({ generatedContent: aiContent, fromStorage: true });
      localStorage.removeItem('aiGeneratedContent'); // 清除已使用的内容
    }
  }, [location.state, location.search]);

  // 当novels数据更新后，设置选中的小说
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const state = location.state as any;
    const novelId = searchParams.get('novelId') || (state && state.novelId);
    
    if (novelId && novels.length > 0) {
      // 如果有novelId，设置选中的小说
      const novel = novels.find(n => n.id === novelId);
      if (novel) {
        setSelectedNovel(novel);
      }
      
      // 获取各种类型的元素ID参数
      const characterId = searchParams.get('characterId');
      const locationId = searchParams.get('locationId');
      const cultureId = searchParams.get('cultureId');
      const technologyId = searchParams.get('technologyId');
      const magicId = searchParams.get('magicId');
      const historyId = searchParams.get('historyId');
      
      // 将元素ID参数添加到aiSyncData中，以便在对应的面板组件中处理
      if (characterId || locationId || cultureId || technologyId || magicId || historyId) {
        setAiSyncData({
          ...aiSyncData,
          characterId,
          locationId,
          cultureId,
          technologyId,
          magicId,
          historyId
        });
      }
    }
  }, [novels, location.state, location.search, setSelectedNovel]);

  // 当类型数据更新时，确保UI能正确更新
  useEffect(() => {
    console.log('类型数据更新:', genres);
  }, [genres]);

  const handleDeleteNovel = (novelId: string, novelTitle: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除小说《${novelTitle}》吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteNovel(novelId);
          message.success('小说删除成功');
          // 如果删除的是当前选中的小说，清空选择
          if (selectedNovel?.id === novelId) {
            clearSelectedNovel();
          }
          // 刷新小说列表
          await refreshNovels();
        } catch (error) {
          message.error('删除失败，请重试');
        }
      }
    });
  };

  // 处理小说选择
  const handleBookSelect = (novel: any) => {
    setSelectedNovel(novel);
    message.success(`已选择小说：${novel.title}`);
  };

  // 新增：处理编辑小说资料
  const handleEditNovel = (novel: any) => {
    setCurrentEditingNovel(novel);
    setEditModalVisible(true);
  };

  const menuItems = [
    {
      key: 'create',
      icon: <PlusOutlined />,
      label: '创建新书',
      style: { backgroundColor: '#1677ff', color: 'white', marginBottom: '16px' }
    },
    {
      key: 'books',
      icon: <BookOutlined />,
      label: '我的书籍'
    },
    {
      key: 'outline',
      icon: <FileTextOutlined />,
      label: '大纲管理'
    },
    // 添加分组标题和折叠菜单
    {
      type: 'group' as const,
      label: '世界观设定',
      children: [
        {
          key: 'worldsetting',
          icon: <GlobalOutlined />,
          label: '综合设定'
        },
        {
          key: 'characters',
          icon: <UserOutlined />,
          label: '角色设定'
        },
        {
          key: 'locations',
          icon: <EnvironmentOutlined />,
          label: '地点设定'
        },
        {
          key: 'cultures',
          icon: <BookFilled />,
          label: '文化设定'
        },
        {
          key: 'technologies',
          icon: <ExperimentOutlined />,
          label: '科技设定'
        },
        {
          key: 'magics',
          icon: <ThunderboltOutlined />,
          label: '魔法设定'
        },
        {
          key: 'histories',
          icon: <BookOutlined />,
          label: '历史设定'
        },
        {
          key: 'writing-records',
          icon: <FileTextOutlined />,
          label: '写作记录'
        }
      ]
    },
    // 添加分隔线
    {
      type: 'divider' as const
    },
    {
      key: 'ai-workspace',
      icon: <ThunderboltOutlined />,
      label: 'AI智能工作台'
    }
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'create') {
      setCreateModalVisible(true);
    } else if (key === 'ai-workspace') {
      navigate('/ai-workspace');
    } else {
      setActiveSection(key as ActiveSection);
    }
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'books':
        // 根据搜索词过滤小说
        const filteredNovels = novels.filter(novel => 
          novel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          novel.genre.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return (
          <div className="books-panel">
            <div className="panel-header">
              <div>
                <h2>我的书籍</h2>
                <Input
                  placeholder="搜索书籍或类型..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 300, marginTop: 16 }}
                />
              </div>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                创建新书
              </Button>
            </div>
            <div className="books-grid">
              {filteredNovels.map(novel => (
                <div 
                  key={novel.id} 
                  className={`book-card ${selectedNovel?.id === novel.id ? 'selected' : ''}`}
                  onClick={() => handleBookSelect(novel)}
                >
                  <div className="book-cover">
                    {novel.coverImage ? (
                      <img src={novel.coverImage} alt={novel.title} />
                    ) : (
                      <div className="default-cover">
                        <BookOutlined style={{ fontSize: '32px' }} />
                      </div>
                    )}
                    {selectedNovel?.id === novel.id && (
                      <div className="selected-indicator">
                        <span>已选择</span>
                      </div>
                    )}
                  </div>
                  <div className="book-info">
                    <h3 className="book-title">{novel.title}</h3>
                    <p className="book-genre">
                      {getGenreDisplayName(novel.genre)}
                    </p>
                    <p className="book-progress">{novel.progress}% 完成</p>
                    <p className="book-words">{(novel.wordCount || 0).toLocaleString()} 字</p>
                  </div>
                  <div className="book-actions" onClick={(e) => e.stopPropagation()}>
                    <Space>
                      <Button 
                        type="primary" 
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={() => navigate(`/novels/${novel.id}`)}
                      >
                        开始创作
                      </Button>
                      <Button 
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditNovel(novel)}
                      >
                        编辑资料
                      </Button>
                      <Button 
                        size="small"
                        icon={<BookOutlined />}
                        danger
                        onClick={() => handleDeleteNovel(novel.id, novel.title)}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                </div>
              ))}
              {filteredNovels.length === 0 && (
                <div className="empty-state">
                  <BookOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <p>{searchTerm ? '没有找到匹配的书籍' : '还没有书籍，点击创建新书开始创作吧！'}</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'outline':
        return <OutlineBoard aiSyncData={aiSyncData} novelId={selectedNovel?.id} />;
      case 'worldsetting':
        return <WorldSettingPanel aiSyncData={aiSyncData} novelId={selectedNovel?.id} />;
      // 添加新的独立面板
      case 'characters':
        return <CharacterPanel aiSyncData={aiSyncData} novelId={selectedNovel?.id} />;
      case 'locations':
        return <LocationPanel aiSyncData={aiSyncData} novelId={selectedNovel?.id} />;
      case 'cultures':
        return <CulturePanel aiSyncData={aiSyncData} novelId={selectedNovel?.id} />;
      case 'technologies':
        return <TechnologyPanel aiSyncData={aiSyncData} novelId={selectedNovel?.id} />;
      case 'magics':
        return <MagicPanel aiSyncData={aiSyncData} novelId={selectedNovel?.id} />;
      case 'histories':
        return <HistoryPanel aiSyncData={aiSyncData} novelId={selectedNovel?.id} />;
      case 'writing-records':
        return <WritingRecordPanel aiSyncData={aiSyncData} novelId={selectedNovel?.id} />;
      default:
        return <div>请选择功能模块</div>;
    }
  };

  // 获取小说类型的显示名称
  const getGenreDisplayName = (genre: string): string => {
    // 首先尝试从genres中查找匹配的类型
    const genreInfo = genres.find(g => g.name === genre);
    if (genreInfo) {
      return genreInfo.displayName;
    }
    
    // 如果在genres中找不到，使用默认的类型映射
    const genreMap: Record<string, string> = {
      'fantasy': '奇幻',
      'scifi': '科幻',
      'romance': '言情',
      'mystery': '悬疑',
      'thriller': '惊悚',
      'horror': '恐怖',
      'adventure': '冒险',
      'historical': '历史',
      'biography': '传记',
      'urban': '都市',
      'martial': '武侠',
      'other': '其他'
    };
    
    return genreMap[genre] || genre;
  };

  return (
    <Layout className="novelcrafter-layout">
      <Sider 
        width={260} 
        className="novelcrafter-main-sidebar"
        theme="light"
      >
        <div className="sidebar-header">
          <h2>创作中心</h2>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeSection]}
          items={menuItems}
          onClick={handleMenuClick}
          className="sidebar-menu"
        />
      </Sider>
      
      <Content className="novelcrafter-content">
        {/* AI数据同步提示 */}
        {aiSyncData && (
          <Alert
            message="AI内容已同步"
            description={`来自AI工作台的内容已准备好，您可以在相应的板块中使用。${aiSyncData.generatedContent ? '点击下方按钮查看内容。' : ''}`}
            type="info"
            showIcon
            closable
            onClose={() => setAiSyncData(null)}
            action={
              aiSyncData.generatedContent ? (
                <Button
                  size="small"
                  onClick={() => {
                    Modal.info({
                      title: 'AI生成内容',
                      content: (
                        <div style={{ maxHeight: '400px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                          {aiSyncData.generatedContent}
                        </div>
                      ),
                      width: 800
                    });
                  }}
                >
                  查看内容
                </Button>
              ) : null
            }
            style={{ marginBottom: '16px' }}
          />
        )}
        {renderMainContent()}
      </Content>

      <CreateNovelModal 
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          refreshNovels();
          message.success('新书创建成功！');
        }}
      />
      
      {/* 新增编辑小说模态框 */}
      <EditNovelModal
        visible={editModalVisible}
        novel={currentEditingNovel}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentEditingNovel(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setCurrentEditingNovel(null);
          refreshNovels();
          message.success('小说信息更新成功！');
        }}
      />
    </Layout>
  );
};

export default NovelCrafter;