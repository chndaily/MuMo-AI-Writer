import React from 'react';
import { 
  PlusOutlined, 
  SaveOutlined, 
  SyncOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { hybridStorageService } from '@/services/hybridStorageService';
import { WorldSetting } from '#/novel';
import { generateUUID } from '@/utils/uuidUtils';
import WorldElementPanel from '@/components/world/WorldElementPanel';
import { magicConfig } from '@/components/world/configs/magicConfig';

interface MagicPanelProps {
  aiSyncData?: any;
  novelId?: string;
}

const MagicPanel: React.FC<MagicPanelProps> = ({ aiSyncData, novelId }) => {
  return (
    <WorldElementPanel
      {...magicConfig}
      novelId={novelId}
      aiSyncData={aiSyncData}
    />
  );
};

export default MagicPanel;