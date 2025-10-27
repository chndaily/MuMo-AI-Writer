import { Button, Dropdown, Radio, Tooltip, message } from "antd";
import { CaretDownOutlined, SaveOutlined, EyeOutlined, SoundOutlined, UploadOutlined, DownloadOutlined, FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons";
import AlIcon from "@/components/icon/AlIcon";
import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { createStyles } from "antd-style";
import { useRouter } from "@/router/hooks";

type NavKeysType = 'storyboard' | 'manuscript' | 'visualization' | 'chat' | 'review' | 'settings' | 'prompts';
const navList: { key: NavKeysType, label: string, icon: React.ReactNode }[] = [
  {
    key: 'storyboard',
    label: '大纲',
    icon: <AlIcon icon='fanshu' />
  },
  {
    key: 'manuscript',
    label: '创作',
    icon: <AlIcon icon='yumaobi' />
  },
  {
    key: 'visualization',
    label: '关系网',
    icon: <AlIcon icon='view' />
  },
  {
    key: 'chat',
    label: '聊天',
    icon: <AlIcon icon='talk-s' />
  },
  {
    key: 'review',
    label: '回顾',
    icon: <AlIcon icon='preview' />
  },
  {
    key: 'prompts',
    label: '提示词',
    icon: <AlIcon icon='setting' />
  },
  {
    key: 'settings',
    label: '设置',
    icon: <AlIcon icon='setting' />
  }
]

const MainNavigation = () => {
  const routeInfo = useLocation();
  const router = useRouter();
  const currentNav = useMemo(() => {
    return navList.find(d => d.key === routeInfo.pathname.split('/')[3]);
  }, [routeInfo]);

  const handleNavSelect = (key: NavKeysType) => {
    switch (key) {
      case 'storyboard':
        router.novel('storyboard');
        break;
      case 'manuscript':
        router.novel('manuscript');
        break;
      case 'visualization':
        router.novel('visualization');
        break;
      case 'chat':
        router.novel('chat');
        break;
      case 'review':
        router.novel('review');
        break;
      case 'prompts':
        router.novel('prompts');
        break;
      case 'settings':
        router.novel('settings');
        break;
    }
  };

  // 获取当前选中项的标签
  const getCurrentLabel = () => {
    const item = navList.find(item => item.key === currentNav?.key);
    return item ? item.label : '菜单';
  };

  // 获取当前选中项的图标
  const getCurrentIcon = () => {
    const item = navList.find(item => item.key === currentNav?.key);
    return item ? item.icon : undefined;
  };

  return (
    <>
      {/* 小屏幕下拉菜单 */}
      <div className="flex justify-center shrink-0 self-center @4xl:hidden">
        <Dropdown 
          trigger={['click']} 
          menu={{
            items: navList.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label
            })),
            selectedKeys: [currentNav?.key || ''],
            onClick: (e) => {
              handleNavSelect(e.key as NavKeysType);
            }
          }}
          placement="bottom"
        >
          <Button 
            shape="round" 
            variant="outlined" 
            icon={getCurrentIcon()} 
            onClick={(e) => e.stopPropagation()}
          >
            {getCurrentLabel()} <CaretDownOutlined />
          </Button>
        </Dropdown>
      </div>
      
      {/* 大屏幕横向按钮 */}
      <div className="hidden self-center @4xl:flex">
        <Radio.Group 
          buttonStyle="solid" 
          value={currentNav?.key || ''}
          optionType="button"
          className="flex"
        >
          {navList.slice(0, 5).map((item) => (
            <Radio.Button 
              key={item.key} 
              value={item.key} 
              className="flex items-center"
              onClick={() => handleNavSelect(item.key)}
            >
              <span className="flex items-center px-3 py-2">
                {item.icon} <span className="ml-2">{item.label}</span>
              </span>
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
    </>
  );
};

const TopNav = () => {
  const { styles } = useStyles()
  const routeInfo = useLocation();
  const navigate = useNavigate();
  const router = useRouter()
  // 当前导航
  const currentNav = useMemo(() => {
    return navList.find(d => d.key === routeInfo.pathname.split('/')[3]);
  }, [routeInfo]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        message.error(`无法进入全屏模式: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // 右侧工具栏排除 'review' | 'settings'
  const RightView: Record<NavKeysType, React.ReactNode> = {
    storyboard: <StoryboardTool />,
    manuscript: <ManuscriptTool />,
    visualization: undefined,
    chat: <ChatTool />,
    review: undefined,
    prompts: undefined,
    settings: undefined,
  }

  return (
    <div className={'h-14 flex-none flex dark:shadow-md shadow z-30 overflow-x-auto min-w-0 contain-strict ' + styles}>
      {/* 顶部导航栏左侧 */}
      <div className='flex @4xl:w-96 border-r'>
        <MainNavigation />
      </div>
      {/* 顶部导航栏右侧 */}
      <div className='shrink-0 grow flex'>
        <div className='@container grow w-full flex'>
          <div className='grow px-3 whitespace-nowrap flex gap-3 @lg:gap-4 py-2 items-center justify-between'>
            <div>
              {(!!currentNav && !!RightView[currentNav.key]) && RightView[currentNav.key]}
            </div>
            <div className="flex items-center gap-2">
              {currentNav?.key === 'manuscript' && (
                <>
                  <Tooltip title="保存 (Ctrl+S)">
                    <Button type="primary" icon={<SaveOutlined />} size="small" onClick={() => window.dispatchEvent(new CustomEvent('manuscript-save'))} />
                  </Tooltip>
                  <Tooltip title="预览">
                    <Button icon={<EyeOutlined />} size="small" onClick={() => window.dispatchEvent(new CustomEvent('manuscript-preview'))} />
                  </Tooltip>
                  <Tooltip title="朗读">
                    <Button icon={<SoundOutlined />} size="small" onClick={() => window.dispatchEvent(new CustomEvent('manuscript-read'))} />
                  </Tooltip>
                  <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
                    <Button 
                      icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
                      size="small" 
                      onClick={() => window.dispatchEvent(new CustomEvent('manuscript-fullscreen'))} 
                    />
                  </Tooltip>
                </>
              )}
              {currentNav?.key === 'storyboard' && (
                <>
                  <Tooltip title="AI辅助生成">
                    <Button type="primary" icon={<AlIcon icon='mofa' />} size="small" onClick={() => window.dispatchEvent(new CustomEvent('storyboard-ai-generate'))}>AI生成</Button>
                  </Tooltip>
                  <Tooltip title="导出大纲">
                    <Button icon={<UploadOutlined />} size="small" onClick={() => window.dispatchEvent(new CustomEvent('storyboard-export'))} />
                  </Tooltip>
                  <Tooltip title="导入大纲">
                    <Button icon={<DownloadOutlined />} size="small" onClick={() => window.dispatchEvent(new CustomEvent('storyboard-import'))} />
                  </Tooltip>
                  <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
                    <Button 
                      icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
                      size="small" 
                      onClick={toggleFullscreen} 
                    />
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const StoryboardTool = () => {
  // 计划排版
  const [planType, setPlanType] = useState('elastic');
  const typeMenu = [
    {
      key: 'elastic',
      label: '弹性',
      icon: <AlIcon icon='grid-add' />
    },
    {
      key: 'grid',
      label: '栅格',
      icon: <AlIcon icon='viewList' />
    },
    {
      key: 'tree',
      label: '树形',
      icon: <AlIcon icon='dagang' />
    }
  ]

  // 通知故事板组件视图模式变化
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('storyboard-view-change', { detail: planType }));
  }, [planType]);

  // 获取当前选中项的标签
  const getCurrentLabel = () => {
    const item = typeMenu.find(item => item.key === planType);
    return item ? item.label : '弹性';
  };

  // 获取当前选中项的图标
  const getCurrentIcon = () => {
    const item = typeMenu.find(item => item.key === planType);
    return item ? item.icon : <AlIcon icon='grid-add' />;
  };

  return (
    <>
      {/* 小屏幕下拉菜单 */}
      <div className="flex justify-center shrink-0 self-center lg:hidden">
        <Dropdown 
          trigger={['click']} 
          menu={{
            items: typeMenu.map(item => ({
              key: item.key,
              label: (
                <span className="flex items-center">
                  {item.icon} <span className="ml-2">{item.label}</span>
                </span>
              )
            })),
            selectedKeys: [planType],
            onClick: (e) => {
              setPlanType(e.key);
            }
          }}
          placement="bottom"
        >
          <Button 
            shape="round" 
            variant="outlined" 
            icon={getCurrentIcon()} 
            onClick={(e) => e.stopPropagation()}
          >
            {getCurrentLabel()} <CaretDownOutlined />
          </Button>
        </Dropdown>
      </div>
      
      {/* 大屏幕横向按钮 */}
      <div className="hidden flex-none self-center lg:flex">
        <Radio.Group 
          buttonStyle="solid" 
          value={planType} 
          onChange={(e) => setPlanType(e.target.value)}
          optionType="button"
          className="flex"
        >
          {typeMenu.map((item) => (
            <Radio.Button key={item.key} value={item.key} className="flex items-center">
              <span className="flex items-center px-3 py-2">
                {item.icon} <span className="ml-2">{item.label}</span>
              </span>
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
    </>
  );
}

const ManuscriptTool = () => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">字数: 0</span>
      <span className="text-sm">最后保存: 未保存</span>
    </div>
  );
}

const ChatTool = () => {
  return <div>聊天</div>
}

const useStyles = createStyles(({ css }) => (
  css`
    .ant-radio-button-wrapper:first-child {
      border-start-start-radius: 32px;
      border-end-start-radius: 32px;
    }
    .ant-radio-button-wrapper:last-child {
      border-start-end-radius: 32px;
      border-end-end-radius: 32px;
    }
  `
))

export default TopNav;