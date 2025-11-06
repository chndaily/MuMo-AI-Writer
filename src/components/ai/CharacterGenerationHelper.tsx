import React, { useState, useEffect } from 'react';
import { Modal, Button, message, Typography, Tabs, Input, Card, List, Checkbox, Row, Col } from 'antd';
import { extractCharactersFromOutline } from '../../utils/outlineCharacterExtractor';
import type { NovelOutline } from '../../../types/novel';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface CharacterGenerationHelperProps {
  visible: boolean;
  outline?: NovelOutline | null;  // 设为可选属性
  novelId: string;
  onCancel: () => void;
  onGenerateRequest: (characterNames: string[]) => void;
}

const CharacterGenerationHelper: React.FC<CharacterGenerationHelperProps> = ({
  visible,
  outline,  // 接收但不使用
  novelId,
  onCancel,
  onGenerateRequest
}) => {
  const [activeTab, setActiveTab] = useState<'manual'>('manual');
  const [manualCharacters, setManualCharacters] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<string[]>([]);

  // 移除大纲角色提取相关逻辑，因为我们决定取消这个功能

  const handleGenerate = () => {
    let charactersToGenerate: string[] = [];
    
    // 只保留手动输入模式
    if (!manualCharacters.trim()) {
      message.warning('请输入至少一个角色名称');
      return;
    }
    charactersToGenerate = manualCharacters.split(/[,\n，、]/).map(name => name.trim()).filter(name => name);
    
    if (charactersToGenerate.length === 0) {
      message.warning('请指定要生成的角色');
      return;
    }
    
    onGenerateRequest(charactersToGenerate);
    onCancel();
  };

  return (
    <Modal
      title="角色生成助手"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="generate" type="primary" onClick={handleGenerate}>生成角色设定</Button>
      ]}
      width={800}
    >
      <div style={{ padding: '16px 0' }}>
        <Text>请输入要生成的角色名称，多个角色请用逗号或换行分隔：</Text>
        <TextArea
          value={manualCharacters}
          onChange={(e) => setManualCharacters(e.target.value)}
          placeholder="例如：张三, 李四&#10;王五&#10;赵六"
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
            为了获得最佳的生成效果，请在自定义提示词中包含以下要素：
            <br />1. 完整的小说背景和大纲信息
            <br />2. 明确要求角色与情节强绑定
            <br />3. 指定角色的分类和相互关系
            <br />4. 强调避免生成重复角色
            <br />5. 要求设定符合小说世界观
            <br />6. 根据角色在大纲中的出场顺序进行细节补充
          </Text>
        </Card>
      </div>
    </Modal>
  );
};

export default CharacterGenerationHelper;