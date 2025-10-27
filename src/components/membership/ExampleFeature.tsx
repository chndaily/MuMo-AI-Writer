import React from 'react'
import { Button, Card, Space, message } from 'antd'
import { TeamOutlined, BarChartOutlined } from '@ant-design/icons'
import PermissionWrapper from './PermissionWrapper'
import UpgradePrompt from './UpgradePrompt'
import { useMembership } from '@/hooks/useMembership'
import { MembershipLevel } from '@/stores/membershipStore'

const ExampleFeature: React.FC = () => {
  const [upgradePromptVisible, setUpgradePromptVisible] = React.useState(false)
  const [upgradeFeature, setUpgradeFeature] = React.useState('')
  const { useAI } = useMembership()
  
  // 处理需要团队功能的操作
  const handleTeamFeature = () => {
    message.success('团队功能已启用')
  }
  
  // 处理需要可视化工具的操作
  const handleVisualizationFeature = () => {
    message.success('可视化工具已启用')
  }
  
  // 处理AI生成功能
  const handleAIGenerate = () => {
    const result = useAI()
    if (result.success) {
      message.success('AI内容生成成功')
    } else {
      message.error(result.reason || '无法使用AI生成功能')
    }
  }
  
  return (
    <Card title="会员功能示例">
      <p className="mb-4">以下是一些需要不同会员等级才能使用的功能示例：</p>
      
      <Space direction="vertical" className="w-full">
        {/* 团队协作功能示例 */}
        <PermissionWrapper 
          feature="team_collaboration"
          showUpgradeButton={true}
          onUpgrade={(level) => {
            setUpgradeFeature('team_collaboration')
            setUpgradePromptVisible(true)
          }}
        >
          <Button 
            type="primary" 
            icon={<TeamOutlined />}
            onClick={handleTeamFeature}
            className="w-full"
          >
            团队协作功能
          </Button>
        </PermissionWrapper>
        
        {/* 可视化工具功能示例 */}
        <PermissionWrapper 
          feature="visualization_tools"
          showUpgradeButton={true}
          onUpgrade={(level) => {
            setUpgradeFeature('visualization_tools')
            setUpgradePromptVisible(true)
          }}
        >
          <Button 
            type="primary" 
            icon={<BarChartOutlined />}
            onClick={handleVisualizationFeature}
            className="w-full"
          >
            可视化分析工具
          </Button>
        </PermissionWrapper>
        
        {/* AI生成功能示例 */}
        <PermissionWrapper 
          feature="unlimited_ai_generation"
          showUpgradeButton={true}
          onUpgrade={(level) => {
            setUpgradeFeature('unlimited_ai_generation')
            setUpgradePromptVisible(true)
          }}
        >
          <Button 
            type="primary" 
            onClick={handleAIGenerate}
            className="w-full"
          >
            AI内容生成
          </Button>
        </PermissionWrapper>
      </Space>
      
      {/* 升级提示模态框 */}
      <UpgradePrompt
        visible={upgradePromptVisible}
        onClose={() => setUpgradePromptVisible(false)}
        feature={upgradeFeature}
        requiredLevel={upgradeFeature === 'visualization_tools' || upgradeFeature === 'team_collaboration' ? MembershipLevel.PROFESSIONAL : MembershipLevel.BASIC}
      />
    </Card>
  )
}

export default ExampleFeature