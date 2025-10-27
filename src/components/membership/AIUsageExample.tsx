import React, { useState } from 'react';
import { Button, message, Card, Space, Typography, Progress, Tag } from 'antd';
import { 
  PlayCircleOutlined, 
  CrownOutlined, 
  WarningOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useMembership } from '@/hooks/useMembership';
import PermissionWrapper from '@/components/membership/PermissionWrapper';
import UpgradePrompt from '@/components/membership/UpgradePrompt';
import { MembershipLevel } from '@/stores/membershipStore';

const { Title, Text } = Typography;

// AI生成功能组件示例
const AIUsageExample: React.FC = () => {
  const { membershipInfo, useAI, checkAIGenerationPermission } = useMembership();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('unlimited_ai_generation');
  const [requiredLevel, setRequiredLevel] = useState<MembershipLevel>(MembershipLevel.PROFESSIONAL);

  // 模拟AI生成
  const simulateAIGeneration = async () => {
    // 检查AI使用权限
    const permission = checkAIGenerationPermission();
    if (!permission.allowed) {
      message.warning(permission.reason || '您已达到今日AI生成次数限制');
      return;
    }

    // 尝试使用AI生成次数
    const useResult = useAI();
    if (!useResult.success) {
      message.warning(useResult.reason || '无法使用AI生成功能');
      return;
    }

    setIsGenerating(true);
    
    // 模拟AI生成过程
    setTimeout(() => {
      const sampleContent = `这是一段由AI生成的小说内容示例。根据您的创作需求，我为您生成了以下内容：
      
在遥远的未来，人类已经掌握了星际旅行的技术。一艘名为"希望号"的探索飞船正在穿越未知的星系，寻找适合人类居住的新家园。

船上的AI助手"阿尔法"突然检测到前方星系中存在异常的能量波动。船长李明决定前往调查，这可能会改变人类的命运...

（这是AI生成的示例内容，实际使用中会根据您的具体需求生成相关内容）`;
      
      setGeneratedContent(sampleContent);
      setIsGenerating(false);
      message.success('AI内容生成成功！');
    }, 2000);
  };

  // 处理升级
  const handleUpgrade = (feature: string, level: MembershipLevel) => {
    setUpgradeFeature(feature);
    setRequiredLevel(level);
    setShowUpgradeModal(true);
  };

  // 渲染AI使用统计
  const renderAIUsageStats = () => {
    const usagePercent = Math.min(
      100, 
      (membershipInfo.aiGenerationUsed / membershipInfo.aiGenerationLimit) * 100
    );

    return (
      <Card size="small" title="AI使用统计" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>今日AI生成次数：</Text>
            <Text>{membershipInfo.aiGenerationUsed !== undefined ? membershipInfo.aiGenerationUsed : 0} / {membershipInfo.aiGenerationLimit === Infinity ? '无限制' : (membershipInfo.aiGenerationLimit !== undefined ? membershipInfo.aiGenerationLimit : 0)}</Text>
          </div>
          <Progress 
            percent={usagePercent} 
            status={usagePercent >= 100 ? 'exception' : 'normal'} 
          />
          <div>
            <Text type="secondary">
              {membershipInfo.level === 'free' && '免费会员每日限制10次AI生成'}
              {membershipInfo.level === 'basic' && '基础会员每日限制100次AI生成'}
              {membershipInfo.level === 'professional' && '专业会员无限制AI生成'}
            </Text>
          </div>
        </Space>
      </Card>
    );
  };

  // 渲染会员等级信息
  const renderMembershipInfo = () => {
    const levelInfo = {
      free: { name: '免费会员', color: 'default' },
      basic: { name: '基础会员', color: 'blue' },
      professional: { name: '专业会员', color: 'gold' }
    };

    const info = levelInfo[membershipInfo.level];

    return (
      <Card size="small" title="会员信息" style={{ marginBottom: 16 }}>
        <Space>
          <Tag icon={<CrownOutlined />} color={info.color}>
            {info.name}
          </Tag>
          {membershipInfo.level !== 'professional' && (
            <Button 
              type="primary" 
              size="small" 
              onClick={() => handleUpgrade('unlimited_ai_generation', MembershipLevel.PROFESSIONAL)}
            >
              升级到专业会员
            </Button>
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div>
      {renderMembershipInfo()}
      {renderAIUsageStats()}

      <Card title="AI生成功能演示">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>小说内容生成</Title>
          <Text>使用AI助手生成小说内容，包括情节、角色、场景等。</Text>
          
          <PermissionWrapper
            feature="unlimited_ai_generation"
            showUpgradeButton={true}
            onUpgrade={(level) => handleUpgrade('unlimited_ai_generation', level as MembershipLevel)}
          >
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={simulateAIGeneration}
              loading={isGenerating}
              disabled={isGenerating || membershipInfo.aiGenerationUsed >= membershipInfo.aiGenerationLimit}
            >
              {isGenerating ? 'AI生成中...' : '生成小说内容'}
            </Button>
          </PermissionWrapper>

          {generatedContent && (
            <Card size="small" title="生成结果" style={{ marginTop: 16 }}>
              <Text>{generatedContent}</Text>
            </Card>
          )}
        </Space>
      </Card>

      {/* 升级提示模态框 */}
      <UpgradePrompt
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
        requiredLevel={requiredLevel}
      />
    </div>
  );
};

export default AIUsageExample;