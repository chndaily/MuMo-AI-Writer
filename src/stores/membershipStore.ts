import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 会员等级枚举
export enum MembershipLevel {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional'
}

// 会员信息接口
export interface MembershipInfo {
  level: MembershipLevel
  expiryDate: Date | null
  maxNovels: number
  aiGenerationLimit: number
  aiGenerationUsed: number
  features: string[]
  // 团队功能相关
  teamEnabled: boolean
  maxTeamMembers: number
  // 管理员标识
  isAdmin?: boolean
  // 用户信息
  username?: string
  email?: string
}

// 会员状态接口
interface MembershipState {
  membershipInfo: MembershipInfo
  // 添加认证状态字段
  isAuthenticated: boolean
  // 添加用户token
  authToken: string | null
}

// 会员操作接口
interface MembershipActions {
  // 设置会员信息
  setMembershipInfo: (info: MembershipInfo) => void
  // 升级会员等级
  upgradeMembership: (level: MembershipLevel, expiryDate: Date) => void
  // 使用AI生成次数
  useAIGeneration: () => boolean
  // 重置AI生成次数（每日）
  resetAIGeneration: () => void
  // 检查是否有特定功能权限
  hasFeature: (feature: string) => boolean
  // 检查是否可以创建更多小说
  canCreateMoreNovels: (currentNovelCount: number) => boolean
  // 检查是否为管理员
  isAdmin: () => boolean
  // 检查是否为专业会员或管理员
  isProfessionalOrAdmin: () => boolean
  // 设置认证状态
  setIsAuthenticated: (isAuthenticated: boolean) => void
  // 设置认证token
  setAuthToken: (token: string | null) => void
  // 清除认证信息
  clearAuth: () => void
}

// 默认免费会员信息
const defaultFreeMembership: MembershipInfo = {
  level: MembershipLevel.FREE,
  expiryDate: null,
  maxNovels: 3,
  aiGenerationLimit: 10,
  aiGenerationUsed: 0,
  features: [
    'novel_creation',
    'basic_editing',
    'txt_export',
    'markdown_export'
  ],
  teamEnabled: false,
  maxTeamMembers: 0,
  isAdmin: false // 添加默认的管理员标志
}

export const useMembershipStore = create<MembershipState & MembershipActions>()(
  persist(
    (set, get) => ({
      membershipInfo: defaultFreeMembership,
      isAuthenticated: false, // 默认未认证
      authToken: null, // 默认无认证token
      
      setMembershipInfo: (info) => {
        // 确保处理null值
        const processedInfo: MembershipInfo = {
          ...info,
          maxNovels: info.maxNovels === null || info.maxNovels === undefined ? 
            (info.level === MembershipLevel.PROFESSIONAL ? Infinity : 
             info.level === MembershipLevel.BASIC ? 10 : 3) : 
            info.maxNovels,
          aiGenerationLimit: info.aiGenerationLimit === null || info.aiGenerationLimit === undefined ? 
            (info.level === MembershipLevel.PROFESSIONAL ? Infinity : 
             info.level === MembershipLevel.BASIC ? 100 : 10) : 
            info.aiGenerationLimit,
          isAdmin: info.isAdmin ?? false
        };
        set({ membershipInfo: processedInfo });
      },
      
      setIsAuthenticated: (isAuthenticated) => {
        set({ isAuthenticated });
      },
      
      setAuthToken: (authToken) => {
        set({ authToken });
      },
      
      clearAuth: () => {
        set({ 
          isAuthenticated: false, 
          authToken: null,
          membershipInfo: defaultFreeMembership
        });
      },
      
      upgradeMembership: (level, expiryDate) => set((state) => {
        let features = [...defaultFreeMembership.features]
        let maxNovels = defaultFreeMembership.maxNovels
        let aiGenerationLimit = defaultFreeMembership.aiGenerationLimit
        let teamEnabled = false
        let maxTeamMembers = 0
        
        switch (level) {
          case MembershipLevel.BASIC:
            features = [
              ...features,
              'enhanced_ai_generation',
              'all_export_formats',
              'spell_check',
              'writing_statistics',
              'basic_cloud_sync'
            ]
            maxNovels = 10
            aiGenerationLimit = 100
            break
            
          case MembershipLevel.PROFESSIONAL:
            features = [
              ...features,
              'unlimited_novels',
              'unlimited_ai_generation',
              'visualization_tools',
              'advanced_export',
              'full_cloud_sync',
              'priority_support',
              'early_access',
              'team_collaboration'
            ]
            maxNovels = Infinity
            aiGenerationLimit = Infinity
            teamEnabled = true
            maxTeamMembers = 10
            break
        }
        
        return {
          membershipInfo: {
            ...state.membershipInfo,
            level,
            expiryDate,
            maxNovels,
            aiGenerationLimit,
            features,
            teamEnabled,
            maxTeamMembers
          }
        }
      }),
      
      useAIGeneration: () => {
        const { membershipInfo } = get()
        // 检查是否为无限使用权限（专业会员或管理员）
        if (membershipInfo.aiGenerationLimit === Infinity || membershipInfo.isAdmin) {
          // 无限使用权限，直接返回成功
          return true
        }
        
        // 检查是否还有剩余次数
        if (membershipInfo.aiGenerationUsed < membershipInfo.aiGenerationLimit) {
          set((state) => ({
            membershipInfo: {
              ...state.membershipInfo,
              aiGenerationUsed: state.membershipInfo.aiGenerationUsed + 1
            }
          }))
          return true
        }
        
        // 没有剩余次数
        return false
      },
      
      resetAIGeneration: () => set((state) => ({
        membershipInfo: {
          ...state.membershipInfo,
          aiGenerationUsed: 0
        }
      })),
      
      hasFeature: (feature) => {
        const { membershipInfo } = get()
        return membershipInfo.features.includes(feature)
      },
      
      canCreateMoreNovels: (currentNovelCount) => {
        const { membershipInfo } = get()
        return currentNovelCount < membershipInfo.maxNovels
      },
      
      isAdmin: () => {
        const { membershipInfo } = get()
        return membershipInfo.isAdmin === true
      },
      
      isProfessionalOrAdmin: () => {
        const { membershipInfo } = get()
        return membershipInfo.isAdmin === true || membershipInfo.level === MembershipLevel.PROFESSIONAL
      }
    }),
    {
      name: 'membership-storage',
      partialize: (state) => ({ 
        membershipInfo: state.membershipInfo,
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken
      }),
    }
  )
)