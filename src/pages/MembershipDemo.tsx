import React from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Space, 
  Tag, 
  message,
  Divider,
  Statistic
} from 'antd'
import { 
  TeamOutlined, 
  BarChartOutlined, 
  RobotOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { useMembershipStore, MembershipLevel } from '@/stores/membershipStore'
import { useMembership } from '@/hooks/useMembership'
import PermissionWrapper from '@/components/membership/PermissionWrapper'
import ExampleFeature from '@/components/membership/ExampleFeature'

const MembershipDemo: React.FC = () => {
  const { membershipInfo, upgradeMembership } = useMembershipStore()
  const { isFree, isBasic, isProfessional, useAI } = useMembership()
  
  // 模拟升级到基础会员
  const upgradeToBasic = () => {
    upgradeMembership(MembershipLevel.BASIC, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    message.success('已升级到基础会员')
  }
  
  // 模拟升级到专业会员
  const upgradeToProfessional = () => {
    upgradeMembership(MembershipLevel.PROFESSIONAL, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    message.success('已升级到专业会员')
  }
  
  // 模拟降级到免费用户
  const downgradeToFree = () => {
    upgradeMembership(MembershipLevel.FREE, null)
    message.info('已降级到免费用户')
  }
  
  // 测试AI生成
  const testAIGenerate = () => {
    const result = useAI()
    if (result.success) {
      message.success('AI生成成功')
    } else {
      message.error(result.reason || 'AI生成失败')
    }
  }
  
  return (
    <div className="membership-demo p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">会员体系演示</h1>
        <p className="text-gray-600">展示不同会员等级的功能权限差异</p>
      </div>
      
      {/* 当前会员状态 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">当前会员状态</h2>
        <Row gutter={24}>
          <Col span={12}>
            <div className="flex items-center">
              {membershipInfo.level === MembershipLevel.PROFESSIONAL ? (
                <CrownOutlined className="text-yellow-500 text-2xl mr-3" />
              ) : membershipInfo.level === MembershipLevel.BASIC ? (
                <CrownOutlined className="text-blue-500 text-2xl mr-3" />
              ) : (
                <CrownOutlined className="text-gray-400 text-2xl mr-3" />
              )}
              <div>
                <h3 className="text-lg font-bold">
                  {membershipInfo.level === MembershipLevel.FREE && '免费用户'}
                  {membershipInfo.level === MembershipLevel.BASIC && '基础会员'}
                  {membershipInfo.level === MembershipLevel.PROFESSIONAL && '专业会员'}
                </h3>
                <Tag color={
                  membershipInfo.level === MembershipLevel.FREE ? 'default' :
                  membershipInfo.level === MembershipLevel.BASIC ? 'blue' :
                  'gold'
                }>
                  {membershipInfo.level === MembershipLevel.FREE && 'FREE'}
                  {membershipInfo.level === MembershipLevel.BASIC && 'BASIC'}
                  {membershipInfo.level === MembershipLevel.PROFESSIONAL && 'PROFESSIONAL'}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <Statistic
              title="AI生成使用次数"
              value={`${membershipInfo.aiGenerationUsed !== undefined ? membershipInfo.aiGenerationUsed : 0} / ${membershipInfo.aiGenerationLimit === Infinity ? '无限制' : (membershipInfo.aiGenerationLimit !== undefined ? membershipInfo.aiGenerationLimit : 0)}`}
            />
          </Col>
        </Row>
        
        <Divider />
        
        <Space>
          <Button 
            onClick={downgradeToFree}
            disabled={isFree}
          >
            降级到免费用户
          </Button>
          <Button 
            type="primary" 
            onClick={upgradeToBasic}
            disabled={isBasic || isProfessional}
          >
            升级到基础会员
          </Button>
          <Button 
            type="primary" 
            icon={<CrownOutlined />}
            onClick={upgradeToProfessional}
            disabled={isProfessional}
          >
            升级到专业会员
          </Button>
        </Space>
      </Card>
      
      {/* 功能权限对比 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">功能权限对比</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">功能</th>
                <th className="text-center py-2">
                  <div className="flex items-center justify-center">
                    <span>免费用户</span>
                    {isFree && <CheckCircleOutlined className="text-green-500 ml-1" />}
                  </div>
                </th>
                <th className="text-center py-2">
                  <div className="flex items-center justify-center">
                    <span>基础会员</span>
                    {isBasic && <CheckCircleOutlined className="text-green-500 ml-1" />}
                  </div>
                </th>
                <th className="text-center py-2">
                  <div className="flex items-center justify-center">
                    <span>专业会员</span>
                    {isProfessional && <CheckCircleOutlined className="text-green-500 ml-1" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">无限制小说创建</td>
                <td className="text-center py-2">
                  <CloseCircleOutlined className="text-red-500" />
                </td>
                <td className="text-center py-2">
                  <CloseCircleOutlined className="text-red-500" />
                </td>
                <td className="text-center py-2">
                  <CheckCircleOutlined className="text-green-500" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2">AI生成次数</td>
                <td className="text-center py-2">10次/天</td>
                <td className="text-center py-2">100次/天</td>
                <td className="text-center py-2">无限制</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">可视化工具</td>
                <td className="text-center py-2">
                  {isFree ? <CloseCircleOutlined className="text-red-500" /> : '-'}
                </td>
                <td className="text-center py-2">
                  {isBasic ? <CloseCircleOutlined className="text-red-500" /> : '-'}
                </td>
                <td className="text-center py-2">
                  {isProfessional ? <CheckCircleOutlined className="text-green-500" /> : '-'}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2">团队协作</td>
                <td className="text-center py-2">
                  {isFree ? <CloseCircleOutlined className="text-red-500" /> : '-'}
                </td>
                <td className="text-center py-2">
                  {isBasic ? <CloseCircleOutlined className="text-red-500" /> : '-'}
                </td>
                <td className="text-center py-2">
                  {isProfessional ? <CheckCircleOutlined className="text-green-500" /> : '-'}
                </td>
              </tr>
              <tr>
                <td className="py-2">云端同步</td>
                <td className="text-center py-2">
                  {isFree ? <CloseCircleOutlined className="text-red-500" /> : '-'}
                </td>
                <td className="text-center py-2">
                  {isBasic || isProfessional ? <CheckCircleOutlined className="text-green-500" /> : '-'}
                </td>
                <td className="text-center py-2">
                  {isProfessional ? <CheckCircleOutlined className="text-green-500" /> : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* 功能演示 */}
      <Card className="mb-6">
        <h2 className="text-xl font-bold mb-4">功能演示</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3">权限控制演示</h3>
          <Row gutter={16}>
            <Col span={8}>
              <PermissionWrapper feature="team_collaboration">
                <Card size="small" className="text-center">
                  <TeamOutlined className="text-2xl mb-2" />
                  <div>团队协作功能</div>
                  <div className="text-green-500 text-sm mt-1">已解锁</div>
                </Card>
              </PermissionWrapper>
              {!isProfessional && (
                <Card size="small" className="text-center mt-2">
                  <TeamOutlined className="text-2xl mb-2 text-gray-400" />
                  <div className="text-gray-400">团队协作功能</div>
                  <div className="text-gray-400 text-sm mt-1">需要专业会员</div>
                </Card>
              )}
            </Col>
            <Col span={8}>
              <PermissionWrapper feature="visualization_tools">
                <Card size="small" className="text-center">
                  <BarChartOutlined className="text-2xl mb-2" />
                  <div>可视化工具</div>
                  <div className="text-green-500 text-sm mt-1">已解锁</div>
                </Card>
              </PermissionWrapper>
              {!(isBasic || isProfessional) && (
                <Card size="small" className="text-center mt-2">
                  <BarChartOutlined className="text-2xl mb-2 text-gray-400" />
                  <div className="text-gray-400">可视化工具</div>
                  <div className="text-gray-400 text-sm mt-1">需要基础会员</div>
                </Card>
              )}
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center">
                <RobotOutlined className="text-2xl mb-2" />
                <div>AI生成测试</div>
                <Button 
                  size="small" 
                  className="mt-2"
                  onClick={testAIGenerate}
                >
                  测试
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
        
        <Divider />
        
        <div>
          <h3 className="text-lg font-bold mb-3">交互式功能示例</h3>
          <ExampleFeature />
        </div>
      </Card>
      
      {/* 使用说明 */}
      <Card>
        <h2 className="text-xl font-bold mb-4">使用说明</h2>
        <div className="prose max-w-none">
          <h3>权限控制</h3>
          <p>使用 <code>PermissionWrapper</code> 组件包装需要权限控制的内容：</p>
          <pre className="bg-gray-100 p-3 rounded">
{`<PermissionWrapper feature="team_collaboration">
  <TeamCollaborationComponent />
</PermissionWrapper>`}
          </pre>
          
          <h3>会员等级检查</h3>
          <p>使用 <code>useMembership</code> Hook 检查当前会员等级：</p>
          <pre className="bg-gray-100 p-3 rounded">
{`const { isProfessional, isBasic } = useMembership()

if (isProfessional) {
  // 专业会员专属功能
}`}
          </pre>
          
          <h3>AI生成次数管理</h3>
          <p>使用 <code>useAI</code> 方法自动处理AI生成次数：</p>
          <pre className="bg-gray-100 p-3 rounded">
{`const { useAI } = useMembership()
const result = useAI()

if (result.success) {
  // 生成AI内容
} else {
  // 显示错误信息
  alert(result.reason)
}`}
          </pre>
        </div>
      </Card>
    </div>
  )
}

export default MembershipDemo