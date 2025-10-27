import React, { useEffect } from 'react';
import { useNovelPromptLibraryStore } from '@/stores/novelPromptLibraryStore';
import NovelPromptsCustomLayout from './NovelPromptsCustomLayout'; // 使用小说特定的布局组件
import { useParams } from 'react-router-dom';

const NovelPromptsLayout: React.FC = () => {
  const { collections, initialize, novelId } = useNovelPromptLibraryStore();
  const { novelId: routeNovelId } = useParams<{ novelId: string }>();
  
  // 初始化小说特定提示词库数据
  useEffect(() => {
    if (routeNovelId) {
      initialize(routeNovelId);
    }
  }, [initialize, routeNovelId]);

  // 使用小说特定的布局组件，确保数据隔离
  return <NovelPromptsCustomLayout />;
};

export default NovelPromptsLayout;