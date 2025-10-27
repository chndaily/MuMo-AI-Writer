import React from 'react';
import { Card, Space, Button, Divider } from 'antd';
import {
  CompassOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  SoundOutlined
} from '@ant-design/icons';
import AIControlPanel from './AIControlPanel';
import { AIGenerationType } from '@/types/ai-generation';

interface ControlTowerProps {
  generationType: AIGenerationType;
  aiMode: 'free' | 'style' | 'fill';
  temperature: number;
  writingStyle: string;
  customPrompt: string;
  selectedConfigId: string | undefined;
  isAIGenerating: boolean;
  llmStreaming: boolean;
  llmError: string | null;
  llmResponse: string | null;
  onGenerationTypeChange: (value: AIGenerationType) => void;
  onAiModeChange: (e: any) => void;
  onTemperatureChange: (value: number) => void;
  onWritingStyleChange: (value: string) => void;
  onCustomPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onStartGenerate: (prompt: string) => void;
  onStopGenerate: () => void;
  onClearPrompt: () => void;
  onInsertToCanvas: (content: string) => void;
  onInsertTextAtCursor: (text: string) => void;
}

const ControlTower: React.FC<ControlTowerProps> = ({
  generationType,
  aiMode,
  temperature,
  writingStyle,
  customPrompt,
  selectedConfigId,
  isAIGenerating,
  llmStreaming,
  llmError,
  llmResponse,
  onGenerationTypeChange,
  onAiModeChange,
  onTemperatureChange,
  onWritingStyleChange,
  onCustomPromptChange,
  onStartGenerate,
  onStopGenerate,
  onClearPrompt,
  onInsertToCanvas,
  onInsertTextAtCursor
}) => {
  return (
    <div className="control-tower">
      <div className="area-header">
        <h3>智能控制塔</h3>
      </div>
      <div className="control-content">
        <AIControlPanel
          generationType={generationType}
          aiMode={aiMode}
          temperature={temperature}
          writingStyle={writingStyle}
          customPrompt={customPrompt}
          selectedConfigId={selectedConfigId}
          isAIGenerating={isAIGenerating}
          llmStreaming={llmStreaming}
          llmError={llmError}
          llmResponse={llmResponse}
          onGenerationTypeChange={onGenerationTypeChange}
          onAiModeChange={onAiModeChange}
          onTemperatureChange={onTemperatureChange}
          onWritingStyleChange={onWritingStyleChange}
          onCustomPromptChange={onCustomPromptChange}
          onStartGenerate={onStartGenerate}
          onStopGenerate={onStopGenerate}
          onClearPrompt={onClearPrompt}
          onInsertToCanvas={onInsertToCanvas}
        />
        
        <Divider />
        
        <Card size="small" title="创作助手" style={{ marginTop: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              block 
              icon={<CompassOutlined />}
              onClick={() => onInsertTextAtCursor('[情节转折点]')}
            >
              插入情节转折
            </Button>
            <Button 
              block 
              icon={<TeamOutlined />}
              onClick={() => onInsertTextAtCursor('[角色出场]')}
            >
              插入角色出场
            </Button>
            <Button 
              block 
              icon={<EnvironmentOutlined />}
              onClick={() => onInsertTextAtCursor('[场景转换]')}
            >
              插入场景转换
            </Button>
            <Button 
              block 
              icon={<SoundOutlined />}
              onClick={() => onInsertTextAtCursor('[对话开始]')}
            >
              插入对话开始
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default ControlTower;