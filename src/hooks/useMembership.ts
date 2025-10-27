import { useMembershipStore, MembershipLevel } from '@/stores/membershipStore'

// 功能权限映射
const FEATURE_PERMISSIONS: Record<string, MembershipLevel[]> = {
  // 基础功能（所有用户都有）
  'novel_creation': [MembershipLevel.FREE, MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  'basic_editing': [MembershipLevel.FREE, MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  'txt_export': [MembershipLevel.FREE, MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  'markdown_export': [MembershipLevel.FREE, MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  
  // 基础会员功能
  'unlimited_novels': [MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  'enhanced_ai_generation': [MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  'all_export_formats': [MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  'spell_check': [MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  'writing_statistics': [MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  'basic_cloud_sync': [MembershipLevel.BASIC, MembershipLevel.PROFESSIONAL],
  
  // 专业会员功能
  'unlimited_ai_generation': [MembershipLevel.PROFESSIONAL],
  'visualization_tools': [MembershipLevel.PROFESSIONAL],
  'advanced_export': [MembershipLevel.PROFESSIONAL],
  'full_cloud_sync': [MembershipLevel.PROFESSIONAL],
  'priority_support': [MembershipLevel.PROFESSIONAL],
  'early_access': [MembershipLevel.PROFESSIONAL],
  'team_collaboration': [MembershipLevel.PROFESSIONAL],
}

// 权限控制Hook
export const useMembership = () => {
  const { membershipInfo, hasFeature, canCreateMoreNovels, useAIGeneration } = useMembershipStore()
  
  // 检查是否有特定功能权限
  const checkPermission = (feature: string): boolean => {
    // 如果功能不在权限映射中，默认允许访问
    if (!FEATURE_PERMISSIONS[feature]) {
      return true
    }
    
    // 检查当前会员等级是否在功能允许的等级列表中
    return FEATURE_PERMISSIONS[feature].includes(membershipInfo.level)
  }
  
  // 检查AI生成权限
  const checkAIGenerationPermission = (): { allowed: boolean; reason?: string } => {
    // 检查是否超出每日限制
    if (membershipInfo.aiGenerationUsed >= membershipInfo.aiGenerationLimit) {
      return { 
        allowed: false, 
        reason: `AI生成次数已用完 (${membershipInfo.aiGenerationUsed}/${membershipInfo.aiGenerationLimit})` 
      }
    }
    
    return { allowed: true }
  }
  
  // 使用AI生成功能
  const useAI = (): { success: boolean; reason?: string } => {
    const permission = checkAIGenerationPermission()
    if (!permission.allowed) {
      return { success: false, reason: permission.reason }
    }
    
    const success = useAIGeneration()
    if (!success) {
      return { success: false, reason: '无法使用AI生成功能' }
    }
    
    return { success: true }
  }
  
  // 获取升级建议
  const getUpgradeSuggestion = (feature: string): MembershipLevel | null => {
    // 如果用户已有权限，不需要升级建议
    if (checkPermission(feature)) {
      return null
    }
    
    // 根据功能需求确定最低会员等级
    const requiredLevels = FEATURE_PERMISSIONS[feature] || []
    
    // 优先推荐专业会员（功能最全）
    if (requiredLevels.includes(MembershipLevel.PROFESSIONAL)) {
      return MembershipLevel.PROFESSIONAL
    }
    
    // 其次推荐基础会员
    if (requiredLevels.includes(MembershipLevel.BASIC)) {
      return MembershipLevel.BASIC
    }
    
    return null
  }
  
  return {
    // 当前会员信息
    membershipInfo,
    
    // 权限检查方法
    checkPermission,
    checkAIGenerationPermission,
    hasFeature,
    canCreateMoreNovels,
    
    // AI使用方法
    useAI,
    
    // 升级建议
    getUpgradeSuggestion,
    
    // 便捷属性
    isFree: membershipInfo.level === MembershipLevel.FREE,
    isBasic: membershipInfo.level === MembershipLevel.BASIC,
    isProfessional: membershipInfo.level === MembershipLevel.PROFESSIONAL,
    teamEnabled: membershipInfo.teamEnabled,
  }
}