import { Avatar, Button, Dropdown, Tabs, Radio, Menu, Tooltip, Divider, Select, message, Modal } from 'antd';
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useMembershipStore } from '@/stores/membershipStore';
import { MembershipLevel } from '@/stores/membershipStore';
import {
  LeftOutlined,
  SettingOutlined,
  VerticalAlignTopOutlined,
  PauseOutlined,
  UserOutlined,
  RobotOutlined,
  TeamOutlined,
  ShareAltOutlined,
  CreditCardOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  ExportOutlined,
  BookOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  SoundOutlined,
  HomeOutlined,
  MenuOutlined,
  ArrowLeftOutlined,
  CaretDownOutlined,
  EnvironmentOutlined,
  ApiOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  TagsOutlined,
  CrownOutlined,
  BarChartOutlined,
  TrophyOutlined,
  FileTextOutlined,
  BulbOutlined,
  LikeOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import classNames from 'classnames';
import AlIcon from '@/components/icon/AlIcon';
import { useParams, useRouter } from '@/router/hooks';
import { useLayoutSettingActions, useLayoutSettings } from '@/stores/layoutSettingStore';
import { Novel, WritingRecord } from '#/novel';

import { authService } from '@/services/authService';

// 角色类型映射函数
const getCharacterRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'protagonist': '主角',
    'antagonist': '反派',
    'supporting': '配角',
    'minor': '次要角色',
    'side': '侧面角色',
    'foil': '对照角色',
    'mentor': '导师',
    'loveInterest': '恋人',
    'rival': '对手',
    'neutral': '中立角色',
    'keySupporting': '重要配角',
    'minorSupporting': '次要配角',
    'complexSupporting': '复杂配角'
  };
  
  return roleMap[role] || '配角';
};

// 提取DynamicCharacterList组件到顶层作用域
const DynamicCharacterList: React.FC = () => {
  // 直接使用 databaseManager 获取数据
  const [characters, setCharacters] = useState<any[]>([]);
  const refreshCharacters = useCallback(async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const charactersData = await databaseManager.characters.getCharactersByNovelId(novelId);
      setCharacters(charactersData);
    }
  }, []);
  const params = useParams();
  const novelId = params.novelId as string;
  const router = useRouter();

  // 获取角色数据
  const characterData = useMemo(() => {
    if (!novelId) return [];
    return characters.filter(char => char.novelId === novelId);
  }, [characters, novelId]);

  // 当组件挂载时刷新角色数据
  useEffect(() => {
    if (novelId) {
      refreshCharacters(novelId);
    }
  }, [novelId, refreshCharacters]);

  return (
    <div className="sidebar-list">
      {characterData.map((character) => (
        <Tooltip 
          key={character.id} 
          title={character.description || '暂无描述'}
          placement="right"
        >
          <div 
            className="sidebar-list-item cursor-pointer hover:bg-gray-50"
            onClick={() => window.open(`/creation-center?novelId=${novelId}&section=characters&characterId=${character.id}`, '_blank')}
          >
            <div 
              className="avatar-placeholder flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {character.name.charAt(0)}
            </div>
            <div className="sidebar-list-item-info">
              <div className="sidebar-list-item-title">
                {character.name}
                <span className="text-gray-500 font-normal ml-2">
                  （{getCharacterRoleDisplayName(character.role)}）
                </span>
              </div>
              <div className="sidebar-list-item-desc truncate">
                {character.description || '暂无描述'}
              </div>
            </div>
          </div>
        </Tooltip>
      ))}
      {characterData.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          暂无角色数据
        </div>
      )}
    </div>
  );
};

