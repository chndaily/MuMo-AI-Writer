import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMembershipStore } from '@/stores/membershipStore';
import { realAuthService } from '@/services/realAuthService';

interface RouteGuardProps {
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, authToken, setMembershipInfo, setIsAuthenticated, setAuthToken, clearAuth, isProfessionalOrAdmin, isAdmin } = useMembershipStore();
  const [isLoading, setIsLoading] = useState(true);

  // 将 useCallback 移到组件顶层
  const checkAuth = useCallback(async () => {
    // 如果有认证token，验证其有效性
    if (authToken) {
      try {
        const response = await realAuthService.verifyToken(authToken);
        
        if (response.success && response.user) {
          // token有效，更新用户信息
          setIsAuthenticated(true);
          setMembershipInfo({
            ...response.user.membershipInfo,
            username: response.user.username,
            email: response.user.email
          });
        } else {
          // token无效，清除认证信息
          clearAuth();
        }
      } catch (error) {
        // 验证失败，清除认证信息
        clearAuth();
      }
    }
    
    setIsLoading(false);
  }, [authToken, setIsAuthenticated, setMembershipInfo, clearAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    // 检查是否是允许无需登录访问的页面
    const publicPaths = ['/', '/login', '/creation-center'];
    const isPublicPath = publicPaths.includes(location.pathname);
    
    // 检查用户是否已登录（通过认证状态判断）
    const isLoggedIn = isAuthenticated;
    
    // 检查特殊页面的访问权限
    const llmConfigPaths = ['/llm-config'];
    const databaseConfigPaths = ['/config/supabase', '/config/payment', '/config/users', '/config/novels', '/sync-config'];
    
    const isLLMConfigPath = llmConfigPaths.includes(location.pathname);
    const isDatabaseConfigPath = databaseConfigPaths.includes(location.pathname);
    
    // 如果不是公共路径且用户未登录，重定向到登录页
    if (!isPublicPath && !isLoggedIn) {
      navigate('/login');
      return;
    }
    
    // 检查LLM配置页面访问权限（仅专业会员或管理员可访问）
    if (isLLMConfigPath && !isProfessionalOrAdmin()) {
      navigate('/');
      return;
    }
    
    // 检查数据库配置页面访问权限（仅管理员可访问）
    if (isDatabaseConfigPath && !isAdmin()) {
      navigate('/');
      return;
    }
  }, [location, navigate, isAuthenticated, isLoading, isProfessionalOrAdmin, isAdmin]);

  if (isLoading) {
    return <div>验证中...</div>;
  }

  return <>{children}</>;
};

export default RouteGuard;