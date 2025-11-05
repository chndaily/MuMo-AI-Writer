import React, { useState } from 'react';
import { Modal, Button, message, Typography, Input, Card } from 'antd';
import type { WorldSettingType } from '@/types/ai-generation';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface WorldSettingGenerationHelperProps {
  visible: boolean;
  novelId: string;
  settingType: WorldSettingType;
  onCancel: () => void;
  onGenerateRequest: (settingNames: string[]) => void;
}

const WorldSettingGenerationHelper: React.FC<WorldSettingGenerationHelperProps> = ({
  visible,
  novelId,
  settingType,
  onCancel,
  onGenerateRequest
}) => {
  const [manualSettings, setManualSettings] = useState('');

  const getSettingTypeName = () => {
    switch (settingType) {
      case 'location': return '地点';
      case 'culture': return '文化';
      case 'technology': return '科技';
      case 'magic': return '魔法';
      case 'history': return '历史';
      default: return '设定';
    }
  };

  const handleGenerate = () => {
    if (!manualSettings.trim()) {
      message.warning(`请输入至少一个${getSettingTypeName()}名称`);
      return;
    }
    
    const settingsToGenerate = manualSettings.split(/[,\n，、]/).map(name => name.trim()).filter(name => name);
    
    if (settingsToGenerate.length === 0) {
      message.warning(`请指定要生成的${getSettingTypeName()}`);
      return;
    }
    
    onGenerateRequest(settingsToGenerate);
    onCancel();
  };

  const getPlaceholder = () => {
    const typeName = getSettingTypeName();
    return `例如：${typeName}A, ${typeName}B\n${typeName}C\n${typeName}D`;
  };

  const getPromptSuggestion = () => {
    switch (settingType) {
      case 'location':
        return [
          "为了获得最佳的生成效果，请在自定义提示词中包含以下要素：",
          "1. 完整的小说背景和大纲信息",
          "2. 明确要求地点与情节强绑定",
          "3. 指定地点的类型和重要性",
          "4. 强调避免生成重复地点",
          "5. 要求设定符合小说世界观"
        ].join('<br />');
      case 'culture':
        return [
          "为了获得最佳的生成效果，请在自定义提示词中包含以下要素：",
          "1. 完整的小说背景和大纲信息",
          "2. 明确要求文化设定与情节强绑定",
          "3. 指定文化的特点和影响范围",
          "4. 强调避免生成重复文化设定",
          "5. 要求设定符合小说世界观"
        ].join('<br />');
      case 'technology':
        return [
          "为了获得最佳的生成效果，请在自定义提示词中包含以下要素：",
          "1. 完整的小说背景和大纲信息",
          "2. 明确要求科技设定与情节强绑定",
          "3. 指定科技的水平和应用领域",
          "4. 强调避免生成重复科技设定",
          "5. 要求设定符合小说世界观"
        ].join('<br />');
      case 'magic':
        return [
          "为了获得最佳的生成效果，请在自定义提示词中包含以下要素：",
          "1. 完整的小说背景和大纲信息",
          "2. 明确要求魔法设定与情节强绑定",
          "3. 指定魔法体系的特点和规则",
          "4. 强调避免生成重复魔法设定",
          "5. 要求设定符合小说世界观"
        ].join('<br />');
      case 'history':
        return [
          "为了获得最佳的生成效果，请在自定义提示词中包含以下要素：",
          "1. 完整的小说背景和大纲信息",
          "2. 明确要求历史设定与情节强绑定",
          "3. 指定历史时期的特点和影响",
          "4. 强调避免生成重复历史设定",
          "5. 要求设定符合小说世界观"
        ].join('<br />');
      default:
        return [
          "为了获得最佳的生成效果，请在自定义提示词中包含以下要素：",
          "1. 完整的小说背景和大纲信息",
          "2. 明确要求设定与情节强绑定",
          "3. 指定设定的特点和作用",
          "4. 强调避免生成重复设定",
          "5. 要求设定符合小说世界观"
        ].join('<br />');
    }
  };

  // 解析提示词建议为JSX元素数组
  const renderPromptSuggestion = () => {
    const suggestions = getPromptSuggestion().split('<br />');
    return suggestions.map((suggestion, index) => (
      <div key={index} dangerouslySetInnerHTML={{ __html: suggestion }} />
    ));
  };

  // 即使不可见也渲染Modal，这样可以避免页面空白
  return (
    <Modal
      title={`${getSettingTypeName()}生成助手`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="generate" type="primary" onClick={handleGenerate}>生成{getSettingTypeName()}设定</Button>
      ]}
      width={800}
      // 即使不可见也渲染组件，避免页面空白
      forceRender={true}
    >
      <div style={{ padding: '16px 0' }}>
        <Text>请输入要生成的{getSettingTypeName()}名称，多个{getSettingTypeName()}请用逗号或换行分隔：</Text>
        <TextArea
          value={manualSettings}
          onChange={(e) => setManualSettings(e.target.value)}
          placeholder={getPlaceholder()}
          autoSize={{ minRows: 4, maxRows: 6 }}
          style={{ marginTop: 8 }}
        />
        
        <Card 
          size="small" 
          title="提示词编写建议" 
          style={{ marginTop: 16 }}
          styles={{ header: { fontSize: '14px' } }}
        >
          <Text type="secondary">
            {renderPromptSuggestion()}
          </Text>
        </Card>
      </div>
    </Modal>
  );
};

export default WorldSettingGenerationHelper;