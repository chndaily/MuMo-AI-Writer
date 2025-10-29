// 会员订阅服务
import { MembershipLevel } from '@/stores/membershipStore'
import { useMembershipStore } from '@/stores/membershipStore'
import { realPaymentService } from '@/services/realPaymentService'

// 订阅计划接口
export interface SubscriptionPlan {
  level: MembershipLevel
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  discount?: number // 折扣百分比
}

// 支付方式枚举
export enum PaymentMethod {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  CREDIT_CARD = 'credit_card'
}

// 支付请求接口
export interface PaymentRequest {
  planLevel: MembershipLevel
  billingCycle: 'monthly' | 'yearly'
  paymentMethod: PaymentMethod
  amount: number
}

// 支付响应接口
export interface PaymentResponse {
  success: boolean
  orderId?: string
  message?: string
  redirectUrl?: string
  qrCodeUrl?: string
}

// 支付配置接口
export interface PaymentConfig {
  wechatAccount?: string
  alipayAccount?: string
  wechatQRCode?: string
  alipayQRCode?: string
}

// 订阅服务类
class SubscriptionService {
  // 订阅计划
  private plans: SubscriptionPlan[] = [
    {
      level: MembershipLevel.BASIC,
      name: '基础会员',
      description: '适合个人创作者的基础功能',
      monthlyPrice: 19,
      yearlyPrice: 199,
      features: [
        '10本小说创建限制',
        '每日100次AI生成',
        '所有导出格式支持',
        '拼写检查功能',
        '写作统计和进度跟踪',
        '基础云端数据同步'
      ],
      discount: 15 // 年付约15%折扣
    },
    {
      level: MembershipLevel.PROFESSIONAL,
      name: '专业会员',
      description: '适合专业创作者和团队的完整功能',
      monthlyPrice: 49,
      yearlyPrice: 499,
      features: [
        '无限制AI生成次数',
        '关系可视化工具',
        '高级导出功能',
        '完整云端数据同步',
        '优先客服支持',
        '新功能优先体验',
        '团队协作功能',
        '自定义AI模型配置'
      ],
      discount: 15 // 年付约15%折扣
    }
  ]

  // 获取所有订阅计划
  getSubscriptionPlans(): SubscriptionPlan[] {
    return this.plans
  }

  // 根据等级获取订阅计划
  getPlanByLevel(level: MembershipLevel): SubscriptionPlan | undefined {
    return this.plans.find(plan => plan.level === level)
  }

  // 计算支付金额
  calculatePaymentAmount(plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly'): number {
    if (billingCycle === 'yearly') {
      // 年付价格 = 月付价格 * 12 * (1 - 折扣)
      return plan.yearlyPrice
    }
    return plan.monthlyPrice
  }

  // 生成支付订单
  async createPaymentOrder(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 使用真实的支付服务创建订单
      return await realPaymentService.createPaymentOrder(request)
    } catch (error) {
      console.error('Failed to create payment order:', error)
      return {
        success: false,
        message: '创建支付订单失败，请稍后重试'
      }
    }
  }

  // 验证支付结果（通过支付网关真实回调）
  async verifyPayment(orderId: string, callbackData: any): Promise<{ success: boolean; message: string }> {
    try {
      // 使用真实的支付服务验证支付结果
      return await realPaymentService.verifyPayment(orderId, callbackData)
    } catch (error) {
      console.error('Failed to verify payment:', error)
      return {
        success: false,
        message: '支付验证失败，请稍后重试'
      }
    }
  }

  // 激活订阅
  activateSubscription(planLevel: MembershipLevel, billingCycle: 'monthly' | 'yearly', orderId: string): void {
    const plan = this.getPlanByLevel(planLevel)
    if (!plan) {
      throw new Error('无效的订阅计划')
    }

    // 计算到期日期
    const expiryDate = new Date()
    if (billingCycle === 'yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    }

    // 更新用户会员信息
    const { upgradeMembership } = useMembershipStore.getState()
    upgradeMembership(planLevel, expiryDate)

    // 记录订阅激活
    console.log(`订阅已激活，订单号 ${orderId}: ${planLevel} (${billingCycle})，到期时间: ${expiryDate}`)
  }

  // 处理支付完成回调
  async handlePaymentCallback(callbackData: any): Promise<{ success: boolean; message: string }> {
    try {
      // 验证支付结果
      const verification = await this.verifyPayment(callbackData.order_id, callbackData)
      
      if (verification.success) {
        // 激活订阅
        this.activateSubscription(
          callbackData.planLevel, 
          callbackData.billingCycle, 
          callbackData.order_id
        )
        
        return {
          success: true,
          message: '支付成功，会员已激活'
        }
      } else {
        return {
          success: false,
          message: '支付验证失败'
        }
      }
    } catch (error) {
      console.error('Failed to activate subscription:', error)
      return {
        success: false,
        message: '订阅激活失败'
      }
    }
  }

  // 退款处理
  async processRefund(orderId: string, amount: number): Promise<{ success: boolean; message: string }> {
    try {
      // 使用真实的支付服务处理退款
      return await realPaymentService.refund(orderId, amount)
    } catch (error) {
      console.error('Failed to process refund:', error)
      return {
        success: false,
        message: '退款处理失败'
      }
    }
  }

  // 查询订单状态
  async queryOrderStatus(orderId: string): Promise<{ status: string; message: string }> {
    try {
      // 使用真实的支付服务查询订单状态
      return await realPaymentService.queryOrder(orderId)
    } catch (error) {
      console.error('Failed to query order status:', error)
      return {
        status: 'UNKNOWN',
        message: '订单状态查询失败'
      }
    }
  }
}

// 导出订阅服务实例
export default new SubscriptionService()