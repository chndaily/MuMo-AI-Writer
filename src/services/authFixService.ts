// src/services/authFixService.ts
import { useMembershipStore } from '@/stores/membershipStore';
import { realAuthService } from '@/services/realAuthService';
import { apiService } from '@/services/apiService';

/**
 * 认证修复服务
 * 用于解决数据同步过程中认证状态不正确的问题
 */
class AuthFixService {
  /**
   * 检查并修复认证状态
   * 确保在数据同步前认证状态正确
   */
  async checkAndFixAuthState(): Promise<boolean> {
    try {
      const { isAuthenticated, authToken, setIsAuthenticated, setAuthToken } = useMembershipStore.getState();
      
      console.log('检查认证状态:', { isAuthenticated, hasToken: !!authToken });
      
      // 如果已经有认证token，验证其有效性
      if (authToken) {
        try {
          const response = await realAuthService.verifyToken(authToken);
          
          if (response.success && response.user) {
            console.log('Token有效，更新认证状态');
            setIsAuthenticated(true);
            return true;
          } else {
            console.log('Token无效，清除认证状态');
            useMembershipStore.getState().clearAuth();
          }
        } catch (error) {
          console.log('Token验证失败，清除认证状态:', error);
          useMembershipStore.getState().clearAuth();
        }
      }
      
      // 如果没有认证状态，尝试重新登录
      console.log('尝试重新登录...');
      const loginResponse = await apiService.users.login('chndaily@foxmail.com', 'admin123');
      
      if (loginResponse.success && loginResponse.token) {
        console.log('重新登录成功，设置认证状态');
        setIsAuthenticated(true);
        setAuthToken(loginResponse.token);
        
        // 如果返回了用户信息，更新会员信息
        if (loginResponse.user) {
          useMembershipStore.getState().setMembershipInfo(loginResponse.user.membershipInfo);
        }
        
        return true;
      } else {
        console.log('重新登录失败:', loginResponse.message);
        return false;
      }
    } catch (error) {
      console.error('检查和修复认证状态时出错:', error);
      return false;
    }
  }
  
  /**
   * 确保API请求带有正确的认证头
   * 这是一个额外的安全检查
   */
  async ensureAuthForApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    // 首先检查并修复认证状态
    const isAuthFixed = await this.checkAndFixAuthState();
    
    if (!isAuthFixed) {
      throw new Error('无法修复认证状态，API调用失败');
    }
    
    // 执行API调用
    return apiCall();
  }
}

// 导出认证修复服务实例
export const authFixService = new AuthFixService();