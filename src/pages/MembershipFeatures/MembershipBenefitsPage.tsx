import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Descriptions,
  Divider,
  Collapse,
  Typography,
  Progress
} from 'antd';
import {
  FileTextOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RocketOutlined,
  TeamOutlined,
  CloudOutlined,
  RobotOutlined,
  BarChartOutlined,
  TrophyOutlined,
  StarOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { useMembershipStore, MembershipLevel } from '@/stores/membershipStore';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

const MembershipBenefitsPage: React.FC = () => {
  const { membershipInfo } = useMembershipStore();

  // 获取当前会员等级名称
  const getCurrentLevelName = () => {
    switch (membershipInfo.level) {
      case MembershipLevel.FREE: return '免费会员';
      case MembershipLevel.BASIC: return '基础会员';
      case MembershipLevel.PROFESSIONAL: return '专业会员';
      default: return '免费会员';
    }
  };

  // 获取当前会员等级颜色
  const getCurrentLevelColor = () => {
    switch (membershipInfo.level) {
      case MembershipLevel.FREE: return 'default';
      case MembershipLevel.BASIC: return 'blue';
      case MembershipLevel.PROFESSIONAL: return 'gold';
      default: return 'default';
    }
  };

  // 功能对比数据
  const features = [
    {
      name: 'AI生成次数',
      free: '10次/天',
      basic: '100次/天',
      professional: '无限制',
      icon: <RobotOutlined />
    },
    {
      name: '团队协作',
      free: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      basic: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      professional: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      icon: <TeamOutlined />
    },
    {
      name: '云端同步',
      free: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      basic: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      professional: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      icon: <CloudOutlined />
    },
    {
      name: '角色关系图谱',
      free: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      basic: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      professional: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      icon: <BarChartOutlined />
    },
    {
      name: '成就系统',
      free: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      basic: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      professional: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      icon: <TrophyOutlined />
    },
    {
      name: '自定义AI模型',
      free: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      basic: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      professional: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      icon: <RobotOutlined />
    },
    {
      name: '优先技术支持',
      free: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      basic: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      professional: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      icon: <StarOutlined />
    }
  ];

  // 价格信息
  const pricing = [
    {
      level: '免费会员',
      price: '¥0',
      period: '/月',
      features: ['基础创作功能', '10次AI生成/天', '本地保存'],
      color: 'default',
      current: membershipInfo.level === MembershipLevel.FREE
    },
    {
      level: '基础会员',
      price: '¥19',
      period: '/月',
      yearlyPrice: '¥199/年',
      features: ['完整创作功能', '100次AI生成/天', '云端同步', '成就系统'],
      color: 'blue',
      current: membershipInfo.level === MembershipLevel.BASIC
    },
    {
      level: '专业会员',
      price: '¥49',
      period: '/月',
      yearlyPrice: '¥499/年',
      features: ['所有功能', '无限制AI生成', '团队协作', '高级可视化', '自定义AI模型', '优先支持'],
      color: 'gold',
      current: membershipInfo.level === MembershipLevel.PROFESSIONAL
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          <FileTextOutlined style={{ marginRight: '8px' }} />
          会员权益说明
        </h1>
        <p style={{ color: '#666' }}>了解不同会员等级的权益和功能</p>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={3}>当前会员等级</Title>
          <Tag color={getCurrentLevelColor()} style={{ fontSize: '16px', padding: '8px 16px' }}>
            <CrownOutlined /> {getCurrentLevelName()}
          </Tag>
          {membershipInfo.level !== MembershipLevel.PROFESSIONAL && (
            <div style={{ marginTop: '16px' }}>
              <Button type="primary" icon={<ArrowUpOutlined />}>
                升级到专业会员
              </Button>
            </div>
          )}
        </div>
        
        <Descriptions bordered column={1}>
          <Descriptions.Item label="AI生成次数">
            {membershipInfo.aiGenerationLimit === Infinity 
              ? '无限制' 
              : `${membershipInfo.aiGenerationUsed !== undefined ? membershipInfo.aiGenerationUsed : 0} / ${membershipInfo.aiGenerationLimit === Infinity ? '无限制' : (membershipInfo.aiGenerationLimit !== undefined ? membershipInfo.aiGenerationLimit : 0)}`}
            {membershipInfo.aiGenerationLimit !== Infinity && (
              <Progress 
                percent={membershipInfo.aiGenerationLimit > 0 
                  ? Math.min(100, ((membershipInfo.aiGenerationUsed || 0) / membershipInfo.aiGenerationLimit) * 100)
                  : 0
                } 
                style={{ marginTop: '8px' }}
              />
            )}
          </Descriptions.Item>
          <Descriptions.Item label="团队功能">
            {membershipInfo.teamEnabled ? '已启用' : '未启用'}
          </Descriptions.Item>
          <Descriptions.Item label="最大团队成员数">
            {membershipInfo.maxTeamMembers || 0} 人
          </Descriptions.Item>
          <Descriptions.Item label="云端同步">
            {membershipInfo.features.includes('full_cloud_sync') 
              ? '完整同步' 
              : membershipInfo.features.includes('basic_cloud_sync') 
                ? '基础同步' 
                : '未启用'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Title level={4} style={{ marginBottom: '16px' }}>会员等级对比</Title>
      <Card style={{ marginBottom: '24px' }}>
        <Table
          dataSource={features}
          pagination={false}
          rowKey="name"
          columns={[
            {
              title: '功能',
              dataIndex: 'name',
              key: 'name',
              render: (text: string, record: any) => (
                <Space>
                  {record.icon}
                  <span>{text}</span>
                </Space>
              )
            },
            {
              title: '免费会员',
              dataIndex: 'free',
              key: 'free',
              align: 'center'
            },
            {
              title: '基础会员',
              dataIndex: 'basic',
              key: 'basic',
              align: 'center'
            },
            {
              title: '专业会员',
              dataIndex: 'professional',
              key: 'professional',
              align: 'center'
            }
          ]}
        />
      </Card>

      <Title level={4} style={{ marginBottom: '16px' }}>会员套餐</Title>
      <Row gutter={16}>
        {pricing.map((plan, index) => (
          <Col span={8} key={index}>
            <Card
              title={
                <div style={{ textAlign: 'center' }}>
                  <h3>{plan.level}</h3>
                  <div>
                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{plan.price}</span>
                    <span style={{ color: '#999' }}>{plan.period}</span>
                  </div>
                  {plan.yearlyPrice && (
                    <div style={{ color: '#999', fontSize: '14px', marginTop: '4px' }}>
                      年付: {plan.yearlyPrice}
                    </div>
                  )}
                </div>
              }
              bordered
              style={{
                borderColor: plan.current ? '#1890ff' : undefined,
                position: 'relative'
              }}
            >
              {plan.current && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#1890ff',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  当前等级
                </div>
              )}
              <ul style={{ padding: '0 16px' }}>
                {plan.features.map((feature, idx) => (
                  <li key={idx} style={{ margin: '8px 0' }}>{feature}</li>
                ))}
              </ul>
              {!plan.current && (
                <Button 
                  type={plan.color === 'gold' ? 'primary' : 'default'} 
                  block
                  style={{ marginTop: '16px' }}
                >
                  选择此套餐
                </Button>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={4} style={{ marginTop: '32px', marginBottom: '16px' }}>常见问题</Title>
      <Card>
        <Collapse bordered={false} defaultActiveKey={['1']}>
          <Panel header="如何升级会员？" key="1">
            <p>您可以在会员中心页面点击"升级会员"按钮，选择合适的套餐进行升级。</p>
          </Panel>
          <Panel header="会员到期后会怎样？" key="2">
            <p>会员到期后，您将降级为免费会员，部分高级功能将不可用，但您的创作数据会保留。</p>
          </Panel>
          <Panel header="可以退款吗？" key="3">
            <p>我们提供7天无理由退款服务，如果您在购买后7天内不满意，可以申请退款。</p>
          </Panel>
          <Panel header="团队功能如何使用？" key="4">
            <p>专业会员可以邀请团队成员协作创作，管理员可以分配不同的权限给团队成员。</p>
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
};

export default MembershipBenefitsPage;