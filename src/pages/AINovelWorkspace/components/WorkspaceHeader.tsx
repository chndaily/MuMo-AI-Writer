import React from 'react';
import { Button, Space, Select } from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import BookSelector from '@/components/novel/BookSelector';
import { Novel } from '#/novel';
import { LLMConfig } from '#/llm';

const { Option } = Select;

interface WorkspaceHeaderProps {
  currentNovel: Novel | null;
  targetNovel: Novel | null;
  configs: LLMConfig[];
  selectedConfigId: string | undefined;
  isImmersiveMode: boolean;
  bookSelectorRef: React.RefObject<any>;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleImmersiveMode: () => void;
  onBookSelect: (novelId: string, novel: Novel) => void;
  onConfigChange: (value: string) => void;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  currentNovel,
  targetNovel,
  configs,
  selectedConfigId,
  isImmersiveMode,
  bookSelectorRef,
  onSave,
  onUndo,
  onRedo,
  onToggleImmersiveMode,
  onBookSelect,
  onConfigChange
}) => {
  return (
    <div className="workspace-header">
      <Space>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={onSave}
          disabled={!currentNovel}
        >
          保存
        </Button>
        <Button icon={<UndoOutlined />} onClick={onUndo}>撤销</Button>
        <Button icon={<RedoOutlined />} onClick={onRedo}>重做</Button>
        <Button 
          icon={isImmersiveMode ? <EyeOutlined /> : <EditOutlined />} 
          onClick={onToggleImmersiveMode}
        >
          {isImmersiveMode ? '退出沉浸' : '沉浸模式'}
        </Button>
      </Space>
      <div className="header-right">
        <BookSelector 
          ref={bookSelectorRef}
          onSelect={onBookSelect}
          selectedNovelId={targetNovel?.id}
        />
        <Select
          value={selectedConfigId}
          onChange={onConfigChange}
          placeholder="选择AI模型"
          style={{ width: 150 }}
        >
          {configs.map(config => (
            <Option key={config.id} value={config.id}>
              {config.name}
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default WorkspaceHeader;