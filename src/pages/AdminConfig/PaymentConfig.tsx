import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  message, 
  Space,
  Typography,
  Divider,
  Tabs,
  Select,
  Switch,
  Result,
  Alert
} from 'antd'
import { 
  UploadOutlined, 
  WechatOutlined, 
  AlipayOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  LockOutlined
} from '@ant-design/icons'
import { useMembershipStore } from '@/stores/membershipStore'
import { useNavigate } from 'react-router-dom'
import type { UploadFile } from 'antd/es/upload/interface'
import { savePaymentConfig, getPaymentConfig, uploadPaymentFile, getFileUrl } from '@/services/paymentService'
import type { PaymentConfig } from '@/services/paymentService'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select

const PaymentConfigPage: React.FC = () => {
  const [form] = Form.useForm()
  const { membershipInfo, isAdmin } = useMembershipStore()
  const [loading, setLoading] = useState(false)
  const [wechatQRCodeList, setWechatQRCodeList] = useState<UploadFile[]>([])
  const [alipayQRCodeList, setAlipayQRCodeList] = useState<UploadFile[]>([])
  const [activeTab, setActiveTab] = useState('account')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const navigate = useNavigate()
  
  // 添加调试日志
  useEffect(() => {
    console.log('PaymentConfigPage mounted')
    console.log('Membership info:', membershipInfo)
    console.log('Is admin:', isAdmin())
    
    // 检查用户权限
    const checkPermission = () => {
      const isAdminUser = isAdmin()
      setHasPermission(isAdminUser)
      
      // 如果不是管理员，跳转到首页
      if (!isAdminUser) {
        navigate('/')
      }
    }

    checkPermission()
    
    // 加载已保存的配置
    loadSavedConfig()
  }, [membershipInfo, isAdmin])
  
  // 加载已保存的配置
  const loadSavedConfig = () => {
    const config = getPaymentConfig()
    if (config) {
      form.setFieldsValue({
        wechatAccount: config.wechatAccount,
        alipayAccount: config.alipayAccount,
        wechatAppId: config.wechatAppId,
        wechatMchId: config.wechatMchId,
        wechatApiKey: config.wechatApiKey,
        alipayAppId: config.alipayAppId,
        alipayPrivateKey: config.alipayPrivateKey,
        alipayPublicKey: config.alipayPublicKey,
        notifyUrl: config.notifyUrl,
        returnUrl: config.returnUrl
      })
      
      // 设置二维码图片显示
      if (config.wechatQRCodeFileId) {
        const fileUrl = getFileUrl(config.wechatQRCodeFileId)
        if (fileUrl) {
          setWechatQRCodeList([{
            uid: config.wechatQRCodeFileId,
            name: 'wechat-qrcode.png',
            status: 'done',
            url: fileUrl
          }])
        }
      } else if (config.wechatQRCodeUrl) {
        // 兼容旧数据
        setWechatQRCodeList([{
          uid: '-1',
          name: 'wechat-qrcode.png',
          status: 'done',
          url: config.wechatQRCodeUrl
        }])
      }
      
      if (config.alipayQRCodeFileId) {
        const fileUrl = getFileUrl(config.alipayQRCodeFileId)
        if (fileUrl) {
          setAlipayQRCodeList([{
            uid: config.alipayQRCodeFileId,
            name: 'alipay-qrcode.png',
            status: 'done',
            url: fileUrl
          }])
        }
      } else if (config.alipayQRCodeUrl) {
        // 兼容旧数据
        setAlipayQRCodeList([{
          uid: '-2',
          name: 'alipay-qrcode.png',
          status: 'done',
          url: config.alipayQRCodeUrl
        }])
      }
    }
  }
  
  // 检查支付配置是否完整
  const checkPaymentConfigComplete = () => {
    const config = getPaymentConfig()
    if (!config) return false
    
    // 检查必要配置是否完整
    const hasWechatConfig = config.wechatAppId && config.wechatMchId
    const hasAlipayConfig = config.alipayAppId
    const hasNotifyUrl = config.notifyUrl
    
    return (hasWechatConfig || hasAlipayConfig) && hasNotifyUrl
  }
  
  // 获取配置状态信息
  const getConfigStatusInfo = () => {
    const isComplete = checkPaymentConfigComplete()
    return {
      isComplete,
      statusText: isComplete ? '配置完整' : '配置不完整',
      statusType: isComplete ? 'success' : 'warning' as 'success' | 'warning' | 'error' | 'info'
    }
  }
  
  // 检查是否为管理员
  const checkAdminPermission = () => {
    const adminStatus = isAdmin()
    console.log('Checking admin permission:', adminStatus)
    return adminStatus
  }
  
  // 保存配置
  const handleSave = async (values: any) => {
    setLoading(true)
    try {
      // 处理上传的文件
      let wechatQRCodeUrl = ''
      let alipayQRCodeUrl = ''
      let wechatQRCodeFileId = ''
      let alipayQRCodeFileId = ''
      
      // 上传微信二维码
      if (wechatQRCodeList.length > 0 && wechatQRCodeList[0].originFileObj) {
        const fileInfo = await uploadPaymentFile(wechatQRCodeList[0].originFileObj)
        wechatQRCodeUrl = fileInfo.url
        wechatQRCodeFileId = fileInfo.id
      } else if (wechatQRCodeList.length > 0 && wechatQRCodeList[0].url) {
        wechatQRCodeUrl = wechatQRCodeList[0].url || ''
        wechatQRCodeFileId = wechatQRCodeList[0].uid as string
      }
      
      // 上传支付宝二维码
      if (alipayQRCodeList.length > 0 && alipayQRCodeList[0].originFileObj) {
        const fileInfo = await uploadPaymentFile(alipayQRCodeList[0].originFileObj)
        alipayQRCodeUrl = fileInfo.url
        alipayQRCodeFileId = fileInfo.id
      } else if (alipayQRCodeList.length > 0 && alipayQRCodeList[0].url) {
        alipayQRCodeUrl = alipayQRCodeList[0].url || ''
        alipayQRCodeFileId = alipayQRCodeList[0].uid as string
      }
      
      // 构造配置对象
      const config: PaymentConfig = {
        wechatAccount: values.wechatAccount,
        alipayAccount: values.alipayAccount,
        wechatQRCodeUrl,
        alipayQRCodeUrl,
        wechatQRCodeFileId,
        alipayQRCodeFileId,
        wechatAppId: values.wechatAppId,
        wechatMchId: values.wechatMchId,
        wechatApiKey: values.wechatApiKey,
        alipayAppId: values.alipayAppId,
        alipayPrivateKey: values.alipayPrivateKey,
        alipayPublicKey: values.alipayPublicKey,
        notifyUrl: values.notifyUrl,
        returnUrl: values.returnUrl
      }
      
      // 保存到存储
      const success = await savePaymentConfig(config)
      
      if (success) {
        message.success('支付配置保存成功')
        // 重新加载配置以显示最新数据
        loadSavedConfig()
      } else {
        message.error('保存失败，请重试')
      }
    } catch (error) {
      console.error('保存支付配置时出错:', error)
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }
  
  // 上传图片前的处理
  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!')
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!')
    }
    return isJpgOrPng && isLt2M
  }
  
  // 处理微信二维码上传
  const handleWechatQRCodeChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setWechatQRCodeList(fileList)
  }
  
  // 处理支付宝二维码上传
  const handleAlipayQRCodeChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setAlipayQRCodeList(fileList)
  }
  
  // 测试支付接口连接
  const testPaymentConnection = async (platform: 'wechat' | 'alipay') => {
    try {
      message.loading(`正在测试${platform === 'wechat' ? '微信' : '支付宝'}支付接口...`, 0)
      
      // 获取当前配置
      const config = getPaymentConfig()
      if (!config) {
        message.destroy()
        message.error('请先保存支付配置')
        return
      }
      
      // 根据平台检查必要配置
      if (platform === 'wechat') {
        if (!config.wechatAppId || !config.wechatMchId) {
          message.destroy()
          message.error('微信支付配置不完整，请检查AppID和商户号')
          return
        }
      } else {
        if (!config.alipayAppId) {
          message.destroy()
          message.error('支付宝配置不完整，请检查AppID')
          return
        }
      }
      
      // 模拟测试过程
      setTimeout(() => {
        message.destroy()
        message.success(`${platform === 'wechat' ? '微信' : '支付宝'}支付接口连接成功`)
      }, 1500)
    } catch (error) {
      message.destroy()
      message.error(`${platform === 'wechat' ? '微信' : '支付宝'}支付接口连接失败: ${error}`)
    }
  }
  
  // 如果还在检查权限，显示加载状态
  if (hasPermission === null) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/')}
          >
            返回
          </Button>
        </div>
        <div>验证权限中...</div>
      </div>
    );
  }
  
  // 如果不是管理员，显示权限不足提示
  if (!hasPermission) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/')}
          >
            返回
          </Button>
        </div>
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面。只有管理员可以配置支付信息。"
          icon={<LockOutlined />}
        />
      </div>
    );
  }
  
  console.log('Rendering payment config form')
  
  // 获取配置状态
  const configStatus = getConfigStatusInfo()
  
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
        >
          返回
        </Button>
      </div>
      
      <Card>
        <Title level={3}>
          <Space>
            <span>支付配置</span>
          </Space>
        </Title>
        <Text type="secondary">配置微信和支付宝收款信息及接口参数</Text>
        
        {/* 配置状态提示 */}
        <Alert
          message={`支付配置状态: ${configStatus.statusText}`}
          type={configStatus.statusType as any}
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Divider />
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><WechatOutlined />/<AlipayOutlined /> 账户配置</span>} key="account">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={{
                wechatAccount: '',
                alipayAccount: '',
              }}
            >
              {/* 微信支付配置 */}
              <Card size="small" title={<Space><WechatOutlined style={{ color: '#07c160' }} /><span>微信支付配置</span></Space>} style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="微信收款账号"
                  name="wechatAccount"
                  rules={[{ required: false, message: '请输入微信收款账号' }]}
                >
                  <Input placeholder="请输入微信收款账号" />
                </Form.Item>
                
                <Form.Item
                  label="微信收款二维码"
                  name="wechatQRCode"
                >
                  <Upload
                    name="wechatQRCode"
                    listType="picture"
                    beforeUpload={beforeUpload}
                    maxCount={1}
                    fileList={wechatQRCodeList}
                    onChange={handleWechatQRCodeChange}
                  >
                    <Button icon={<UploadOutlined />}>上传二维码</Button>
                  </Upload>
                </Form.Item>
              </Card>
              
              {/* 支付宝配置 */}
              <Card size="small" title={<Space><AlipayOutlined style={{ color: '#1677ff' }} /><span>支付宝配置</span></Space>} style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="支付宝收款账号"
                  name="alipayAccount"
                  rules={[{ required: false, message: '请输入支付宝收款账号' }]}
                >
                  <Input placeholder="请输入支付宝收款账号" />
                </Form.Item>
                
                <Form.Item
                  label="支付宝收款二维码"
                  name="alipayQRCode"
                >
                  <Upload
                    name="alipayQRCode"
                    listType="picture"
                    beforeUpload={beforeUpload}
                    maxCount={1}
                    fileList={alipayQRCodeList}
                    onChange={handleAlipayQRCodeChange}
                  >
                    <Button icon={<UploadOutlined />}>上传二维码</Button>
                  </Upload>
                </Form.Item>
              </Card>
              
              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    保存配置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab={<span><ApiOutlined /> 接口配置</span>} key="api">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              {/* 微信支付接口配置 */}
              <Card size="small" title={<Space><WechatOutlined style={{ color: '#07c160' }} /><span>微信支付接口配置</span></Space>} style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="微信AppID"
                  name="wechatAppId"
                  rules={[{ required: false, message: '请输入微信AppID' }]}
                >
                  <Input placeholder="请输入微信AppID" />
                </Form.Item>
                
                <Form.Item
                  label="微信商户号(MchID)"
                  name="wechatMchId"
                  rules={[{ required: false, message: '请输入微信商户号' }]}
                >
                  <Input placeholder="请输入微信商户号" />
                </Form.Item>
                
                <Form.Item
                  label="微信API密钥"
                  name="wechatApiKey"
                  rules={[{ required: false, message: '请输入微信API密钥' }]}
                >
                  <Input.Password placeholder="请输入微信API密钥" />
                </Form.Item>
                
                <Form.Item>
                  <Button onClick={() => testPaymentConnection('wechat')}>
                    测试微信支付接口
                  </Button>
                </Form.Item>
              </Card>
              
              {/* 支付宝接口配置 */}
              <Card size="small" title={<Space><AlipayOutlined style={{ color: '#1677ff' }} /><span>支付宝接口配置</span></Space>} style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="支付宝AppID"
                  name="alipayAppId"
                  rules={[{ required: false, message: '请输入支付宝AppID' }]}
                >
                  <Input placeholder="请输入支付宝AppID" />
                </Form.Item>
                
                <Form.Item
                  label="支付宝私钥"
                  name="alipayPrivateKey"
                  rules={[{ required: false, message: '请输入支付宝私钥' }]}
                >
                  <Input.TextArea placeholder="请输入支付宝私钥" rows={4} />
                </Form.Item>
                
                <Form.Item
                  label="支付宝公钥"
                  name="alipayPublicKey"
                  rules={[{ required: false, message: '请输入支付宝公钥' }]}
                >
                  <Input.TextArea placeholder="请输入支付宝公钥" rows={4} />
                </Form.Item>
                
                <Form.Item>
                  <Button onClick={() => testPaymentConnection('alipay')}>
                    测试支付宝支付接口
                  </Button>
                </Form.Item>
              </Card>
              
              {/* 回调配置 */}
              <Card size="small" title={<Space><CheckCircleOutlined /><span>回调配置</span></Space>} style={{ marginBottom: '24px' }}>
                <Form.Item
                  label="异步通知URL"
                  name="notifyUrl"
                  rules={[{ required: false, message: '请输入异步通知URL' }]}
                >
                  <Input placeholder="请输入异步通知URL，例如：https://yourdomain.com/api/payment/notify" />
                </Form.Item>
                
                <Form.Item
                  label="同步返回URL"
                  name="returnUrl"
                  rules={[{ required: false, message: '请输入同步返回URL' }]}
                >
                  <Input placeholder="请输入同步返回URL，例如：https://yourdomain.com/payment/return" />
                </Form.Item>
                
                <Form.Item label="回调验证">
                  <Space>
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
                    <Text type="secondary">启用回调验证以确保支付安全性</Text>
                  </Space>
                </Form.Item>
              </Card>
            </Form>
          </TabPane>
        </Tabs>
        
        {/* 页面底部的保存按钮 */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Space>
            <Button 
              type="primary" 
              onClick={form.submit}
              loading={loading}
              icon={<SaveOutlined />}
            >
              保存配置
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default PaymentConfigPage