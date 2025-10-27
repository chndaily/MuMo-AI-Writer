import React from 'react';
import WorldElementPanel from '@/components/world/WorldElementPanel';
import { historyConfig } from '@/components/world/configs/historyConfig';

interface HistoryPanelProps {
  aiSyncData?: any;
  novelId?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ aiSyncData, novelId }) => {
  return (
    <WorldElementPanel
      {...historyConfig}
      novelId={novelId}
      aiSyncData={aiSyncData}
    />
  );
};

export default HistoryPanel;