// 提取WorldSettingList组件到顶层作用域
const WorldSettingList: React.FC = () => {
  // 直接使用 databaseManager 获取数据
  const [locations, setLocations] = useState<any[]>([]);
  const [cultures, setCultures] = useState<any[]>([]);
  const [technologies, setTechnologies] = useState<any[]>([]);
  const [magics, setMagics] = useState<any[]>([]);
  const [histories, setHistories] = useState<any[]>([]);
  
  const refreshLocations = useCallback(async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const locationsData = await databaseManager.locations.getLocationsByNovelId(novelId);
      setLocations(locationsData);
    }
  }, []);
  
  const refreshCultures = useCallback(async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const culturesData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'culture');
      setCultures(culturesData);
    }
  }, []);
  
  const refreshTechnologies = useCallback(async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const technologiesData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'technology');
      setTechnologies(technologiesData);
    }
  }, []);
  
  const refreshMagics = useCallback(async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const magicsData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'magic');
      setMagics(magicsData);
    }
  }, []);
  
  const refreshHistories = useCallback(async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const historiesData = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'history');
      setHistories(historiesData);
    }
  }, []);
  
  const params = useParams();
  const novelId = params.novelId as string;
  const router = useRouter();

  // 获取各类数据
  const locationData = useMemo(() => {
    if (!novelId) return [];
    return locations.filter(item => item.novelId === novelId);
  }, [locations, novelId]);

  const cultureData = useMemo(() => {
    if (!novelId) return [];
    return cultures.filter(item => item.novelId === novelId);
  }, [cultures, novelId]);

  const technologyData = useMemo(() => {
    if (!novelId) return [];
    return technologies.filter(item => item.novelId === novelId);
  }, [technologies, novelId]);

  const magicData = useMemo(() => {
    if (!novelId) return [];
    return magics.filter(item => item.novelId === novelId);
  }, [magics, novelId]);

  const historyData = useMemo(() => {
    if (!novelId) return [];
    return histories.filter(item => item.novelId === novelId);
  }, [histories, novelId]);

  // 当组件挂载时刷新所有数据
  useEffect(() => {
    if (novelId) {
      refreshLocations(novelId);
      refreshCultures(novelId);
      refreshTechnologies(novelId);
      refreshMagics(novelId);
      refreshHistories(novelId);
    }
  }, [novelId, refreshLocations, refreshCultures, refreshTechnologies, refreshMagics, refreshHistories]);

  // 渲染设定项
  const renderSettingItem = (item: any, type: string, section: string) => {
    const getIcon = () => {
      switch (type) {
        case 'culture': return <BookOutlined style={{ color: '#ffefba' }} />;
        case 'technology': return <ApiOutlined style={{ color: '#ffefba' }} />;
        case 'magic': return <ExperimentOutlined style={{ color: '#ffefba' }} />;
        case 'history': return <HistoryOutlined style={{ color: '#ffefba' }} />;
        case 'location': return <EnvironmentOutlined style={{ color: '#ffefba' }} />;
        default: return <BookOutlined style={{ color: '#7f8c8d' }} />;
      }
    };

    const getRoute = () => {
      switch (type) {
        case 'culture': return 'cultures';
        case 'technology': return 'technologies';
        case 'magic': return 'magics';
        case 'history': return 'histories';
        case 'location': return 'locations';
        default: return 'world-settings';
      }
    };

    return (
      <Tooltip 
        key={item.id} 
        title={item.description || '暂无描述'}
        placement="right"
      >
        <div 
          className="sidebar-list-item cursor-pointer hover:bg-gray-50"
          onClick={() => window.open(`/creation-center?novelId=${novelId}&section=${getRoute()}&${type}Id=${item.id}`, '_blank')}
        >
          <div 
            className="location-icon flex items-center justify-center"
            style={{
              backgroundColor: type === 'culture' ? '#9b59b6' : 
                              type === 'technology' ? '#3498db' : 
                              type === 'magic' ? '#e67e22' : 
                              type === 'history' ? '#2c3e50' : 
                              type === 'location' ? '#27ae60' : 
                              '#7f8c8d'
            }}
          >
            {getIcon()}
          </div>
          <div className="sidebar-list-item-info">
            <div className="sidebar-list-item-title">{item.name}</div>
            <div className="sidebar-list-item-desc truncate">
              {item.description || '暂无描述'}
            </div>
          </div>
        </div>
      </Tooltip>
    );
  };

  // 检查是否有任何数据
  const hasAnyData = locationData.length > 0 || cultureData.length > 0 || 
                    technologyData.length > 0 || magicData.length > 0 || historyData.length > 0;

  return (
    <div className="sidebar-list">
      {hasAnyData ? (
        <>
          {/* 地点设定 */}
          {locationData.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2">地点设定</div>
              {locationData.map(item => renderSettingItem(item, 'location', 'locations'))}
            </>
          )}

          {/* 文化设定 */}
          {cultureData.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2 mt-4">文化设定</div>
              {cultureData.map(item => renderSettingItem(item, 'culture', 'cultures'))}
            </>
          )}

          {/* 科技设定 */}
          {technologyData.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2 mt-4">科技设定</div>
              {technologyData.map(item => renderSettingItem(item, 'technology', 'technologies'))}
            </>
          )}

          {/* 魔法设定 */}
          {magicData.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2 mt-4">魔法设定</div>
              {magicData.map(item => renderSettingItem(item, 'magic', 'magics'))}
            </>
          )}

          {/* 历史设定 */}
          {historyData.length > 0 && (
            <>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2 mt-4">历史设定</div>
              {historyData.map(item => renderSettingItem(item, 'history', 'histories'))}
            </>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 py-4">
          暂无世界观设定数据
        </div>
      )}
    </div>
  );
};

