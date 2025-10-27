import React from 'react';
import { Button, Input } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ImmersiveOverlayProps {
  isImmersiveMode: boolean;
  content: string;
  onContentChange: (value: string) => void;
  onToggleImmersiveMode: () => void;
}

const ImmersiveOverlay: React.FC<ImmersiveOverlayProps> = ({
  isImmersiveMode,
  content,
  onContentChange,
  onToggleImmersiveMode
}) => {
  if (!isImmersiveMode) return null;
  
  return (
    <div className="immersion-overlay">
      <div className="immersion-content">
        <TextArea
          className="immersion-canvas"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="沉浸创作模式..."
          autoSize={{ minRows: 20 }}
        />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button 
            type="primary" 
            icon={<CloseOutlined />}
            onClick={onToggleImmersiveMode}
            size="large"
          >
            退出沉浸模式
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImmersiveOverlay;