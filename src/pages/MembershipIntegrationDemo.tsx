import React from 'react';
import { 
  Layout, 
  Card, 
  Space, 
  Typography, 
  Button, 
  message,
  Tag,
  Divider
} from 'antd';
import { 
  CrownOutlined, 
  ThunderboltOutlined, 
  TeamOutlined,
  BarChartOutlined,
  CloudOutlined
} from '@ant-design/icons';
import { useMembership } from '@/hooks/useMembership';
import PermissionWrapper from '@/components/membership/PermissionWrapper';
import AINovelWorkspaceIntegration from '@/components/membership/AINovelWorkspaceIntegration';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const MembershipIntegrationDemo: React.FC = () => {
  const { membershipInfo, isFree, isBasic, isProfessional } = useMembership();

  // 获取当前会员等级信息
  const getMembershipLevelInfo = () => {
    if (isFree) {
      return {
        name: '免费会员',
        color: 'default',
        description: '适合体验基本功能'
      };
    } else if (isBasic) {
      return {
        name: '基础会员',
        color: 'blue',
        description: '适合个人创作者的基础功能'
      };
    } else {
      return {
        name: '专业会员',
        color: 'gold',
        description: '适合专业创作者和团队的完整功能'
      };
    }
  };

  const levelInfo = getMembershipLevelInfo();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={2}>
              <CrownOutlined /> 会员体系与小说系统集成演示
            </Title>
            
            <Card size="small" title="当前会员信息">
              <Space>
                <Tag icon={<CrownOutlined />} color={levelInfo.color}>
                  {levelInfo.name}
                </Tag>
                <Text type="secondary">{levelInfo.description}</Text>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => window.location.hash = '#/membership'}
                >
                  会员中心
                </Button>
              </Space>
            </Card>

            <Divider />

            <Title level={3}>AI小说创作工具演示</Title>
            <Paragraph>
              以下演示展示了如何在小说创作系统中集成会员权限控制，
              包括AI生成功能、可视化工具和团队协作功能。
            </Paragraph>

            <AINovelWorkspaceIntegration />

            <Divider />

            <Title level={3}>功能权限对比</Title>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>AI生成功能：</Text>
                  <Space style={{ marginTop: 8 }}>
                    <Tag color={isFree ? 'default' : 'blue'}>
                      免费会员: 10次/天
                    </Tag>
                    <Tag color={isBasic ? 'blue' : isProfessional ? 'blue' : 'default'}>
                      基础会员: 100次/天
                    </Tag>
                    <Tag color={isProfessional ? 'gold' : 'default'}>
                      专业会员: 无限制
                    </Tag>
                  </Space>
                </div>

                <div>
                  <Text strong>可视化工具：</Text>
                  <Space style={{ marginTop: 8 }}>
                    <Tag color={isFree ? 'default' : 'blue'}>
                      免费会员: 不支持
                    </Tag>
                    <Tag color={isBasic ? 'blue' : 'default'}>
                      基础会员: 不支持
                    </Tag>
                    <Tag color={isProfessional ? 'gold' : 'default'}>
                      专业会员: 支持
                    </Tag>
                  </Space>
                </div>

                <div>
                  <Text strong>团队协作：</Text>
                  <Space style={{ marginTop: 8 }}>
                    <Tag color={isFree ? 'default' : 'blue'}>
                      免费会员: 不支持
                    </Tag>
                    <Tag color={isBasic ? 'blue' : 'default'}>
                      基础会员: 不支持
                    </Tag>
                    <Tag color={isProfessional ? 'gold' : 'default'}>
                      专业会员: 支持
                    </Tag>
                  </Space>
                </div>

                <div>
                  <Text strong>导出功能：</Text>
                  <Space style={{ marginTop: 8 }}>
                    <Tag color={isFree ? 'default' : 'blue'}>
                      免费会员: TXT/Markdown
                    </Tag>
                    <Tag color={isBasic ? 'blue' : isProfessional ? 'blue' : 'default'}>
                      基础会员: 所有格式
                    </Tag>
                    <Tag color={isProfessional ? 'gold' : 'default'}>
                      专业会员: 高级格式
                    </Tag>
                  </Space>
                </div>
              </Space>
            </Card>

            <Divider />

            <Title level={3}>权限控制示例</Title>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>以下功能根据您的会员等级显示不同的内容：</Text>
                
                <PermissionWrapper feature="unlimited_ai_generation">
                  <Card size="small" title="AI生成功能" extra={<ThunderboltOutlined />}>
                    <Text>您有权使用无限制的AI生成功能</Text>
                  </Card>
                </PermissionWrapper>

                <PermissionWrapper 
                  feature="visualization_tools"
                  showUpgradeButton={true}
                  onUpgrade={(level) => window.location.hash = '#/membership'}
                >
                  <Card size="small" title="可视化工具" extra={<BarChartOutlined />}>
                    <Text>使用角色关系图谱、世界观可视化等工具分析您的作品</Text>
                  </Card>
                </PermissionWrapper>

                <PermissionWrapper 
                  feature="team_collaboration"
                  showUpgradeButton={true}
                  onUpgrade={(level) => window.location.hash = '#/membership'}
                >
                  <Card size="small" title="团队协作" extra={<TeamOutlined />}>
                    <Text>与团队成员一起协作创作，支持多人实时编辑和权限管理</Text>
                  </Card>
                </PermissionWrapper>

                <PermissionWrapper 
                  feature="advanced_export"
                  showUpgradeButton={true}
                  onUpgrade={(level) => window.location.hash = '#/membership'}
                >
                  <Card size="small" title="高级导出" extra={<CloudOutlined />}>
                    <Text>导出为更多格式，包括EPUB、HTML等高级格式</Text>
                  </Card>
                </PermissionWrapper>
              </Space>
            </Card>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export default MembershipIntegrationDemo;