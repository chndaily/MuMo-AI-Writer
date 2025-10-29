import React from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Tag, 
  Space, 
  Divider,
  Progress,
  Badge
} from 'antd'
import { 
  CrownOutlined, 
  TeamOutlined, 
  CloudOutlined,
  BarChartOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined
} from '@ant-design/icons'
import { useMembershipStore, MembershipLevel } from '@/stores/membershipStore'
import { useMembership } from '@/hooks/useMembership'
import SubscriptionManager from '@/components/membership/SubscriptionManager'
import TeamCollaboration from '@/components/membership/TeamCollaboration'

const MembershipCenter: React.FC = () => {
  const { membershipInfo } = useMembershipStore()
  const { isFree, isBasic, isProfessional } = useMembership()
  
  // AI使用率
  const aiUsagePercent = membershipInfo.aiGenerationLimit > 0 && membershipInfo.aiGenerationLimit !== Infinity && membershipInfo.aiGenerationUsed !== undefined
    ? Math.round((membershipInfo.aiGenerationUsed / membershipInfo.aiGenerationLimit) * 100)
    : 0
  
  // 获取会员等级名称
  const getLevelName = () => {
    // 检查是否为管理员
    if (membershipInfo.isAdmin) {
      return '管理员'
    }
    
    // 检查会员等级
    switch (membershipInfo.level) {
      case MembershipLevel.FREE: return '免费用户'
      case MembershipLevel.BASIC: return '基础会员'
      case MembershipLevel.PROFESSIONAL: return '专业会员'
      default: 
        // 如果等级不匹配任何已知值，尝试从字符串转换
        switch (membershipInfo.level as string) {
          case 'free': return '免费用户'
          case 'basic': return '基础会员'
          case 'professional': return '专业会员'
          default: return '未知'
        }
    }
  }
  
  // 获取会员等级颜色
  const getLevelColor = () => {
    // 检查是否为管理员
    if (membershipInfo.isAdmin) {
      return 'red'
    }
    
    // 检查会员等级
    switch (membershipInfo.level) {
      case MembershipLevel.FREE: return 'default'
      case MembershipLevel.BASIC: return 'blue'
      case MembershipLevel.PROFESSIONAL: return 'gold'
      default: 
        // 如果等级不匹配任何已知值，尝试从字符串转换
        switch (membershipInfo.level as string) {
          case 'free': return 'default'
          case 'basic': return 'blue'
          case 'professional': return 'gold'
          default: return 'default'
        }
    }
  }
  
  // 获取AI使用次数显示文本
  const getAIUsageDisplay = () => {
    // 检查是否为管理员或专业会员（无限使用权限）
    if (membershipInfo.isAdmin || membershipInfo.aiGenerationLimit === Infinity) {
      return '无限制'
    }
    
    // 检查是否有使用次数信息
    if (membershipInfo.aiGenerationUsed !== undefined && membershipInfo.aiGenerationLimit !== undefined) {
      return `${membershipInfo.aiGenerationUsed} / ${membershipInfo.aiGenerationLimit}`
    }
    
    // 默认显示
    return '0 / 0'
  }
  
  // 获取AI使用次数描述文本
  const getAIUsageDescription = () => {
    // 检查是否为管理员或专业会员（无限使用权限）
    if (membershipInfo.isAdmin || membershipInfo.aiGenerationLimit === Infinity) {
      return '无限制使用'
    }
    
    // 检查是否有使用次数信息
    if (membershipInfo.aiGenerationUsed !== undefined && membershipInfo.aiGenerationLimit !== undefined) {
      const remaining = membershipInfo.aiGenerationLimit - membershipInfo.aiGenerationUsed
      return `今日还可使用 ${remaining} 次`
    }
    
    // 默认显示
    return '无使用权限'
  }
  
  return (
    <div className="membership-center p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">会员中心</h1>
        <p className="text-gray-600">管理您的会员订阅和功能权限</p>
      </div>
      
      {/* 会员状态概览 */}
      <Card className="mb-6">
        <Row gutter={24}>
          <Col xs={24} md={8}>
            <div className="text-center">
              <div className="text-4xl mb-2">
                {membershipInfo.isAdmin ? (
                  <CrownOutlined className="text-red-500" />
                ) : membershipInfo.level === MembershipLevel.PROFESSIONAL ? (
                  <CrownOutlined className="text-yellow-500" />
                ) : membershipInfo.level === MembershipLevel.BASIC ? (
                  <Badge count={<CrownOutlined className="text-blue-500" />} />
                ) : (
                  <ExclamationCircleOutlined className="text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-bold">{getLevelName()}</h3>
              <Tag color={getLevelColor()}>{getLevelName()}</Tag>
              {membershipInfo.expiryDate && (
                <p className="text-gray-500 mt-2">
                  到期时间: {new Date(membershipInfo.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </Col>
          
          <Col xs={24} md={8}>
            <Statistic
              title="AI生成使用次数"
              value={getAIUsageDisplay()}
              prefix={<RobotOutlined />}
            />
            <Progress 
              percent={aiUsagePercent} 
              status={aiUsagePercent > 90 ? 'exception' : 'normal'}
              className="mt-2"
            />
            <p className="text-gray-500 text-sm mt-1">
              {getAIUsageDescription()}
            </p>
          </Col>
          
          <Col xs={24} md={8}>
            <Statistic
              title="团队功能"
              value={membershipInfo.teamEnabled ? "已启用" : "未启用"}
              prefix={<TeamOutlined />}
            />
            <p className="text-gray-500 text-sm mt-2">
              {membershipInfo.teamEnabled 
                ? `最多可添加 ${membershipInfo.maxTeamMembers} 名成员` 
                : "升级到专业会员解锁团队功能"}
            </p>
            {(isFree || isBasic) && (
              <Button 
                type="primary" 
                className="mt-2"
                icon={<ArrowUpOutlined />}
                onClick={() => document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {isFree ? '升级会员' : '升级到专业会员'}
              </Button>
            )}
          </Col>
        </Row>
      </Card>
      
      {/* 功能权限概览 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">功能权限</h2>
        <Row gutter={[16, 16]}>
          {[
            { 
              name: '小说创作', 
              enabled: true, 
              icon: <CheckCircleOutlined className="text-green-500" />,
              description: '创建和管理您的小说作品'
            },
            { 
              name: '无限制小说', 
              enabled: isProfessional || membershipInfo.isAdmin, 
              icon: (isProfessional || membershipInfo.isAdmin) ? <CheckCircleOutlined className="text-green-500" /> : <CloseCircleOutlined className="text-gray-400" />,
              description: isProfessional || membershipInfo.isAdmin ? '创建任意数量的小说' : isBasic ? '最多创建10本小说' : '最多创建3本小说'
            },
            { 
              name: 'AI生成', 
              enabled: true, 
              icon: <RobotOutlined className={isFree ? "text-gray-400" : "text-green-500"} />,
              description: isFree ? '每日10次AI生成' : isBasic ? '每日100次AI生成' : '无限制AI生成'
            },
            { 
              name: '可视化工具', 
              enabled: isProfessional || membershipInfo.isAdmin, 
              icon: (isProfessional || membershipInfo.isAdmin) ? <BarChartOutlined className="text-green-500" /> : <CloseCircleOutlined className="text-gray-400" />,
              description: '角色关系图谱、世界观可视化等'
            },
            { 
              name: '团队协作', 
              enabled: isProfessional || membershipInfo.isAdmin, 
              icon: (isProfessional || membershipInfo.isAdmin) ? <TeamOutlined className="text-green-500" /> : <CloseCircleOutlined className="text-gray-400" />,
              description: '多人实时协作编辑'
            },
            { 
              name: '云端同步', 
              enabled: !isFree, 
              icon: !isFree ? <CloudOutlined className="text-green-500" /> : <CloseCircleOutlined className="text-gray-400" />,
              description: isBasic ? '基础云端同步' : '完整云端同步'
            },
            { 
              name: '自定义AI模型', 
              enabled: isProfessional || membershipInfo.isAdmin, 
              icon: (isProfessional || membershipInfo.isAdmin) ? <RobotOutlined className="text-green-500" /> : <CloseCircleOutlined className="text-gray-400" />,
              description: '配置和使用自定义AI模型'
            }
          ].map((feature, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                <div className="text-xl mr-3 mt-1">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium">{feature.name}</h4>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
      
      {/* 订阅管理 */}
      <div id="subscription-section">
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">订阅管理</h2>
          <SubscriptionManager />
        </Card>
      </div>
      
      {/* 团队协作 */}
      {membershipInfo.teamEnabled && (
        <Card>
          <h2 className="text-xl font-bold mb-4">团队协作</h2>
          <TeamCollaboration />
        </Card>
      )}
    </div>
  )
}

export default MembershipCenter