import React from 'react'
import { useMembership } from '@/hooks/useMembership'
import { MembershipLevel } from '@/stores/membershipStore'

interface WithMembershipProps {
  requiredLevel: MembershipLevel
  fallback?: React.ReactNode
}

const withMembership = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  { requiredLevel, fallback = null }: WithMembershipProps
) => {
  const WithMembershipComponent: React.FC<P> = (props) => {
    const { membershipInfo } = useMembership()
    
    // 检查会员等级是否满足要求
    const hasRequiredLevel = () => {
      switch (requiredLevel) {
        case MembershipLevel.FREE:
          return true // 所有用户都至少是免费用户
        case MembershipLevel.BASIC:
          return membershipInfo.level === MembershipLevel.BASIC || 
                 membershipInfo.level === MembershipLevel.PROFESSIONAL
        case MembershipLevel.PROFESSIONAL:
          return membershipInfo.level === MembershipLevel.PROFESSIONAL
        default:
          return false
      }
    }
    
    // 如果满足等级要求，渲染组件
    if (hasRequiredLevel()) {
      return <WrappedComponent {...props} />
    }
    
    // 否则渲染降级内容
    return <>{fallback}</>
  }
  
  WithMembershipComponent.displayName = `withMembership(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
  
  return WithMembershipComponent
}

export default withMembership