import React from 'react';
import { Card, Space, Select, Radio, Slider, Input, Button, Alert, Typography } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClearOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { AIGenerationType } from '@/types/ai-generation';
import { message } from 'antd';

const { Option } = Select;
const { TextArea } = Input;
const { Paragraph } = Typography;

interface AIControlPanelProps {
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
}

const AIControlPanel: React.FC<AIControlPanelProps> = ({
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
  onInsertToCanvas
}) => {
  return (
    <Card size="small" title="AI创作助手">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <div style={{ marginBottom: 8 }}><strong>生成类型：</strong></div>
          <Select
            value={generationType}
            onChange={onGenerationTypeChange}
            style={{ width: '100%' }}
          >
            <Option value="content">内容创作</Option>
            <Option value="optimize">内容优化</Option>
            <Option value="plot">情节发展</Option>
            <Option value="outline">大纲生成</Option>
            <Option value="character">角色设定</Option>
            <Option value="location">地点设定</Option>
            <Option value="culture">文化设定</Option>
            <Option value="technology">科技设定</Option>
            <Option value="magic">魔法设定</Option>
            <Option value="history">历史设定</Option>
          </Select>
        </div>
        
        <div>
          <div style={{ marginBottom: 8 }}><strong>创作模式：</strong></div>
          <Radio.Group 
            value={aiMode} 
            onChange={onAiModeChange}
            style={{ width: '100%' }}
          >
            <Radio.Button value="free">自由创作</Radio.Button>
            <Radio.Button value="style">风格模仿</Radio.Button>
            <Radio.Button value="fill">续写填充</Radio.Button>
          </Radio.Group>
        </div>
        
        <div>
          <div style={{ marginBottom: 8 }}><strong>创造力 ({temperature})：</strong></div>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={temperature}
            onChange={onTemperatureChange}
          />
        </div>
        
        <div>
          <div style={{ marginBottom: 8 }}><strong>写作风格：</strong></div>
          <Select
            value={writingStyle}
            onChange={onWritingStyleChange}
            style={{ width: '100%' }}
          >
            <Option value="default">默认</Option>
            <Option value="literary">文学性</Option>
            <Option value="simple">简洁明了</Option>
            <Option value="detailed">详细描述</Option>
            <Option value="humorous">幽默风趣</Option>
            <Option value="serious">严肃正经</Option>
          </Select>
        </div>
        
        <div>
          <div style={{ marginBottom: 8 }}><strong>自定义提示词：</strong></div>
          <TextArea
            value={customPrompt}
            onChange={onCustomPromptChange}
            placeholder="请输入您的创作需求..."
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </div>
        
        <Space>
          <Button
            type="primary"
            icon={isAIGenerating ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => isAIGenerating ? onStopGenerate() : onStartGenerate(customPrompt)}
            disabled={!customPrompt.trim() || !selectedConfigId}
            loading={isAIGenerating && !llmStreaming}
          >
            {isAIGenerating ? '停止生成' : '开始创作'}
          </Button>
          
          <Button
            icon={<ClearOutlined />}
            onClick={onClearPrompt}
          >
            清空
          </Button>
        </Space>
        
        {llmError && (
          <Alert
            message="AI生成错误"
            description={llmError}
            type="error"
            showIcon
          />
        )}
        
        {/* 实时预览 */}
        <Card size="small" title="实时预览" style={{ marginTop: 16 }}>
          <div style={{ minHeight: 100 }}>
            {llmResponse ? (
              <Paragraph ellipsis={{ rows: 4, expandable: true, symbol: '展开' }}>
                {llmResponse}
              </Paragraph>
            ) : (
              <div style={{ color: '#999' }}>AI生成的内容将在此处预览</div>
            )}
          </div>
          {llmStreaming && (
            <div style={{ textAlign: 'center', marginTop: 8, color: '#999' }}>
              AI正在思考中...
            </div>
          )}
          {/* 添加插入画布按钮 */}
          {llmResponse && !llmStreaming && (
            <div style={{ marginTop: 12 }}>
              <Button 
                type="primary" 
                icon={<FileTextOutlined />}
                onClick={() => {
                  onInsertToCanvas(llmResponse);
                  message.success('内容已插入到创意画布中');
                }}
                size="small"
              >
                插入到画布
              </Button>
            </div>
          )}
        </Card>
      </Space>
    </Card>
  );
};

export default AIControlPanel;