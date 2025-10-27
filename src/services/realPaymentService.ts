// 真实的支付服务 - 集成微信支付和支付宝
import { message } from 'antd'
import { PaymentMethod, PaymentRequest, PaymentResponse } from '@/services/subscriptionService'
import { getPaymentConfig } from '@/services/paymentService'
import { uploadFile, getFile } from '@/services/fileStorageService'
import { apiService } from '@/services/apiService'

// 微信支付接口
interface WeChatPayRequest {
  appid: string
  mchid: string
  description: string
  out_trade_no: string
  amount: {
    total: number
    currency: string
  }
  notify_url: string
}

interface WeChatPayResponse {
  code_url: string
  h5_url?: string
}

// 支付宝支付接口
interface AlipayRequest {
  app_id: string
  method: string
  charset: string
  sign_type: string
  timestamp: string
  version: string
  out_trade_no: string
  product_code: string
  total_amount: string
  subject: string
  body?: string
  notify_url: string
}

// 支付回调接口
interface PaymentCallback {
  order_id: string
  transaction_id: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  amount: number
  timestamp: string
}

// 真实支付服务类
class RealPaymentService {
  // 创建微信支付订单
  private async createWeChatPayOrder(request: PaymentRequest, orderId: string): Promise<PaymentResponse> {
    try {
      // 获取支付配置
      const config = getPaymentConfig()
      if (!config || !config.wechatAppId || !config.wechatMchId || !config.notifyUrl) {
        throw new Error('微信支付配置不完整')
      }

      // 构造支付请求
      const payRequest: WeChatPayRequest = {
        appid: config.wechatAppId,
        mchid: config.wechatMchId,
        description: `会员订阅-${request.planLevel}-${request.billingCycle}`,
        out_trade_no: orderId,
        amount: {
          total: request.amount, // 微信支付金额单位为分
          currency: 'CNY'
        },
        notify_url: config.notifyUrl
      }

      // 调用后端API创建微信支付订单
      const response = await apiService.payments.createPaymentOrder({
        ...request,
        description: payRequest.description,
        amount: payRequest.amount.total
      })

      if (!response.success) {
        throw new Error(response.message || '创建微信支付订单失败')
      }

      return {
        success: true,
        orderId: response.orderId,
        qrCodeUrl: response.code_url,
        message: '微信支付订单创建成功'
      }
    } catch (error) {
      console.error('Failed to create WeChat Pay order:', error)
      return {
        success: false,
        message: '创建微信支付订单失败: ' + (error instanceof Error ? error.message : '未知错误')
      }
    }
  }

  // 创建支付宝订单
  private async createAlipayOrder(request: PaymentRequest, orderId: string): Promise<PaymentResponse> {
    try {
      // 获取支付配置
      const config = getPaymentConfig()
      if (!config || !config.alipayAppId || !config.notifyUrl) {
        throw new Error('支付宝配置不完整')
      }

      // 调用后端API创建支付宝订单
      const response = await apiService.payments.createPaymentOrder({
        ...request,
        description: `会员订阅-${request.planLevel}-${request.billingCycle}`,
        amount: request.amount // 支付宝金额单位为分
      })

      if (!response.success) {
        throw new Error(response.message || '创建支付宝订单失败')
      }

      return {
        success: true,
        orderId: response.orderId,
        qrCodeUrl: response.qr_code,
        message: '支付宝订单创建成功'
      }
    } catch (error) {
      console.error('Failed to create Alipay order:', error)
      return {
        success: false,
        message: '创建支付宝订单失败: ' + (error instanceof Error ? error.message : '未知错误')
      }
    }
  }

  // 生成支付订单
  async createPaymentOrder(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // 生成订单ID
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 根据支付方式创建订单
      switch (request.paymentMethod) {
        case PaymentMethod.WECHAT:
          return await this.createWeChatPayOrder(request, orderId)
        case PaymentMethod.ALIPAY:
          return await this.createAlipayOrder(request, orderId)
        default:
          throw new Error('不支持的支付方式')
      }
    } catch (error) {
      console.error('Failed to create payment order:', error)
      return {
        success: false,
        message: '创建支付订单失败，请稍后重试'
      }
    }
  }

  // 验证支付结果（通过支付网关回调）
  async verifyPayment(orderId: string, callbackData: PaymentCallback): Promise<{ success: boolean; message: string }> {
    try {
      // 验证订单ID和回调数据
      if (!orderId || !callbackData) {
        return {
          success: false,
          message: '支付验证参数不完整'
        }
      }

      // 调用后端API验证支付结果
      const response = await apiService.payments.verifyPayment(orderId, callbackData)
      
      return {
        success: response.success,
        message: response.message || '支付验证完成'
      }
    } catch (error) {
      console.error('Failed to verify payment:', error)
      return {
        success: false,
        message: '支付验证过程中发生错误'
      }
    }
  }

  // 处理支付回调
  async handlePaymentCallback(callbackData: PaymentCallback): Promise<{ success: boolean; message: string }> {
    try {
      // 调用后端API处理支付回调
      const response = await apiService.payments.handlePaymentCallback(callbackData)
      
      return {
        success: response.success,
        message: response.message || '支付回调处理完成'
      }
    } catch (error) {
      console.error('Failed to handle payment callback:', error)
      return {
        success: false,
        message: '处理支付回调时发生错误'
      }
    }
  }

  // 退款处理
  async refund(orderId: string, amount: number): Promise<{ success: boolean; message: string }> {
    try {
      // 调用后端API处理退款
      const response = await apiService.payments.processRefund(orderId, { amount })
      
      return {
        success: response.success,
        message: response.message || '退款处理完成'
      }
    } catch (error) {
      console.error('Failed to process refund:', error)
      return {
        success: false,
        message: '退款处理失败'
      }
    }
  }

  // 查询订单状态
  async queryOrder(orderId: string): Promise<{ status: string; message: string }> {
    try {
      // 调用后端API查询订单状态
      const response = await apiService.payments.queryOrderStatus(orderId)
      
      return {
        status: response.status || 'UNKNOWN',
        message: response.message || '订单状态查询完成'
      }
    } catch (error) {
      console.error('Failed to query order:', error)
      return {
        status: 'UNKNOWN',
        message: '订单状态查询失败'
      }
    }
  }
}

// 导出真实支付服务实例
export const realPaymentService = new RealPaymentService()