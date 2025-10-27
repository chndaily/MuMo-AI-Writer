import React, { useEffect } from 'react';
import WorldElementPanel from '@/components/world/WorldElementPanel';
import { locationConfig } from '@/components/world/configs/locationConfig';
import { useLocation } from 'react-router-dom';

interface LocationPanelProps {
  aiSyncData?: any;
  novelId?: string;
}

const LocationPanel: React.FC<LocationPanelProps> = ({ aiSyncData, novelId }) => {
  const location = useLocation();

  // 处理URL参数，自动打开特定地点的编辑对话框
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const locationId = searchParams.get('locationId');
    
    // 如果有locationId参数，可以在这里触发自动打开编辑对话框的逻辑
    if (locationId && aiSyncData) {
      aiSyncData.locationId = locationId;
    }
  }, [location.search, aiSyncData]);

  return (
    <WorldElementPanel
      {...locationConfig}
      novelId={novelId}
      aiSyncData={aiSyncData}
    />
  );
};

export default LocationPanel;