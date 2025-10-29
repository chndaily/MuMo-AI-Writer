import React from 'react'
import { Modal, Button, Card, Space, Tag, Divider } from 'antd'
import { 
  CrownOutlined, 
  TeamOutlined, 
  BarChartOutlined,
  RobotOutlined,
  CloudOutlined,
  ArrowUpOutlined
} from '@ant-design/icons'
import { MembershipLevel } from '@/stores/membershipStore'
import { useMembershipStore } from '@/stores/membershipStore'

interface UpgradePromptProps {
  visible: boolean
  onClose: () => void
  feature: string
  requiredLevel: MembershipLevel
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  feature,
  requiredLevel
}) => {
  const { membershipInfo } = useMembershipStore()
  
  // 获取推荐计划
  const getRecommendedPlan = () => {
    switch (requiredLevel) {
      case MembershipLevel.BASIC:
        return {
          level: MembershipLevel.BASIC,
          name: '基础会员',
          price: '¥19/月',
          description: '适合个人创作者的基础功能',
          features: [
            '10本小说创建限制',
            '每日100次AI生成',
            '所有导出格式支持',
            '拼写检查功能',
            '写作统计和进度跟踪',
            '基础云端数据同步'
          ]
        }
      case MembershipLevel.PROFESSIONAL:
        return {
          level: MembershipLevel.PROFESSIONAL,
          name: '专业会员',
          price: '¥49/月',
          description: '适合专业创作者和团队的完整功能',
          features: [
            '无限制AI生成次数',
            '关系可视化工具',
            '高级导出功能',
            '完整云端数据同步',
            '优先客服支持',
            '新功能优先体验',
            '团队协作功能'
          ]
        }
      default:
        return null
    }
  }
  
  const recommendedPlan = getRecommendedPlan()
  
  // 功能描述映射
  const featureDescriptions: Record<string, { icon: React.ReactNode; description: string }> = {
    'team_collaboration': {
      icon: <TeamOutlined />,
      description: '与团队成员一起协作创作，支持多人实时编辑和权限管理'
    },
    'visualization_tools': {
      icon: <BarChartOutlined />,
      description: '使用角色关系图谱、世界观可视化等工具分析您的作品'
    },
    'unlimited_ai_generation': {
      icon: <RobotOutlined />,
      description: '无限制使用AI生成功能，释放您的创作潜力'
    },
    'advanced_export': {
      icon: <CloudOutlined />,
      description: '导出为更多格式，包括EPUB、HTML等高级格式'
    },
    'full_cloud_sync': {
      icon: <CloudOutlined />,
      description: '完整的云端数据同步，随时随地访问您的作品'
    }
  }
  
  const featureInfo = featureDescriptions[feature] || {
    icon: <CrownOutlined />,
    description: '此功能需要更高等级的会员权限'
  }
  
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-4 text-center">
          {recommendedPlan?.level === MembershipLevel.PROFESSIONAL ? (
            <CrownOutlined className="text-yellow-500" />
          ) : (
            <CrownOutlined className="text-blue-500" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-2">解锁 {featureInfo.description}</h2>
        <p className="text-gray-600 mb-6">
          升级到 {recommendedPlan?.name} 即可使用此功能
        </p>
        
        {recommendedPlan && (
          <Card className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="text-left">
                <h3 className="text-xl font-bold">{recommendedPlan.name}</h3>
                <p className="text-gray-600">{recommendedPlan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{recommendedPlan.price}</div>
                {recommendedPlan.level === MembershipLevel.PROFESSIONAL && (
                  <Tag color="gold">最受欢迎</Tag>
                )}
              </div>
            </div>
            
            <Divider />
            
            <div className="text-left mb-6">
              <h4 className="font-bold mb-2">包含功能：</h4>
              <ul className="space-y-2">
                {recommendedPlan.features.map((f, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Space>
              <Button onClick={onClose}>稍后再说</Button>
              <Button 
                type="primary" 
                icon={<ArrowUpOutlined />}
                onClick={() => {
                  // 这里应该导航到会员中心或订阅页面
                  window.location.hash = '#/membership'
                  onClose()
                }}
              >
                立即升级
              </Button>
            </Space>
          </Card>
        )}
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            {featureInfo.icon}
            <span className="ml-2 font-medium">当前等级: {membershipInfo.level === MembershipLevel.FREE ? '免费用户' : membershipInfo.level === MembershipLevel.BASIC ? '基础会员' : '专业会员'}</span>
          </div>
          <p className="text-gray-600 text-sm">
            {membershipInfo.level === MembershipLevel.FREE 
              ? '免费用户可以使用基础功能，升级可解锁更多高级功能'
              : membershipInfo.level === MembershipLevel.BASIC 
                ? '基础会员已包含大部分创作功能，专业会员提供更多高级工具'
                : '您已是最高级会员，享受所有功能'}
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default UpgradePrompt