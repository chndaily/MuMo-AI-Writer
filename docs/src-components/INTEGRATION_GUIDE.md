# 会员体系与小说系统集成指南

本文档详细说明如何将会员体系与小说创作系统集成，实现基于会员等级的功能权限控制。

## 1. 系统架构概述

### 1.1 核心组件
- `membershipStore.ts`: 会员状态管理
- `useMembership.ts`: 权限检查Hook
- `PermissionWrapper.tsx`: 权限包装组件
- `withMembership.tsx`: 高阶组件权限控制
- `UpgradePrompt.tsx`: 升级提示模态框

### 1.2 会员等级与权限
```
免费会员 (FREE):
- 每日AI生成次数: 10次
- 小说创建数量: 3本
- 基础编辑功能
- TXT/Markdown导出

基础会员 (BASIC):
- 每日AI生成次数: 100次
- 无限制小说创建
- 增强AI生成
- 所有导出格式
- 拼写检查
- 写作统计
- 基础云同步

专业会员 (PROFESSIONAL):
- 无限制AI生成
- 关系可视化工具
- 高级导出功能
- 完整云同步
- 优先客服支持
- 新功能优先体验
- 团队协作功能
```

## 2. 集成实现方式

### 2.1 Hook方式集成
```typescript
import { useMembership } from '@/hooks/useMembership';

const MyComponent = () => {
  const { checkPermission, useAI, isProfessional } = useMembership();
  
  // 检查特定功能权限
  const canUseVisualization = checkPermission('visualization_tools');
  
  // 使用AI生成功能
  const handleAIGenerate = async () => {
    const result = useAI();
    if (result.success) {
      // 执行AI生成逻辑
    } else {
      // 显示限制提示
      message.warning(result.reason);
    }
  };
  
  return (
    <div>
      {isProfessional && <AdvancedFeature />}
    </div>
  );
};
```

### 2.2 组件包装方式集成
```typescript
import PermissionWrapper from '@/components/membership/PermissionWrapper';

const NovelWorkspace = () => {
  return (
    <div>
      {/* 基础功能，所有用户可见 */}
      <BasicEditor />
      
      {/* 仅专业会员可见的高级功能 */}
      <PermissionWrapper feature="visualization_tools">
        <VisualizationPanel />
      </PermissionWrapper>
      
      {/* 权限不足时显示升级按钮 */}
      <PermissionWrapper 
        feature="unlimited_ai_generation"
        showUpgradeButton={true}
        onUpgrade={(level) => handleUpgrade(level)}
      >
        <AIGenerationButton />
      </PermissionWrapper>
    </div>
  );
};
```

### 2.3 高阶组件方式集成
```typescript
import { withMembership } from '@/components/membership/withMembership';

const AdvancedFeature = ({ membershipInfo }) => {
  return <div>仅专业会员可见的高级功能</div>;
};

// 限制为专业会员使用
export default withMembership(AdvancedFeature, 'professional');
```

## 3. AI生成功能集成示例

### 3.1 在AI小说工作区中集成
```typescript
// AINovelWorkspace.tsx
import { useMembership } from '@/hooks/useMembership';

const AINovelWorkspace = () => {
  const { checkAIGenerationPermission, useAI } = useMembership();
  
  const handleAIGenerate = async (prompt: string) => {
    // 检查AI使用权限
    const permission = checkAIGenerationPermission();
    if (!permission.allowed) {
      message.warning(permission.reason);
      return;
    }
    
    // 使用AI生成次数
    const useResult = useAI();
    if (!useResult.success) {
      message.warning(useResult.reason);
      return;
    }
    
    // 执行AI生成逻辑
    try {
      const result = await generateTextStream(prompt);
      // 处理生成结果
    } catch (error) {
      message.error('AI生成失败');
    }
  };
  
  return (
    <div>
      <AIControlPanel onStartGenerate={handleAIGenerate} />
    </div>
  );
};
```

### 3.2 显示AI使用统计
```typescript
const AIUsageStats = () => {
  const { membershipInfo } = useMembership();
  const usagePercent = (membershipInfo.aiGenerationUsed / membershipInfo.aiGenerationLimit) * 100;
  
  return (
    <Card title="AI使用统计">
      <Progress percent={usagePercent} />
      <Text>
        今日已使用: {membershipInfo.aiGenerationUsed} / {membershipInfo.aiGenerationLimit}
      </Text>
    </Card>
  );
};
```

## 4. 团队协作功能集成

### 4.1 团队功能权限检查
```typescript
import { useMembership } from '@/hooks/useMembership';

const TeamCollaboration = () => {
  const { checkPermission, membershipInfo } = useMembership();
  
  // 检查是否有团队功能权限
  const canUseTeamFeature = checkPermission('team_collaboration');
  
  if (!canUseTeamFeature) {
    return (
      <PermissionWrapper 
        feature="team_collaboration"
        showUpgradeButton={true}
        onUpgrade={(level) => handleUpgrade(level)}
      >
        <div>团队协作功能需要专业会员</div>
      </PermissionWrapper>
    );
  }
  
  return <TeamManagementPanel />;
};
```

## 5. 导出功能权限控制

### 5.1 根据会员等级限制导出格式
```typescript
const ExportOptions = () => {
  const { isBasic, isProfessional } = useMembership();
  
  const exportFormats = [
    { format: 'txt', label: 'TXT格式', enabled: true },
    { format: 'markdown', label: 'Markdown格式', enabled: true },
    { format: 'pdf', label: 'PDF格式', enabled: isBasic || isProfessional },
    { format: 'epub', label: 'EPUB格式', enabled: isProfessional },
    { format: 'html', label: 'HTML格式', enabled: isProfessional }
  ];
  
  return (
    <Select>
      {exportFormats
        .filter(format => format.enabled)
        .map(format => (
          <Select.Option key={format.format} value={format.format}>
            {format.label}
          </Select.Option>
        ))
      }
    </Select>
  );
};
```

## 6. 升级提示集成

### 6.1 使用升级提示组件
```typescript
import UpgradePrompt from '@/components/membership/UpgradePrompt';

const FeatureWithUpgrade = () => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setShowUpgrade(true)}>
        需要专业会员的功能
      </Button>
      
      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="advanced_export"
        requiredLevel={MembershipLevel.PROFESSIONAL}
      />
    </div>
  );
};
```

## 7. 最佳实践

### 7.1 权限检查位置
- 在功能调用前进行权限检查
- 在UI渲染时进行权限控制
- 提供清晰的升级引导

### 7.2 用户体验优化
- 显示明确的权限限制信息
- 提供直观的升级按钮
- 保留用户操作上下文

### 7.3 错误处理
- 优雅处理权限不足情况
- 提供友好的错误提示
- 引导用户进行升级

## 8. 测试要点

### 8.1 功能测试
- 验证各会员等级的功能权限
- 测试AI生成次数限制
- 验证升级流程

### 8.2 UI测试
- 检查权限控制组件显示
- 验证升级提示模态框
- 测试响应式设计

通过以上集成方式，可以有效地将会员体系与小说创作系统结合，为不同等级的用户提供相应的功能权限，同时提供清晰的升级路径。