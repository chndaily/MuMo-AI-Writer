import React, { useState, useEffect } from 'react'
import { Layout, message, Modal } from 'antd'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import AppHeader from './components/common/AppHeader'
import AppSider from './components/common/AppSider'
import { AppLoader } from './components/common/AppLoader'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import AINovelWorkspace from './pages/AINovelWorkspace/AINovelWorkspace'
import { LLMConfigPage } from './pages/LLMConfig/LLMConfigPage'
import { AITestPage } from './pages/LLMConfig/AITestPage'
import SupabaseConfig from './pages/AdminConfig/SupabaseConfig'
import PaymentConfig from './pages/AdminConfig/PaymentConfig'
import UserManagement from './pages/AdminConfig/UserManagement'
import NovelManagementPage from './pages/AdminConfig/NovelManagement'
import SyncConfigPage from './pages/SyncConfigPage'
import NovelListIndexDB from './pages/NovelListIndexDB'
import NovelsIndex from './pages/Novels'
import HomePage from './pages/HomePage'
import { usePromptLibraryStore } from './stores/promptLibraryStore'
import NovelSettingsPage from './pages/NovelWorkspace/settings'
import NovelPromptsPage from './pages/NovelWorkspace/prompts/index'
import NovelPromptsLayout from './pages/NovelWorkspace/prompts/NovelPromptsLayout'
import { useSupabaseConfigStore } from './stores/supabaseConfigStore'
import NewPromptLibraryHome from './pages/PromptLibrary/NewHome'
import CollectionDetail from './pages/PromptLibrary/Detail'
import PromptsLayout from './pages/PromptLibrary/layout/index'
import { useAIServiceStore } from './stores/aiServiceStore'
import ConditionalHomePage from './pages/ConditionalHomePage'
import MembershipCenter from './pages/MembershipCenter'
import MembershipDemo from './pages/MembershipDemo'
import AIStatsPage from './pages/MembershipFeatures/AIStatsPage'
import AchievementsPage from './pages/MembershipFeatures/AchievementsPage'
import MembershipBenefitsPage from './pages/MembershipFeatures/MembershipBenefitsPage'
import TeamManagementPage from './pages/MembershipFeatures/TeamManagementPage'
import HelpCenterPage from './pages/HelpCenter/HelpCenterPage'
import ProfilePageSimple from './pages/ProfilePageSimple'
import RouteGuard from './components/common/RouteGuard'
import { Collection } from '#/promptLibrary'
import NovelLayout from './pages/NovelWorkspace/layout'
import ManuscriptEditor from './pages/NovelWorkspace/modules/ManuscriptEditor'
import VisualizationPage from './pages/NovelWorkspace/visualization'
import NovelChat from './pages/NovelWorkspace/chat/index'
import NovelReview from './pages/NovelWorkspace/review/index'
import NovelStoryboard from './pages/NovelWorkspace/storyboard' // 新增导入
import EmailVerificationPage from './pages/EmailVerificationPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

const { Content } = Layout

