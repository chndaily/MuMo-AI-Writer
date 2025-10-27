import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Space,
  message,
  Alert,
  Divider,
  Tag,
  Typography,
  Steps,
  Modal,
  Result
} from 'antd';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  SettingOutlined,
  CloudOutlined,
  LockOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useSupabaseConfigStore } from '@/stores/supabaseConfigStore';
import { useMembershipStore } from '@/stores/membershipStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // 分钟
}

const SupabaseConfigPanel: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const {
    config,
    isEnabled,
    connectionValid,
    lastSyncTime,
    updateConfig,
    testConnection,
    enableSupabase,
    disableSupabase,
    syncData,
    getLocalDataCount,
    getCloudDataCount
  } = useSupabaseConfigStore();

  const { isAdmin } = useMembershipStore();
  const isUserAdmin = isAdmin();

  const [dataStats, setDataStats] = useState({
    local: { novels: 0, characters: 0, outlines: 0 },
    cloud: { novels: 0, characters: 0, outlines: 0 }
  });

  useEffect(() => {
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
  }, [isAdmin, navigate])

  useEffect(() => {
    loadDataStats();
  }, []);

  useEffect(() => {
    if (config) {
      form.setFieldsValue(config);
      setConnectionStatus(connectionValid ? 'connected' : 'error');
    }
  }, [config, connectionValid, form]);

  const loadDataStats = async () => {
    try {
      const localStats = await getLocalDataCount();
      const cloudStats = isEnabled ? await getCloudDataCount() : { novels: 0, characters: 0, outlines: 0 };
      setDataStats({ local: localStats, cloud: cloudStats });
    } catch (error) {
      console.error('加载数据统计失败:', error);
    }
  };

  const handleTestConnection = async () => {
    // 只有管理员可以测试连接
    if (!isUserAdmin) {
      message.error('只有管理员可以测试数据库连接');
      return;
    }

    try {
      setTesting(true);
      const values = await form.validateFields();
      
      const testConfig: SupabaseConfig = {
        url: values.url,
        anonKey: values.anonKey,
        serviceRoleKey: values.serviceRoleKey?.trim(),
        enabled: false,
        autoSync: values.autoSync || false,
        syncInterval: values.syncInterval || 30
      };

      const result = await testConnection(testConfig);
      
      if (result.success) {
        setConnectionStatus('connected');
        message.success('连接测试成功！');
      } else {
        setConnectionStatus('error');
        message.error(`连接测试失败: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      message.error('请先填写完整的配置信息');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (values: any) => {
    // 只有管理员可以保存配置
    if (!isUserAdmin) {
      message.error('只有管理员可以修改数据库配置');
      return;
    }

    try {
      const newConfig: SupabaseConfig = {
        url: values.url.trim(),
        anonKey: values.anonKey.trim(),
        serviceRoleKey: values.serviceRoleKey?.trim(),
        enabled: values.enabled || false,
        autoSync: values.autoSync || false,
        syncInterval: values.syncInterval || 30
      };

      await updateConfig(newConfig);
      
      if (newConfig.enabled) {
        await enableSupabase();
        message.success('Supabase配置已保存并启用');
      } else {
        await disableSupabase();
        message.success('Supabase配置已保存');
      }
      
      await loadDataStats();
    } catch (error) {
      message.error('保存配置失败: ' + (error as Error).message);
    }
  };

  const handleSyncData = async () => {
    // 只有管理员可以同步数据
    if (!isUserAdmin) {
      message.error('只有管理员可以同步数据');
      return;
    }

    try {
      setSyncing(true);
      await syncData();
      message.success('数据同步完成');
      await loadDataStats();
    } catch (error) {
      message.error('数据同步失败: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const showMigrationModal = () => {
    // 只有管理员可以启用服务
    if (!isUserAdmin) {
      message.error('只有管理员可以启用数据库服务');
      return;
    }

    Modal.confirm({
      title: '数据迁移确认',
      content: (
        <div>
          <Paragraph>
            启用Supabase后，本地数据将会同步到云端。这个过程包括：
          </Paragraph>
          <ul>
            <li>将本地 {dataStats.local.novels} 部小说同步到云端</li>
            <li>将本地 {dataStats.local.characters} 个角色同步到云端</li>
            <li>将本地 {dataStats.local.outlines} 个大纲同步到云端</li>
          </ul>
          <Alert
            message="注意"
            description="同步过程中请勿关闭页面，首次同步可能需要一些时间。"
            type="warning"
            showIcon
          />
        </div>
      ),
      onOk: () => {
        form.setFieldsValue({ enabled: true });
        form.submit();
      },
      okText: '确认启用并同步',
      cancelText: '取消'
    });
  };

  const getCurrentStep = () => {
    if (!config?.url || !config?.anonKey) return 0;
    if (!connectionValid) return 1;
    if (!isEnabled) return 2;
    return 3;
  };

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
  if (!isUserAdmin) {
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
          subTitle="抱歉，您没有权限访问此页面。只有管理员可以配置数据库。"
          icon={<LockOutlined />}
        />
      </div>
    );
  }

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
        <Title level={2}>
          <DatabaseOutlined /> Supabase 数据库配置
        </Title>
        <Paragraph>
          配置Supabase云数据库，实现数据云端同步和多设备访问。
          未配置时系统将使用本地IndexedDB存储数据。
        </Paragraph>

        {/* 配置步骤 */}
        <Steps
          current={getCurrentStep()}
          style={{ marginBottom: 32 }}
          items={[
            {
              title: '填写配置',
              description: '输入Supabase项目信息',
              icon: <SettingOutlined />
            },
            {
              title: '测试连接',
              description: '验证配置是否正确',
              icon: connectionValid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />
            },
            {
              title: '启用服务',
              description: '开启云数据库功能',
              icon: <CloudOutlined />
            },
            {
              title: '数据同步',
              description: '本地数据同步到云端',
              icon: <SyncOutlined />
            }
          ]}
        />

        {/* 当前状态 */}
        <Alert
          message={
            isEnabled 
              ? '✅ Supabase已启用，数据将自动同步到云端' 
              : '⚠️ 当前使用本地存储，数据仅保存在本设备'
          }
          type={isEnabled ? 'success' : 'warning'}
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 数据统计 */}
        <Card size="small" style={{ marginBottom: 24 }}>
          <Title level={4}>数据统计</Title>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <Text strong>本地数据</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">小说: {dataStats.local.novels}</Tag>
                <Tag color="green">角色: {dataStats.local.characters}</Tag>
                <Tag color="orange">大纲: {dataStats.local.outlines}</Tag>
              </div>
            </div>
            <div>
              <Text strong>云端数据</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">小说: {dataStats.cloud.novels}</Tag>
                <Tag color="green">角色: {dataStats.cloud.characters}</Tag>
                <Tag color="orange">大纲: {dataStats.cloud.outlines}</Tag>
              </div>
            </div>
          </div>
          {lastSyncTime && (
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              最后同步时间: {new Date(lastSyncTime).toLocaleString()}
            </Text>
          )}
        </Card>

        {/* 配置表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveConfig}
          initialValues={{
            enabled: false,
            autoSync: true,
            syncInterval: 30
          }}
        >
          <Form.Item
            name="url"
            label="Supabase项目URL"
            rules={[
              { required: true, message: '请输入Supabase项目URL' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
            extra="格式: https://your-project.supabase.co"
          >
            <Input 
              placeholder="https://your-project.supabase.co"
              prefix={<DatabaseOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="anonKey"
            label="匿名密钥 (anon key)"
            rules={[{ required: true, message: '请输入匿名密钥' }]}
            extra="在Supabase项目设置 → API中可以找到"
          >
            <TextArea 
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </Form.Item>

          <Form.Item
            name="serviceRoleKey"
            label="服务角色密钥 (可选)"
            extra="用于管理员操作，可提高数据操作权限"
          >
            <TextArea 
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </Form.Item>

          <Divider />

          <Form.Item name="autoSync" valuePropName="checked">
            <Switch /> 启用自动同步
          </Form.Item>

          <Form.Item
            name="syncInterval"
            label="同步间隔 (分钟)"
            extra="自动同步的时间间隔"
          >
            <Input type="number" min={5} max={1440} placeholder="30" />
          </Form.Item>

          <Form.Item 
            name="enabled" 
            valuePropName="checked"
            extra="启用后将开始使用Supabase进行数据存储和同步"
          >
            <Switch 
              checkedChildren="已启用" 
              unCheckedChildren="未启用"
              onChange={(checked) => {
                if (checked && dataStats.local.novels > 0) {
                  // 如果有本地数据，显示迁移确认
                  showMigrationModal();
                  return false; // 阻止直接切换
                }
              }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={syncing}
              >
                保存配置
              </Button>
              
              <Button 
                onClick={handleTestConnection}
                loading={testing}
                icon={<ExclamationCircleOutlined />}
              >
                测试连接
              </Button>
              
              {isEnabled && (
                <Button 
                  onClick={handleSyncData}
                  loading={syncing}
                  icon={<SyncOutlined />}
                >
                  立即同步
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>

        {/* 连接状态指示 */}
        {connectionStatus !== 'disconnected' && (
          <Alert
            message={
              connectionStatus === 'connected' 
                ? '数据库连接正常' 
                : '数据库连接失败，请检查配置'
            }
            type={connectionStatus === 'connected' ? 'success' : 'error'}
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </div>
  );
};

export default SupabaseConfigPanel;