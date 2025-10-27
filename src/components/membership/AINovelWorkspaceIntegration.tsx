import React, { useState, useEffect } from 'react';
import { 
  Button, 
  message, 
  Card, 
  Space, 
  Typography, 
  Progress, 
  Tag, 
  Alert,
  Modal
} from 'antd';
import { 
  ThunderboltOutlined,
  CrownOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useMembership } from '@/hooks/useMembership';
import PermissionWrapper from '@/components/membership/PermissionWrapper';
import UpgradePrompt from '@/components/membership/UpgradePrompt';
import { MembershipLevel } from '@/stores/membershipStore';

const { Title, Text, Paragraph } = Typography;

// AI小说工作区集成示例
const AINovelWorkspaceIntegration: React.FC = () => {
  const { membershipInfo, useAI, checkAIGenerationPermission } = useMembership();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [requiredLevel, setRequiredLevel] = useState<MembershipLevel>(MembershipLevel.BASIC);
  const [dailyUsage, setDailyUsage] = useState({ used: 0, limit: 10 });

  // 初始化每日使用情况
  useEffect(() => {
    setDailyUsage({
      used: membershipInfo.aiGenerationUsed,
      limit: membershipInfo.aiGenerationLimit
    });
  }, [membershipInfo]);

  // 模拟AI生成 - 小说内容创作
  const simulateContentGeneration = async () => {
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
      const sampleContent = `【小说内容生成示例】

标题：星际探索者

在遥远的未来，人类已经掌握了星际旅行的技术。一艘名为"希望号"的探索飞船正在穿越未知的星系，寻找适合人类居住的新家园。

船上的AI助手"阿尔法"突然检测到前方星系中存在异常的能量波动。船长李明决定前往调查，这可能会改变人类的命运...

【情节发展建议】
1. 描述飞船接近异常星系时的紧张氛围
2. 展现船员们面对未知时的不同反应
3. 揭示能量波动背后的神秘真相
4. 设计一个出人意料但合理的结局

（这是AI生成的示例内容，实际使用中会根据您的具体需求生成相关内容）`;
      
      setGeneratedContent(sampleContent);
      setIsGenerating(false);
      message.success('小说内容生成成功！');
      
      // 更新使用情况
      setDailyUsage(prev => ({
        ...prev,
        used: prev.used + 1
      }));
    }, 3000);
  };

  // 模拟AI生成 - 角色设定
  const simulateCharacterGeneration = async () => {
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
      const sampleContent = `【角色设定生成示例】

【角色设定1：李明】
---
【基本信息】
【名称】：李明
【角色类型】：主角
【标签】：船长、勇敢、智慧、责任感强
【描述】：希望号探索飞船的船长，拥有丰富的星际航行经验

【外貌特征】
年龄：35岁
身高：180cm
特征：深邃的眼神，坚毅的面部轮廓，左眉角有一道细小的疤痕

【性格特质】
优点：勇敢果断、富有领导力、关心船员
缺点：有时过于固执、承受巨大压力

【背景故事】
曾是地球联合舰队的优秀军官，因一次任务失败而主动申请加入深空探索计划

【能力设定】
专业技能：星际航行、危机处理、领导指挥
特殊能力：敏锐的直觉、快速决策能力

【人际关系】
与AI助手阿尔法建立了深厚的友谊
受到大部分船员的尊敬和信任

【角色发展弧光】
从独自承担重任到学会信任团队，最终成长为真正的领袖

【细节补充】
喜欢在思考时凝视星空，有一个女儿在地球上等待他归来
---
（这是AI生成的示例内容，实际使用中会根据您的具体需求生成相关内容）`;
      
      setGeneratedContent(sampleContent);
      setIsGenerating(false);
      message.success('角色设定生成成功！');
      
      // 更新使用情况
      setDailyUsage(prev => ({
        ...prev,
        used: prev.used + 1
      }));
    }, 3000);
  };

  // 模拟AI生成 - 世界观设定
  const simulateWorldSettingGeneration = async () => {
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
      const sampleContent = `【世界观设定生成示例】

【科技设定1：星际航行技术】
---
【基本信息】
【名称】：量子跃迁引擎
【标签】：能源、交通、高科技
【描述】：人类实现星际旅行的核心技术

【科技水平】
发展阶段：成熟期
核心技术：量子纠缠原理、空间折叠技术
发展时间线：2150年首次理论突破，2180年实现商用

【应用场景】
主要用途：星际航行、物资运输、探索未知星系
应用领域：民用航天、军事防御、科研探索

【使用限制】
能源需求：需要大量反物质作为燃料
副作用：长期使用可能对时空结构产生微小影响
伦理考量：技术垄断可能导致星际霸权

【社会影响】
对社会的影响：彻底改变了人类的生存空间，促进了星际文明的发展
原创性考量：该技术基于人类自主研究，未涉及外星技术抄袭

【细节补充】
量子跃迁引擎的发明者是著名的物理学家陈博士，他在一次实验事故中意外发现了空间折叠的奥秘
---
（这是AI生成的示例内容，实际使用中会根据您的具体需求生成相关内容）`;
      
      setGeneratedContent(sampleContent);
      setIsGenerating(false);
      message.success('世界观设定生成成功！');
      
      // 更新使用情况
      setDailyUsage(prev => ({
        ...prev,
        used: prev.used + 1
      }));
    }, 3000);
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
      (dailyUsage.used / dailyUsage.limit) * 100
    );

    return (
      <Card size="small" title="AI使用统计" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>今日AI生成次数：</Text>
            <Text>{dailyUsage.used !== undefined ? dailyUsage.used : 0} / {dailyUsage.limit === Infinity ? '无限制' : (dailyUsage.limit !== undefined ? dailyUsage.limit : 0)}</Text>
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

  // 渲染功能说明
  const renderFeatureInfo = () => {
    return (
      <Alert
        message="会员功能说明"
        description={
          <div>
            <Paragraph>
              <Text strong>免费会员：</Text>
              每日限制10次AI生成，适合体验基本功能
            </Paragraph>
            <Paragraph>
              <Text strong>基础会员：</Text>
              每日限制100次AI生成，支持更多创作需求
            </Paragraph>
            <Paragraph>
              <Text strong>专业会员：</Text>
              无限制AI生成，享受所有高级功能
            </Paragraph>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />
    );
  };

  return (
    <div>
      {renderMembershipInfo()}
      {renderAIUsageStats()}
      {renderFeatureInfo()}

      <Card title="AI小说创作工具">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>内容创作功能</Title>
          
          <Space wrap>
            <PermissionWrapper
              feature="unlimited_ai_generation"
              showUpgradeButton={true}
              onUpgrade={(level) => handleUpgrade('unlimited_ai_generation', level as MembershipLevel)}
            >
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={simulateContentGeneration}
                loading={isGenerating}
                disabled={isGenerating || dailyUsage.used >= dailyUsage.limit}
              >
                {isGenerating ? '生成中...' : '生成小说内容'}
              </Button>
            </PermissionWrapper>

            <PermissionWrapper
              feature="unlimited_ai_generation"
              showUpgradeButton={true}
              onUpgrade={(level) => handleUpgrade('unlimited_ai_generation', level as MembershipLevel)}
            >
              <Button
                icon={<ThunderboltOutlined />}
                onClick={simulateCharacterGeneration}
                loading={isGenerating}
                disabled={isGenerating || dailyUsage.used >= dailyUsage.limit}
              >
                {isGenerating ? '生成中...' : '生成角色设定'}
              </Button>
            </PermissionWrapper>

            <PermissionWrapper
              feature="unlimited_ai_generation"
              showUpgradeButton={true}
              onUpgrade={(level) => handleUpgrade('unlimited_ai_generation', level as MembershipLevel)}
            >
              <Button
                icon={<ThunderboltOutlined />}
                onClick={simulateWorldSettingGeneration}
                loading={isGenerating}
                disabled={isGenerating || dailyUsage.used >= dailyUsage.limit}
              >
                {isGenerating ? '生成中...' : '生成世界观设定'}
              </Button>
            </PermissionWrapper>
          </Space>

          {generatedContent && (
            <Card size="small" title="生成结果" style={{ marginTop: 16 }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'initial' }}>
                {generatedContent}
              </pre>
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

export default AINovelWorkspaceIntegration;