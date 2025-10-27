import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembershipStore } from '@/stores/membershipStore'
import PublicHomePage from '@/pages/PublicHomePage'
import HomePage from '@/pages/HomePage'

const ConditionalHomePage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useMembershipStore()

  // 如果用户已认证，重定向到创作中心
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/creation-center', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // 如果用户已认证，不渲染任何内容（因为会重定向）
  if (isAuthenticated) {
    return <div></div>; // 返回空的div而不是null
  }

  return <PublicHomePage />
}

export default ConditionalHomePage