// 提取WritingRecords组件到顶层作用域
const WritingRecords: React.FC = () => {
  // 直接使用 databaseManager 获取数据
  const [writingRecords, setWritingRecords] = useState<WritingRecord[]>([]);
  const refreshWritingRecords = useCallback(async (novelId?: string) => {
    if (novelId) {
      const { databaseManager } = await import('@/services/index');
      const records = await databaseManager.writingRecords.getWritingRecordsByNovelId(novelId);
      setWritingRecords(records);
    }
  }, []);
  const params = useParams();
  const novelId = params.novelId as string;
  const router = useRouter();

  // 获取当前小说的写作记录
  const novelWritingRecords = useMemo(() => {
    if (!novelId) return [];
    return writingRecords.filter(record => record.novelId === novelId);
  }, [writingRecords, novelId]);

  // 当组件挂载时刷新写作记录数据
  useEffect(() => {
    if (novelId) {
      refreshWritingRecords(novelId);
    }
  }, [novelId, refreshWritingRecords]);

  // 获取记录类型的显示名称
  const getRecordTypeDisplayName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'writing_session': '写作会话',
      'idea': '创意',
      'research': '研究',
      'outline': '大纲',
      'character_development': '角色发展',
      'world_building': '世界观构建',
      'plot_development': '情节发展'
    };
    
    return typeMap[type] || '未知类型';
  };

  // 获取记录状态的显示名称
  const getRecordStatusDisplayName = (status: string): string => {
    const statusMap: Record<string, string> = {
      'draft': '草稿',
      'published': '已发布',
      'archived': '已归档'
    };
    
    return statusMap[status] || '未知状态';
  };

  // 渲染写作记录项
  const renderWritingRecordItem = (record: WritingRecord) => {
    return (
      <Tooltip 
        key={record.id} 
        title={record.content || '暂无内容'}
        placement="right"
      >
        <div 
          className="sidebar-list-item cursor-pointer hover:bg-gray-50"
          onClick={() => window.open(`/creation-center?novelId=${novelId}&section=writing-records&recordId=${record.id}`, '_blank')}
        >
          <div 
            className="location-icon flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }}
          >
            <BookOutlined style={{ color: 'white' }} />
          </div>
          <div className="sidebar-list-item-info">
            <div className="sidebar-list-item-title">
              {record.title}
              <span className="text-gray-500 font-normal ml-2">
                （{getRecordTypeDisplayName(record.type)}）
              </span>
            </div>
            <div className="sidebar-list-item-desc truncate">
              {record.content || '暂无内容'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              <span className="mr-2">{getRecordStatusDisplayName(record.status)}</span>
              <span>{record.wordCount} 字</span>
            </div>
          </div>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="sidebar-list">
      {novelWritingRecords.length > 0 ? (
        novelWritingRecords.map(record => renderWritingRecordItem(record))
      ) : (
        <div className="text-center text-gray-500 py-4">
          暂无写作记录
        </div>
      )}
    </div>
  );
};

// 将tabsItems移到Sidebar组件之前定义，确保在使用前已定义
// 使用函数引用而不是JSX组件，避免在渲染时创建新实例
const tabsItems = [
  {
    label: '角色管理',
    icon: <AlIcon icon='shu' size={10} />,
    Component: DynamicCharacterList,
    key: 'characters'
  },
  {
    label: '世界观设定',
    icon: <AlIcon icon='pianduan' size={10} />,
    Component: WorldSettingList,
    key: 'world-settings'
  },
  {
    label: '创作记录',
    icon: <AlIcon icon='talk-s' size={10} />,
    Component: WritingRecords,
    key: 'writing-records'
  }
]

const Sidebar: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const navigateTo = useNavigate(); // 重命名为navigateTo以避免冲突
  const params = useParams();
  const novelId = params.novelId as string;
  const [searchParams, setSearchParams] = useSearchParams();
  const layoutSettings = useLayoutSettings()
  const { setSettings } = useLayoutSettingActions()
  // 直接使用 databaseManager 获取数据
  const [novels, setNovels] = useState<Novel[]>([]);
  const getNovel = useCallback(async (id: string) => {
    const { databaseManager } = await import('@/services/index');
    return await databaseManager.novels.getNovel(id);
  }, []);
  const refreshNovels = useCallback(async () => {
    const { databaseManager } = await import('@/services/index');
    const { useMembershipStore } = await import('@/stores/membershipStore');
    const { membershipInfo } = useMembershipStore.getState();
    const novelsData = await databaseManager.novels.getNovelsByUserId(membershipInfo.email || 'anonymous');
    setNovels(novelsData);
  }, []);
  const [novelInfo, setNovelInfo] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  
  const sidebarActive = searchParams.get('sidebar') || 'characters';

  const sidebarHidden = useMemo(() => {
    return searchParams.get('sidebar') === 'hidden';
  }, [searchParams]);

  // 快捷键支持
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // F1键打开帮助中心
    if (event.key === 'F1') {
      event.preventDefault();
      window.open('/help-center', '_blank');
    }
  }, []);

  // 添加键盘事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 获取会员信息
  const { membershipInfo, isAuthenticated } = useMembershipStore();

  // 获取小说信息的函数
  const fetchNovelInfo = useCallback(async () => {
    if (novelId) {
      setLoading(true);
      try {
        // 获取当前小说信息
        const novel = await getNovel(novelId);
        setNovelInfo(novel || null);
      } catch (error) {
        console.error('获取小说信息失败:', error);
        setNovelInfo(null);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [novelId, getNovel]);

  // 当组件挂载时刷新小说列表数据
  useEffect(() => {
    fetchNovelInfo();
    refreshNovels();
  }, [fetchNovelInfo, refreshNovels]);

  // 计算试用期剩余天数
  const trialDaysLeft = useMemo(() => {
    if (membershipInfo.level === MembershipLevel.FREE || !membershipInfo.expiryDate) {
      return null;
    }
    
    const today = new Date();
    const expiryDate = new Date(membershipInfo.expiryDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [membershipInfo]);

  // 格式化时间显示
  const formatLastModified = (dateString: string | undefined) => {
    if (!dateString) return '暂无保存记录';
    try {
      const date = new Date(dateString);
      return `最后保存时间：${date.toLocaleString('zh-CN')}`;
    } catch (error) {
      return '时间格式错误';
    }
  };

  // 处理小说选择变化
  const handleNovelChange = (newNovelId: string) => {
    // 跳转到新选择的小说页面
    router.push(`/novels/${newNovelId}/manuscript`);
  };

  // 自定义过滤函数
  const filterOption = (input: string, option?: { label: string; value: string }) => {
    if (!option) return false;
    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  };

  return (
    <aside className={classNames('novel-workspace-sidebar', sidebarHidden
      ? "flex flex-col gap-2 border-r shadow relative z-10 w-20 overflow-x-hidden contain-strict min-h-screen"
      : 'w-80 max-w-[300px] flex-none border-r flex flex-col overflow-hidden relative contain-strict min-h-screen'
      , className)}>
      <header className={classNames(sidebarHidden
        ? 'h-auto flex flex-col items-center justify-start gap-2 py-2'
        : 'flex-none h-16 overflow-hidden z-10 shadow px-4 flex items-center gap-3'
      )}>
        {sidebarHidden && (
          <div className="flex flex-col items-center gap-2 w-full">
            <Button 
              title='展开侧边栏'
              type='text' 
              className='text-base expand-btn'
              icon={<ArrowLeftOutlined rotate={180} />}
              onClick={() => {
                searchParams.delete('sidebar');
                setSearchParams(searchParams.toString());
              }}
            />
            <Button title='返回主界面' size='large' className='text-xl' type='text' shape="circle" icon={<HomeOutlined />} onClick={() => router.push('/')}></Button>
            <Button title='设置' size='large' className='text-xl' type='text' shape="circle" icon={<SettingOutlined />} onClick={() => router.push('/config/supabase')}></Button>
          </div>
        )}
        {!sidebarHidden && (
          <>
            <Button title='返回主界面' size='large' className='text-xl' type='text' shape="circle" icon={<HomeOutlined />} onClick={() => router.push('/')}></Button>
            <Button title='设置' size='large' className='text-xl' type='text' shape="circle" icon={<SettingOutlined />} onClick={() => router.push('/config/supabase')}></Button>
            <div className='sidebar-header-title hover:bg-gray-100'>
              {novels.length > 0 ? (
                <Select
                  value={novelId}
                  onChange={handleNovelChange}
                  className="novel-selector"
                  size="small"
                  loading={loading}
                  showSearch
                  optionFilterProp="label"
                  filterOption={filterOption}
                  dropdownStyle={{ minWidth: '120px' }}
                  placeholder="选择小说"
                  suffixIcon={<CaretDownOutlined />}
                >
                  {novels.map(novel => (
                    <Select.Option 
                      key={novel.id} 
                      value={novel.id}
                      label={novel.title || '未命名小说'}
                    >
                      <div className="novel-title truncate" title={novel.title || '未命名小说'}>
                        {novel.title || '未命名小说'}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <>
                  <div className='truncate' style={{ fontSize: '16px', fontWeight: 500, color: 'inherit', textAlign: 'left', width: '100%', padding: '2px 4px 2px 4px' }}>
                    {loading ? '加载中...' : (novelInfo?.title || '未命名小说')}
                  </div>
                </>
              )}
            </div>
            <Button title='收起侧边栏'
              className='text-base collapse-btn rotate-180'
              type='text'
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                searchParams.set('sidebar', 'hidden');
                setSearchParams(searchParams.toString());
              }}
            />
          </>
        )}
      </header>

      <SidebarTabList />
      {!sidebarHidden && (
        <>
          <div className='px-4 py-3 flex-1 overflow-y-auto'>
            {(() => {
              const tabItem = tabsItems.find(item => item.key === sidebarActive);
              return tabItem ? <tabItem.Component /> : null;
            })()}
          </div>
        </>
      )}
      <footer className={
        classNames("sidebar-footer", sidebarHidden
          ? 'flex flex-col gap-2 items-center justify-end mt-auto py-3'
          : 'shrink-0 border-t gap-0 p-2'
        )
      }>
        {!sidebarHidden ? (
          // 展开状态保持原有布局
          <>
            <div className="flex gap-2 w-full items-center">
              {/* 用户头像按钮 */}
              <div className="flex items-center">
                <Dropdown
                  placement='topLeft'
                  trigger={['click']}
                  menu={{
                    items: [
                      {
                        type: 'group',
                        key: 'user-info',
                        label: (
                          <div style={{ padding: 0 }}>
                            {trialDaysLeft !== null && (
                              <div style={{ background: '#fff7e6', color: '#d48806', borderRadius: '8px 8px 0 0', padding: '8px 16px', fontSize: 13, fontWeight: 500 }}>
                                试用期还剩{trialDaysLeft}天
                              </div>
                            )}
                            <div style={{ padding: '16px 16px 8px 16px', borderBottom: '1px solid #f0f0f0' }}>
                              <div style={{ fontWeight: 600, fontSize: 16 }}>{membershipInfo.username || '未知用户'}</div>
                              <div style={{ color: '#888', fontSize: 13 }}>{membershipInfo.email || '未知邮箱'}</div>
                            </div>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                              <span style={{ marginRight: 8 }}>主题:</span>
                              <Radio.Group value={layoutSettings.themeMode} onChange={(e) => setSettings({ ...layoutSettings, themeMode: e.target.value as 'light' | 'dark' })} size="small">
                                <Radio.Button value="light">🌞 浅色</Radio.Button>
                                <Radio.Button value="dark">🌙 深色</Radio.Button>
                              </Radio.Group>
                            </div>
                          </div>
                        ),
                      },
                      { type: 'divider' },
                      { key: 'ai', icon: <RobotOutlined />, label: 'AI 连接' },
                      // { key: 'settings', icon: <SettingOutlined />, label: '通用设置' },
                      // { key: 'teams', icon: <TeamOutlined />, label: '团队' },
                      // { key: 'shared', icon: <ShareAltOutlined />, label: '与我共享' },
                      { type: 'divider' },
                      // 重新排序菜单项，将常用功能放在前面
                      { key: 'profile', icon: <UserOutlined />, label: '个人资料', onClick: () => window.open('/profile', '_blank') },
                      { key: 'membership', icon: <CrownOutlined />, label: '会员中心', onClick: () => window.open('/membership', '_blank') },
                      { key: 'subscription', icon: <CreditCardOutlined />, label: '管理订阅', onClick: () => window.open('/membership', '_blank') },
                      { type: 'divider' },
                      // 启用并重新排序新功能选项，按照您的要求排序
                      { key: 'ai-stats', icon: <BarChartOutlined />, label: 'AI使用统计详情', onClick: () => window.open('/ai-stats', '_blank') },
                      { key: 'achievements', icon: <TrophyOutlined />, label: '创作成就系统', onClick: () => window.open('/achievements', '_blank') },
                      { key: 'membership-benefits', icon: <FileTextOutlined />, label: '会员权益说明', onClick: () => window.open('/membership-benefits', '_blank') },
                      { 
                        key: 'team-management', 
                        icon: <TeamOutlined />, 
                        label: '团队管理', 
                        onClick: () => {
                          // 检查用户是否为专业会员，如果不是则显示升级提示
                          const { isProfessionalOrAdmin } = useMembershipStore.getState();
                          if (!isProfessionalOrAdmin()) {
                            Modal.confirm({
                              title: '功能受限',
                              content: '团队管理功能仅对专业会员开放，升级会员即可享受团队协作等高级功能。',
                              okText: '立即升级',
                              cancelText: '稍后再说',
                              onOk: () => {
                                window.open('/membership', '_blank');
                              }
                            });
                          } else {
                            window.open('/team-management', '_blank');
                          }
                        }
                      },

                      { type: 'divider' },
                      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
                    ],
                    onClick: async (item) => {
                      if (item.key === 'ai') {
                        searchParams.set('modal[settings]', 'llm');
                        setSearchParams(searchParams.toString());
                      } else if (item.key === 'logout') {
                        // 处理退出登录 - 使用真实的认证服务
                        try {
                          const { authToken } = useMembershipStore.getState();
                          if (authToken) {
                            await authService.logout(authToken);
                          }
                          
                          // 清除本地认证信息
                          useMembershipStore.getState().clearAuth();
                          
                          message.success('已退出登录');
                          navigateTo('/');
                        } catch (error) {
                          message.error('登出过程中发生错误');
                        }
                      } else if (item.key === 'ai-stats') {
                        window.open('/ai-stats', '_blank');
                      } else if (item.key === 'team-management') {
                        // 检查用户是否为专业会员，如果不是则显示升级提示
                        const { isProfessionalOrAdmin } = useMembershipStore.getState();
                        if (!isProfessionalOrAdmin()) {
                          Modal.confirm({
                            title: '功能受限',
                            content: '团队管理功能仅对专业会员开放，升级会员即可享受团队协作等高级功能。',
                            okText: '立即升级',
                            cancelText: '稍后再说',
                            onOk: () => {
                              window.open('/membership', '_blank');
                            }
                          });
                        } else {
                          window.open('/team-management', '_blank');
                        }
                      } else if (item.key === 'achievements') {
                        window.open('/achievements', '_blank');
                      } else if (item.key === 'membership-benefits') {
                        window.open('/membership-benefits', '_blank');
                      }
                      // 以下选项已在onClick中处理，无需额外操作
                      // profile, membership, subscription
                    }
                  }}
                >
                  <button className='p-0.5'>
                    <Avatar size={28} icon={<UserOutlined />} />
                  </button>
                </Dropdown>
              </div>
              
              {/* Help、Prompts 按钮 */}
              <div className="flex gap-1 flex-1">
                <Dropdown
                  placement="topLeft"
                  trigger={['click']}
                  menu={{
                    items: [
                      { key: 'open-help', label: '打开帮助窗口 (F1)', icon: <QuestionCircleOutlined />, onClick: () => window.open('/help-center', '_blank') },
                      { key: 'open-tip', label: '今日小贴士', icon: <BulbOutlined />, onClick: () => window.open('/help-center?tab=tips', '_blank') },
                      { type: 'divider' },
                      {
                        key: 'view-doc',
                        label: '查看文档',
                        icon: <FileTextOutlined />,
                        onClick: () => window.open('/help-center?tab=docs', '_blank')
                      },
                      {
                        key: 'chat-ai',
                        label: '与 AI 支持聊天',
                        icon: <RobotOutlined />,
                        onClick: () => window.open('/help-center?tab=ai-chat', '_blank')
                      },
                      {
                        key: 'feedback',
                        label: '反馈 / 路线图',
                        icon: <LikeOutlined />,
                        onClick: () => window.open('/help-center?tab=feedback', '_blank')
                      },
                      { type: 'divider' },
                      {
                        key: 'diagnostics',
                        label: '支持诊断',
                        icon: <ToolOutlined />,
                        onClick: () => window.open('/help-center?tab=diagnostics', '_blank')
                      },
                    ]
                  }}
                >
                  <Button type="text" className="flex items-center justify-start flex-1 text-sm py-1 px-2" icon={<QuestionCircleOutlined />}>
                    <span>帮助</span>
                  </Button>
                </Dropdown>
                <Button 
                  type="text" 
                  className="flex items-center justify-start flex-1 text-sm py-1 px-2" 
                  icon={<TagsOutlined />} 
                  style={{ marginLeft: 0 }} 
                  onClick={() => router.push(`/novels/${novelId}/prompts`)}
                >
                  提示词
                </Button>
              </div>
            </div>
            
            {/* Saved 按钮 */}
            <div className="flex gap-2 w-full mt-0.5 items-center">
              <div className="w-8"></div> {/* 占位符，与头像按钮宽度相同 */}
              <div className="flex gap-1 flex-1">
                <Tooltip placement='top' title={formatLastModified(novelInfo?.lastModified)}>
                  <Button type="text" className="flex items-center justify-start flex-1 text-sm py-1 px-2" icon={<BookOutlined />} style={{ marginLeft: 0 }}>已保存</Button>
                </Tooltip>
              </div>
            </div>
          </>
        ) : (
          // 收起状态恢复最初排序
          <div className="flex flex-col gap-2 items-center justify-end mt-auto">
            <Dropdown
              placement='topLeft'
              trigger={['click']}
              menu={{
                items: [
                  {
                    type: 'group',
                    key: 'user-info',
                    label: (
                      <div style={{ padding: 0 }}>
                        {trialDaysLeft !== null && (
                          <div style={{ background: '#fff7e6', color: '#d48806', borderRadius: '8px 8px 0 0', padding: '8px 16px', fontSize: 13, fontWeight: 500 }}>
                            试用期还剩{trialDaysLeft}天
                          </div>
                        )}
                        <div style={{ padding: '16px 16px 8px 16px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ fontWeight: 600, fontSize: 16 }}>{membershipInfo.username || '未知用户'}</div>
                          <div style={{ color: '#888', fontSize: 13 }}>{membershipInfo.email || '未知邮箱'}</div>
                        </div>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                          <span style={{ marginRight: 8 }}>主题:</span>
                          <Radio.Group value={layoutSettings.themeMode} onChange={(e) => setSettings({ ...layoutSettings, themeMode: e.target.value as 'light' | 'dark' })} size="small">
                            <Radio.Button value="light">🌞 浅色</Radio.Button>
                            <Radio.Button value="dark">🌙 深色</Radio.Button>
                          </Radio.Group>
                        </div>
                      </div>
                    ),
                  },
                  { type: 'divider' },
                  { key: 'ai', icon: <RobotOutlined />, label: 'AI 连接' },
                  // { key: 'settings', icon: <SettingOutlined />, label: '通用设置' },
                  // { key: 'teams', icon: <TeamOutlined />, label: '团队' },
                  // { key: 'shared', icon: <ShareAltOutlined />, label: '与我共享' },
                  { type: 'divider' },
                  // 重新排序菜单项，将常用功能放在前面
                  { key: 'profile', icon: <UserOutlined />, label: '个人资料', onClick: () => window.open('/profile', '_blank') },
                  { key: 'membership', icon: <CrownOutlined />, label: '会员中心', onClick: () => window.open('/membership', '_blank') },
                  { key: 'subscription', icon: <CreditCardOutlined />, label: '管理订阅', onClick: () => window.open('/membership', '_blank') },
                  { type: 'divider' },
                  // 启用并重新排序新功能选项，按照您的要求排序
                      { key: 'ai-stats', icon: <BarChartOutlined />, label: 'AI使用统计详情', onClick: () => window.open('/ai-stats', '_blank') },
                      { key: 'achievements', icon: <TrophyOutlined />, label: '创作成就系统', onClick: () => window.open('/achievements', '_blank') },
                      { key: 'membership-benefits', icon: <FileTextOutlined />, label: '会员权益说明', onClick: () => window.open('/membership-benefits', '_blank') },
                      { 
                        key: 'team-management', 
                        icon: <TeamOutlined />, 
                        label: '团队管理', 
                        onClick: () => {
                          // 检查用户是否为专业会员，如果不是则显示升级提示
                          const { isProfessionalOrAdmin } = useMembershipStore.getState();
                          if (!isProfessionalOrAdmin()) {
                            Modal.confirm({
                              title: '功能受限',
                              content: '团队管理功能仅对专业会员开放，升级会员即可享受团队协作等高级功能。',
                              okText: '立即升级',
                              cancelText: '稍后再说',
                              onOk: () => {
                                window.open('/membership', '_blank');
                              }
                            });
                          } else {
                            window.open('/team-management', '_blank');
                          }
                        }
                      },

                      { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
                ],
                onClick: async (item) => {
                  if (item.key === 'ai') {
                    searchParams.set('modal[settings]', 'llm');
                    setSearchParams(searchParams.toString());
                  } else if (item.key === 'logout') {
                    // 处理退出登录 - 使用真实的认证服务
                    try {
                      const { authToken } = useMembershipStore.getState();
                      if (authToken) {
                        await authService.logout(authToken);
                      }
                      
                      // 清除本地认证信息
                      useMembershipStore.getState().clearAuth();
                      
                      message.success('已退出登录');
                      navigateTo('/');
                    } catch (error) {
                      message.error('登出过程中发生错误');
                    }
                  } else if (item.key === 'ai-stats') {
                    window.open('/ai-stats', '_blank');
                  } else if (item.key === 'team-management') {
                        // 检查用户是否为专业会员，如果不是则显示升级提示
                        const { isProfessionalOrAdmin } = useMembershipStore.getState();
                        if (!isProfessionalOrAdmin()) {
                          Modal.confirm({
                            title: '功能受限',
                            content: '团队管理功能仅对专业会员开放，升级会员即可享受团队协作等高级功能。',
                            okText: '立即升级',
                            cancelText: '稍后再说',
                            onOk: () => {
                              window.open('/membership', '_blank');
                            }
                          });
                        } else {
                          window.open('/team-management', '_blank');
                        }
                      } else if (item.key === 'achievements') {
                        window.open('/achievements', '_blank');
                      } else if (item.key === 'membership-benefits') {
                        window.open('/membership-benefits', '_blank');
                      }
                      // 以下选项已在onClick中处理，无需额外操作
                      // profile, membership, subscription
                    }
                  }}
                >
                  <button className='p-1'>
                    <Avatar size={32} icon={<UserOutlined />} />
                  </button>
                </Dropdown>

            {/* Help 按钮及菜单 */}
            <Dropdown
              placement="topLeft"
              trigger={['click']}
              menu={{
                items: [
                  { key: 'open-help', label: '打开帮助窗口 (F1)', icon: <QuestionCircleOutlined />, onClick: () => window.open('/help-center', '_blank') },
                  { key: 'open-tip', label: '今日小贴士', icon: <BulbOutlined />, onClick: () => window.open('/help-center?tab=tips', '_blank') },
                  { type: 'divider' },
                  {
                    key: 'view-doc',
                    label: '查看文档',
                    icon: <FileTextOutlined />,
                    onClick: () => window.open('/help-center?tab=docs', '_blank')
                  },
                  {
                    key: 'chat-ai',
                    label: '与 AI 支持聊天',
                    icon: <RobotOutlined />,
                    onClick: () => window.open('/help-center?tab=ai-chat', '_blank')
                  },
                  {
                    key: 'feedback',
                    label: '反馈 / 路线图',
                    icon: <LikeOutlined />,
                    onClick: () => window.open('/help-center?tab=feedback', '_blank')
                  },
                  { type: 'divider' },
                  {
                    key: 'diagnostics',
                    label: '支持诊断',
                    icon: <ToolOutlined />,
                    onClick: () => window.open('/help-center?tab=diagnostics', '_blank')
                  },
                ]
              }}
            >
              <Button type="text" icon={<QuestionCircleOutlined />}>
                <span>帮助</span>
              </Button>
            </Dropdown>
            {/* Prompts、Saved 按钮 */}
            <Button 
              type="text" 
              icon={<TagsOutlined />} 
              style={{ marginLeft: 4 }} 
              onClick={() => router.push(`/novels/${novelId}/prompts`)}
            >
              提示词
            </Button>
            <Tooltip placement='right' title={formatLastModified(novelInfo?.lastModified)}>
              <Button type="text" icon={<BookOutlined />} style={{ marginLeft: 4 }}>已保存</Button>
            </Tooltip>
          </div>
        )}
      </footer>

    </aside>
  );
};


// 提取SidebarTabList组件到顶层作用域
const SidebarTabList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sidebarActive = searchParams.get('sidebar') || 'characters';


  if (sidebarActive === 'hidden') {
    return (
      <div className='flex flex-col gap-1 px-1 py-2'>
        {tabsItems.map((item) => (
          <Tooltip key={item.key} title={item.label} placement="right">
            <button 
              className={classNames(
                "flex items-center justify-center p-3 rounded-lg transition-all duration-200 ease-in-out",
                {
                  "bg-blue-100 text-blue-600 shadow-inner": sidebarActive === item.key,
                  "hover:bg-gray-100": sidebarActive !== item.key
                }
              )}
              onClick={() => {
                searchParams.set('sidebar', item.key);
                setSearchParams(searchParams.toString());
              }}
            >
              <div className='text-lg'>
                {item.icon}
              </div>
            </button>
          </Tooltip>
        ))}
      </div>
    );
  } else {
    return (
      <div className='text-secondary shrink-0 border-b shadow-sm overflow-x-auto px-3 py-2 scrollbar-thin flex-none'>
        <div className='flex gap-1 w-[256px]'>
          {
            tabsItems.map((item) => (
              <button 
                key={item.key} 
                className={classNames(
                  "cursor-pointer outline-none group whitespace-nowrap border-b-2 border-transparent px-2 py-2 rounded-t-lg transition-all duration-200 ease-in-out flex-1 min-w-0",
                  {
                    "sidebar-tab-active border-blue-500 text-blue-600 bg-blue-50 shadow-sm": sidebarActive === item.key,
                    "hover:bg-gray-100": sidebarActive !== item.key
                  }
                )}
                onClick={() => {
                  searchParams.set('sidebar', item.key);
                  setSearchParams(searchParams.toString());
                }}
              >
                <div className="flex items-center gap-2 justify-center">
                  <div className="text-base">
                    {item.icon}
                  </div>
                  <div className="font-medium truncate text-xs">{item.label}</div>
                </div>
              </button>
            ))
          }
        </div>
      </div>
    );
  };
}


export default Sidebar;