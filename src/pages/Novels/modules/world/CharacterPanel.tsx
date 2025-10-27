import React, { useEffect } from "react";
import WorldElementPanel from "@/components/world/WorldElementPanel";
import { characterConfig } from "@/components/world/configs/characterConfig";
import { useLocation } from "react-router-dom";

interface CharacterPanelProps {
  aiSyncData?: any;
  novelId?: string;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ aiSyncData, novelId }) => {
  const location = useLocation();

  // 处理URL参数，自动打开特定角色的编辑对话框
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const characterId = searchParams.get('characterId');
    
    // 如果有characterId参数，可以在这里触发自动打开编辑对话框的逻辑
    // 但由于WorldElementPanel是封装组件，我们需要通过aiSyncData或其他方式传递信息
    if (characterId && aiSyncData) {
      // 可以将characterId添加到aiSyncData中，以便WorldElementPanel处理
      aiSyncData.characterId = characterId;
    }
  }, [location.search, aiSyncData]);

  return (
    <WorldElementPanel
      {...characterConfig}
      novelId={novelId}
      aiSyncData={aiSyncData}
    />
  );
};

export default CharacterPanel;