import React from 'react';
import { Button, Space, Input } from 'antd';
import {
  BranchesOutlined,
  BulbOutlined
} from '@ant-design/icons';
import SyncPanel from '@/components/novel/SyncPanel';
import { Novel } from '#/novel';
import { AIGenerationType } from '@/types/ai-generation';

const { TextArea } = Input;

interface CanvasAreaProps {
  content: string;
  targetNovel: Novel | null;
  generationType: AIGenerationType;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  onToggleStoryMap: () => void;
  onToggleInspirationPanel: () => void;
  onContentChange: (value: string) => void;
  onCursorChange: () => void;
  onSyncComplete: (result: any) => void;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({
  content,
  targetNovel,
  generationType,
  textAreaRef,
  onToggleStoryMap,
  onToggleInspirationPanel,
  onContentChange,
  onCursorChange,
  onSyncComplete
}) => {
  return (
    <div className="canvas-area">
      <div className="area-header">
        <h3>创意画布</h3>
        <Space>
          <Button 
            size="small" 
            icon={<BranchesOutlined />}
            onClick={onToggleStoryMap}
          >
            故事地图
          </Button>
          <Button 
            size="small" 
            icon={<BulbOutlined />}
            onClick={onToggleInspirationPanel}
          >
            创作灵感
          </Button>
        </Space>
      </div>
      <div className="canvas-content">
        <TextArea
          ref={textAreaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onSelect={onCursorChange}
          onClick={onCursorChange}
          onKeyUp={onCursorChange}
          placeholder="在这里开始您的创作之旅..."
          autoSize={{ minRows: 20 }}
        />
      </div>
      {targetNovel && content && (
        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
          <SyncPanel
            content={content}
            novel={targetNovel}
            generationType={generationType}
            onSync={onSyncComplete}
          />
        </div>
      )}
    </div>
  );
};

export default CanvasArea;