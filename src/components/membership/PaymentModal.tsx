import React, { useState, useEffect } from 'react'
import { Modal, Button, Steps, Result, QRCode, Space, Typography, Card, message } from 'antd'
import { 
  LoadingOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  WechatOutlined,
  AlipayOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { MembershipLevel } from '@/stores/membershipStore'
import { PaymentMethod } from '@/services/subscriptionService'
import subscriptionService from '@/services/subscriptionService'

const { Step } = Steps
const { Text, Title } = Typography

interface PaymentModalProps {
  visible: boolean
  planName: string
  planLevel: MembershipLevel
  amount: number
  paymentMethod: PaymentMethod
  onClose: () => void
  onPaymentSuccess: (orderId: string) => void
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  planName,
  planLevel,
  amount,
  paymentMethod,
  onClose,
  onPaymentSuccess
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending')
  const [countdown, setCountdown] = useState(300) // 5分钟倒计时
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [orderId, setOrderId] = useState('')
  const [verifying, setVerifying] = useState(false)

  // 倒计时效果
  useEffect(() => {
    if (visible && currentStep === 1 && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && currentStep === 1) {
      // 倒计时结束，支付失败
      setPaymentStatus('failed')
      setCurrentStep(2)
    }
  }, [visible, currentStep, countdown])

  // 创建支付订单
  const createPaymentOrder = async () => {
    try {
      const paymentRequest = {
        planLevel,
        billingCycle: 'monthly' as const, // 简化处理，实际应该根据用户选择
        paymentMethod,
        amount
      }
      
      const response = await subscriptionService.createPaymentOrder(paymentRequest)
      
      if (response.success && response.orderId && response.qrCodeUrl) {
        setOrderId(response.orderId)
        setQrCodeUrl(response.qrCodeUrl)
        setCurrentStep(1)
        setPaymentStatus('pending')
        setCountdown(300) // 重置倒计时
      } else {
        message.error(response.message || '创建支付订单失败')
      }
    } catch (error) {
      message.error('创建支付订单时发生错误')
    }
  }

  // 手动验证支付
  const verifyPaymentManually = async () => {
    if (!orderId) return
    
    setVerifying(true)
    try {
      // 传递空对象作为callbackData参数
      const result = await subscriptionService.verifyPayment(orderId, {})
      
      if (result.success) {
        setPaymentStatus('success')
        setCurrentStep(2)
        setTimeout(() => {
          onPaymentSuccess(orderId)
        }, 1500)
      } else {
        message.error(result.message)
      }
    } catch (error) {
      message.error('支付验证过程中发生错误')
    } finally {
      setVerifying(false)
    }
  }

  // 格式化倒计时时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 获取支付方式图标和名称
  const getPaymentMethodInfo = () => {
    switch (paymentMethod) {
      case PaymentMethod.WECHAT:
        return { icon: <WechatOutlined />, name: '微信支付' }
      case PaymentMethod.ALIPAY:
        return { icon: <AlipayOutlined />, name: '支付宝' }
      default:
        return { icon: <WechatOutlined />, name: '微信支付' }
    }
  }

  const { icon, name } = getPaymentMethodInfo()

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
      closable={currentStep !== 1} // 支付中不允许关闭
    >
      <Steps 
        current={currentStep} 
        direction="vertical"
        size="small"
        className="mb-6"
      >
        <Step title="确认订单" />
        <Step title="支付处理" />
        <Step title="完成" />
      </Steps>

      {currentStep === 0 && (
        <div className="text-center">
          <Title level={4} className="mb-4">确认订单信息</Title>
          <Card size="small" className="mb-4">
            <div className="flex justify-between items-center">
              <span>会员计划：</span>
              <span className="font-bold">{planName}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>支付方式：</span>
              <span className="flex items-center">
                {icon}
                <span className="ml-1">{name}</span>
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>订单金额：</span>
              <span className="text-xl font-bold text-primary">¥{amount}</span>
            </div>
          </Card>
          <Button 
            type="primary" 
            size="large" 
            block
            onClick={createPaymentOrder}
          >
            确认支付
          </Button>
        </div>
      )}

      {currentStep === 1 && (
        <div className="text-center">
          <Title level={4} className="mb-4">正在支付</Title>
          <div className="mb-4">
            {qrCodeUrl ? (
              <QRCode 
                value={qrCodeUrl} 
                size={200}
                status="active"
              />
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingOutlined style={{ fontSize: 24 }} spin />
              </div>
            )}
          </div>
          <div className="mb-4">
            <Text type="secondary">
              请使用{name}扫描二维码完成支付
            </Text>
          </div>
          <div className="mb-4">
            <Text type="secondary">
              倒计时：{formatTime(countdown)}
            </Text>
          </div>
          <div className="mb-4">
            <Button 
              icon={<SyncOutlined spin={verifying} />} 
              onClick={verifyPaymentManually}
              loading={verifying}
            >
              我已完成支付
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="text-center">
          {paymentStatus === 'success' ? (
            <Result
              status="success"
              title="支付成功"
              subTitle={`您已成功升级为${planName}，正在为您激活会员功能...`}
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          ) : (
            <Result
              status="error"
              title="支付失败"
              subTitle="支付未完成或遇到问题，请重新尝试支付"
              icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              extra={[
                <Button 
                  key="retry" 
                  type="primary" 
                  onClick={() => {
                    setCurrentStep(0)
                    setPaymentStatus('pending')
                  }}
                >
                  重新支付
                </Button>,
                <Button 
                  key="cancel" 
                  onClick={onClose}
                >
                  取消
                </Button>
              ]}
            />
          )}
        </div>
      )}
    </Modal>
  )
}

export default PaymentModal