// 创建包装组件来传递 novelId 参数
const NovelSettingsPageWrapper: React.FC = () => {
  const { novelId } = useParams<{ novelId: string }>();
  return <NovelSettingsPage novelId={novelId} />;
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const { config: supabaseConfig, initializeSupabase } = useSupabaseConfigStore()
  const { collections, initialize } = usePromptLibraryStore();
  const { startAutoRefresh, stopAutoRefresh } = useAIServiceStore();

  const CollectionDetailWithProps: React.FC<{ promptId?: string }> = ({ promptId }) => {
    const selectedCollection = collections.find(d => d.id === promptId);
    return <CollectionDetail collection={selectedCollection as Collection} />;
  };

  useEffect(() => {
    const checkInitialization = async () => {
      try {
        // 初始化提示词库数据
        await initialize();
        
        // 如果有Supabase配置且已启用，初始化Supabase
        if (supabaseConfig?.enabled) {
          await initializeSupabase()
        }

        setIsInitialized(true)
      } catch (error) {
        console.error('应用初始化失败:', error)
        setInitError(error instanceof Error ? error.message : '初始化失败')
        // 即使初始化失败，也显示主界面，避免用户看到空白页面
        setIsInitialized(true)
      }
    }

    // 设置超时机制，避免无限等待
    const timeoutId = setTimeout(() => {
      console.warn('应用初始化超时，直接显示主界面')
      setIsInitialized(true)
    }, 10000); // 10秒超时

    checkInitialization().finally(() => {
      clearTimeout(timeoutId)
    })

    // 启动自动刷新模型功能
    startAutoRefresh();

    // 清理函数
    return () => {
      clearTimeout(timeoutId)
      // 停止自动刷新
      stopAutoRefresh();
    }
  }, [supabaseConfig, initialize, startAutoRefresh, stopAutoRefresh])

  // 如果还在初始化中，显示加载界面
  if (!isInitialized) {
    return <AppLoader message="木墨文坊加载中..." />
  }

  // 如果初始化失败，显示错误信息
  if (initError) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        color: '#ff4d4f',
        textAlign: 'center',
        padding: '20px',
      }}>
        <div>
          <h2>应用初始化失败</h2>
          <p>请刷新页面重试，或检查浏览器是否支持IndexDB</p>
          <p style={{ fontSize: '12px', color: '#999' }}>错误信息: {initError}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }
  
  const DefaultLayout = () => {
    return (
      <RouteGuard>
        <Layout style={{ minHeight: '100vh' }}>
          <AppHeader />
          <Layout>
            <AppSider />
            <Content style={{ margin: '0 16px' }}>
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </RouteGuard>
    )
  }

  return (
    <Router>
      <Routes>
        {/* 不需要登录就可以访问的页面 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* 不需要登录就可以访问的页面 */}
        <Route index element={<ConditionalHomePage />} />
        
        {/* 需要登录才能访问的页面 */}
        <Route element={<DefaultLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/ai-workspace" element={<AINovelWorkspace />} />
          <Route path="/llm-config" element={<LLMConfigPage />} />
          <Route path="/ai-test" element={<AITestPage />} />
          <Route path="/config/supabase" element={<SupabaseConfig />} />
          <Route path="/config/payment" element={<PaymentConfig />} />
          <Route path="/config/users" element={<UserManagement />} />
          <Route path="/config/novels" element={<NovelManagementPage />} />
          <Route path="/sync-config" element={<SyncConfigPage />} />
          <Route path="/novels" element={<NovelListIndexDB />} />
          <Route path="/creation-center" element={<NovelsIndex />} />
          <Route path="/home" element={<HomePage />} />
          {/* 会员中心路由 */}
          <Route path="/membership" element={<MembershipCenter />} />
          {/* 会员体系演示路由 */}
          <Route path="/membership-demo" element={<MembershipDemo />} />
          {/* AI统计页面路由 */}
          <Route path="/ai-stats" element={<AIStatsPage />} />
          {/* 创作成就系统路由 */}
          <Route path="/achievements" element={<AchievementsPage />} />
          {/* 会员权益说明路由 */}
          <Route path="/membership-benefits" element={<MembershipBenefitsPage />} />
          {/* 团队管理路由 */}
          <Route path="/team-management" element={<TeamManagementPage />} />
          {/* 帮助中心路由 */}
          <Route path="/help-center" element={<HelpCenterPage />} />
          {/* 会员集成演示路由 */}
          
          <Route path="/profile-simple" element={<ProfilePageSimple />} />
          {/* 将提示词库路由移到默认布局下 */}
          <Route path="/prompts/*" element={<PromptsLayout />}>
            <Route index element={<NewPromptLibraryHome />} />
            <Route path=":promptId" element={<CollectionDetailWithProps />} />
          </Route>
        </Route>
        <Route path="/novels/:novelId" element={<NovelLayout />} >
          <Route index element={<Navigate to="manuscript" />} />
          <Route path="manuscript" element={<ManuscriptEditor />} />
          <Route path="manuscript/:chapterId" element={<ManuscriptEditor />} />
          <Route path="visualization" element={<VisualizationPage />} />
          <Route path="visualization/*" element={<VisualizationPage />} />
          <Route path="chat" element={<NovelChat />} />
          <Route path="review" element={<NovelReview />} /> {/* 新增回顾页面路由 */}
          <Route path="settings" element={<NovelSettingsPageWrapper />} /> {/* 新增设置页面路由 */}
          <Route path="prompts" element={<NovelPromptsPage />} /> {/* 新增提示词库页面路由 */}
          <Route path="prompts/library" element={<NovelPromptsLayout />} /> {/* 新增小说特定提示词库布局路由 */}
          <Route path="prompts/library/*" element={<NovelPromptsLayout />} /> {/* 新增小说特定提示词库布局路由 */}
          <Route path="prompts/:promptId" element={<NovelPromptsLayout />} /> {/* 新增小说特定提示词详情路由 */}
          <Route path="storyboard" element={<NovelStoryboard />} /> {/* 新增大纲页面路由 */}
        </Route>
      </Routes>
    </Router>
  )
}

export default App