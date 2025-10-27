// 支付配置服务
import { message } from 'antd'
import { uploadFile, getFile } from '@/services/fileStorageService'
import type { FileInfo } from '@/services/fileStorageService'

// 支付配置接口
export interface PaymentConfig {
  wechatAccount?: string
  alipayAccount?: string
  wechatQRCodeUrl?: string
  alipayQRCodeUrl?: string
  // 支付接口配置
  wechatAppId?: string
  wechatMchId?: string
  wechatApiKey?: string
  alipayAppId?: string
  alipayPrivateKey?: string
  alipayPublicKey?: string
  // 回调配置
  notifyUrl?: string
  returnUrl?: string
  // 文件信息
  wechatQRCodeFileId?: string
  alipayQRCodeFileId?: string
}

// 保存支付配置到本地存储
export const savePaymentConfig = async (config: PaymentConfig): Promise<boolean> => {
  try {
    // 保存到本地存储
    localStorage.setItem('payment-config', JSON.stringify(config))
    console.log('Payment config saved to localStorage:', config)
    return true
  } catch (error) {
    console.error('Failed to save payment config:', error)
    message.error('保存支付配置失败')
    return false
  }
}

// 从本地存储获取支付配置
export const getPaymentConfig = (): PaymentConfig | null => {
  try {
    // 首先尝试从环境变量获取配置
    const envConfig: PaymentConfig = {
      wechatAppId: import.meta.env.VITE_WECHAT_APPID,
      wechatMchId: import.meta.env.VITE_WECHAT_MCHID,
      alipayAppId: import.meta.env.VITE_ALIPAY_APP_ID,
      notifyUrl: import.meta.env.VITE_PAYMENT_NOTIFY_URL,
    }
    
    // 检查环境变量配置是否完整
    const hasEnvConfig = envConfig.wechatAppId && envConfig.wechatMchId && envConfig.alipayAppId && envConfig.notifyUrl
    
    // 如果环境变量配置完整，优先使用环境变量配置
    if (hasEnvConfig) {
      return envConfig
    }
    
    // 否则从本地存储获取配置
    const configStr = localStorage.getItem('payment-config')
    if (configStr) {
      return JSON.parse(configStr) as PaymentConfig
    }
    return null
  } catch (error) {
    console.error('Failed to load payment config:', error)
    return null
  }
}

// 上传文件并返回文件信息
export const uploadPaymentFile = async (file: File): Promise<FileInfo> => {
  // 上传文件并加密存储
  return await uploadFile(file, { encrypt: true })
}

// 获取文件URL
export const getFileUrl = (fileId: string): string | null => {
  const fileInfo = getFile(fileId)
  if (fileInfo) {
    // 如果文件已加密，需要解密后返回
    return fileInfo.encrypted ? fileInfo.url : fileInfo.url
  }
  return null
}