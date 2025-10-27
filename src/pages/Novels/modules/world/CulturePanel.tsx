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
import { cultureConfig } from '@/components/world/configs/cultureConfig';

interface CulturePanelProps {
  aiSyncData?: any;
  novelId?: string;
}

const CulturePanel: React.FC<CulturePanelProps> = ({ aiSyncData, novelId }) => {
  return (
    <WorldElementPanel
      {...cultureConfig}
      novelId={novelId}
      aiSyncData={aiSyncData}
    />
  );
};

export default CulturePanel;