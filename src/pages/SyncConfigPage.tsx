import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  message,
  Switch,
  Select,
  Form,
  InputNumber,
  Divider,
  Alert
} from 'antd';
import { 
  SyncOutlined, 
  SettingOutlined,
  CloudSyncOutlined,
  WifiOutlined,
  MobileOutlined,
  DesktopOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import SyncStatusMonitor from '@/components/SyncStatusMonitor';
import { optimizedDataSyncService } from '@/services/optimizedDataSyncService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 数据同步配置页面
 */
const SyncConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // 默认配置
  const defaultConfig = {
    autoSync: true,
    syncInterval: 30, // 分钟
    networkPreference: 'wifi', // wifi, mobile, any
    syncPriority: 'normal', // high, normal, low
  };

  // 加载配置
  useEffect(() => {
    // 从本地存储加载配置
    const savedConfig = localStorage.getItem('syncConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        form.setFieldsValue(config);
      } catch (error) {
        console.warn('加载同步配置时出错:', error);
        form.setFieldsValue(defaultConfig);
      }
    } else {
      form.setFieldsValue(defaultConfig);
    }
  }, [form]);

  // 保存配置
  const saveConfig = (values: any) => {
    try {
      localStorage.setItem('syncConfig', JSON.stringify(values));
      message.success('配置已保存');
    } catch (error) {
      console.error('保存配置时出错:', error);
      message.error('保存配置失败');
    }
  };

  // 手动同步所有数据
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await optimizedDataSyncService.syncAllData();
      setSyncResult({
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        message.success('数据同步完成');
      } else {
        message.error('数据同步失败');
      }
    } catch (error) {
      console.error('数据同步时出错:', error);
      setSyncResult({
        success: false,
        message: `数据同步失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
      message.error('数据同步失败');
    } finally {
      setIsSyncing(false);
    }
  };

  // 立即同步
  const handleImmediateSync = () => {
    optimizedDataSyncService.triggerSync();
    message.info('已触发同步任务');
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 添加返回按钮 */}
      <div style={{ marginBottom: '16px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
        >
          返回
        </Button>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3}>
          <SyncOutlined /> 数据同步配置
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<CloudSyncOutlined />}
            loading={isSyncing}
            onClick={handleManualSync}
          >
            同步所有数据
          </Button>
          <Button 
            icon={<SyncOutlined />}
            onClick={handleImmediateSync}
          >
            立即同步
          </Button>
        </Space>
      </div>
      
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* 配置表单 */}
        <div style={{ flex: 1 }}>
          <Card title={<><SettingOutlined /> 同步设置</>}>
            <Form
              form={form}
              layout="vertical"
              onFinish={saveConfig}
              initialValues={defaultConfig}
            >
              <Form.Item
                name="autoSync"
                label="自动同步"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="syncInterval"
                label="同步间隔（分钟）"
              >
                <InputNumber min={1} max={1440} />
              </Form.Item>
              
              <Form.Item
                name="networkPreference"
                label="网络偏好"
              >
                <Select>
                  <Option value="wifi">
                    <Space>
                      <WifiOutlined />
                      <span>仅WiFi</span>
                    </Space>
                  </Option>
                  <Option value="mobile">
                    <Space>
                      <MobileOutlined />
                      <span>移动网络</span>
                    </Space>
                  </Option>
                  <Option value="any">
                    <Space>
                      <DesktopOutlined />
                      <span>任何网络</span>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="syncPriority"
                label="同步优先级"
              >
                <Select>
                  <Option value="high">高优先级</Option>
                  <Option value="normal">正常优先级</Option>
                  <Option value="low">低优先级</Option>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    保存配置
                  </Button>
                  <Button htmlType="button" onClick={() => form.resetFields()}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
          
          <Divider />
          
          {syncResult && (
            <Alert
              message={syncResult.success ? "同步成功" : "同步失败"}
              description={syncResult.message}
              type={syncResult.success ? "success" : "error"}
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}
          
          <Card title="同步说明">
            <ul>
              <li>自动同步：根据设置的时间间隔自动同步数据</li>
              <li>同步间隔：设置自动同步的时间间隔</li>
              <li>网络偏好：选择在何种网络环境下进行同步</li>
              <li>同步优先级：设置同步任务的优先级</li>
              <li>手动同步：立即触发一次完整的数据同步</li>
              <li>立即同步：将同步任务添加到队列中，稍后执行</li>
            </ul>
          </Card>
        </div>
        
        {/* 状态监控 */}
        <div>
          <SyncStatusMonitor />
        </div>
      </div>
    </div>
  );
};

export default SyncConfigPage;