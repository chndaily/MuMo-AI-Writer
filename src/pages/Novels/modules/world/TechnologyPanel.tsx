import React from 'react';
import WorldElementPanel from '@/components/world/WorldElementPanel';
import { technologyConfig } from '@/components/world/configs/technologyConfig';

interface TechnologyPanelProps {
  aiSyncData?: any;
  novelId?: string;
}

const TechnologyPanel: React.FC<TechnologyPanelProps> = ({ aiSyncData, novelId }) => {
  return (
    <WorldElementPanel
      {...technologyConfig}
      novelId={novelId}
      aiSyncData={aiSyncData}
    />
  );
};

export default TechnologyPanel;