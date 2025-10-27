import React, { useState, useEffect } from 'react'
import { Card, Button, Radio, Space, Divider, Tag, message } from 'antd'
import { 
  CheckOutlined, 
  CrownOutlined, 
  TeamOutlined, 
  CloudOutlined,
  BarChartOutlined,
  RobotOutlined,
  WechatOutlined,
  AlipayOutlined
} from '@ant-design/icons'
import { useMembershipStore, MembershipLevel } from '@/stores/membershipStore'
import subscriptionService, { SubscriptionPlan, PaymentMethod } from '@/services/subscriptionService'
import { useMembership } from '@/hooks/useMembership'
import PaymentModal from './PaymentModal'

const SubscriptionManager: React.FC = () => {
  const { membershipInfo, upgradeMembership } = useMembershipStore()
  const { isProfessional } = useMembership()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<MembershipLevel>(MembershipLevel.BASIC)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.WECHAT)
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false)
  
  // 初始化订阅计划
  useEffect(() => {
    const subscriptionPlans = subscriptionService.getSubscriptionPlans()
    setPlans(subscriptionPlans)
    
    // 如果用户已经是专业会员，默认选择专业会员计划
    if (isProfessional) {
      setSelectedPlan(MembershipLevel.PROFESSIONAL)
    }
  }, [isProfessional])
  
  // 获取选中的计划
  const selectedPlanData = plans.find(plan => plan.level === selectedPlan)
  
  // 计算价格
  const price = selectedPlanData 
    ? subscriptionService.calculatePaymentAmount(selectedPlanData, billingCycle) 
    : 0
  
  // 处理支付
  const handlePayment = () => {
    if (!selectedPlanData) return
    setIsPaymentModalVisible(true)
  }
  
  // 处理支付成功
  const handlePaymentSuccess = (orderId: string) => {
    if (!selectedPlanData) return
    
    // 激活订阅
    const expiryDate = new Date()
    if (billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    }
    
    upgradeMembership(selectedPlan, expiryDate)
    message.success('订阅成功！会员功能已激活。')
    setIsPaymentModalVisible(false)
  }
  
  // 获取功能图标
  const getFeatureIcon = (feature: string) => {
    if (feature.includes('团队') || feature.includes('协作')) {
      return <TeamOutlined />
    }
    if (feature.includes('云') || feature.includes('同步')) {
      return <CloudOutlined />
    }
    if (feature.includes('可视化') || feature.includes('图表')) {
      return <BarChartOutlined />
    }
    if (feature.includes('AI') || feature.includes('智能')) {
      return <RobotOutlined />
    }
    return <CheckOutlined />
  }
  
  return (
    <div className="subscription-manager">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">会员订阅</h2>
        <p className="text-gray-600">选择适合您的会员计划，解锁更多创作功能</p>
      </div>
      
      {/*  billing cycle selector */}
      <div className="mb-6">
        <Radio.Group 
          value={billingCycle} 
          onChange={(e) => setBillingCycle(e.target.value)}
          size="large"
        >
          <Radio.Button value="monthly">月付</Radio.Button>
          <Radio.Button value="yearly">年付</Radio.Button>
        </Radio.Group>
        {billingCycle === 'yearly' && (
          <Tag color="green" className="ml-2">节省约15%</Tag>
        )}
      </div>
      
      {/* subscription plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {plans.map(plan => (
          <Card
            key={plan.level}
            className={`shadow-lg ${
              selectedPlan === plan.level 
                ? 'border-primary border-2' 
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedPlan(plan.level)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-2">
                  {plan.level === MembershipLevel.PROFESSIONAL ? (
                    <CrownOutlined className="text-yellow-500 text-xl mr-2" />
                  ) : null}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-gray-600 mb-4">{plan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ¥{billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                </div>
                <div className="text-gray-500 text-sm">
                  {billingCycle === 'yearly' ? '每年' : '每月'}
                </div>
                {billingCycle === 'yearly' && plan.discount && (
                  <div className="text-green-600 text-sm">
                    节省约{plan.discount}%
                  </div>
                )}
              </div>
            </div>
            
            <Divider />
            
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary mr-2">
                    {getFeatureIcon(feature)}
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button
              type={selectedPlan === plan.level ? "primary" : "default"}
              size="large"
              className="w-full mt-6"
              onClick={() => setSelectedPlan(plan.level)}
            >
              {membershipInfo.level === plan.level ? '当前计划' : '选择此计划'}
            </Button>
          </Card>
        ))}
      </div>
      
      {/* payment method */}
      {selectedPlanData && (
        <Card className="mb-6">
          <h3 className="text-lg font-bold mb-4">选择支付方式</h3>
          <Radio.Group 
            value={paymentMethod} 
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value={PaymentMethod.WECHAT}>
                <span className="flex items-center">
                  <WechatOutlined className="mr-2" />
                  <span>微信支付</span>
                </span>
              </Radio>
              <Radio value={PaymentMethod.ALIPAY}>
                <span className="flex items-center">
                  <AlipayOutlined className="mr-2" />
                  <span>支付宝</span>
                </span>
              </Radio>
            </Space>
          </Radio.Group>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span>订单金额：</span>
              <span className="text-xl font-bold text-primary">¥{price}</span>
            </div>
          </div>
          
          <Button
            type="primary"
            size="large"
            className="w-full mt-4"
            onClick={handlePayment}
          >
            立即支付
          </Button>
        </Card>
      )}
      
      {/* current membership info */}
      <Card>
        <h3 className="text-lg font-bold mb-4">当前会员信息</h3>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold">
              {membershipInfo.level === MembershipLevel.FREE && '免费用户'}
              {membershipInfo.level === MembershipLevel.BASIC && '基础会员'}
              {membershipInfo.level === MembershipLevel.PROFESSIONAL && '专业会员'}
            </div>
            <div className="text-gray-600">
              {membershipInfo.expiryDate 
                ? `到期时间：${new Date(membershipInfo.expiryDate).toLocaleDateString()}` 
                : '永久有效'}
            </div>
          </div>
          <div>
            <Tag color={
              membershipInfo.level === MembershipLevel.FREE ? 'default' :
              membershipInfo.level === MembershipLevel.BASIC ? 'blue' :
              'gold'
            }>
              {membershipInfo.level === MembershipLevel.FREE && '免费'}
              {membershipInfo.level === MembershipLevel.BASIC && '基础'}
              {membershipInfo.level === MembershipLevel.PROFESSIONAL && '专业'}
            </Tag>
          </div>
        </div>
      </Card>
      
      {/* Payment Modal */}
      {selectedPlanData && (
        <PaymentModal
          visible={isPaymentModalVisible}
          planName={selectedPlanData.name}
          planLevel={selectedPlan}
          amount={price}
          paymentMethod={paymentMethod}
          onClose={() => setIsPaymentModalVisible(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

export default SubscriptionManager