import React from 'react';
import { usePromptLibraryStore } from '@/stores/promptLibraryStore';
import { CollectionType, PromptType } from '#/promptLibrary';

const TestPage: React.FC = () => {
  const { collections } = usePromptLibraryStore();
  
  // 按类型分组显示集合
  const groupedCollections: Record<string, any[]> = {};
  
  collections.forEach(collection => {
    const type = collection.type;
    if (!groupedCollections[type]) {
      groupedCollections[type] = [];
    }
    groupedCollections[type].push(collection);
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>提示词库测试页面</h1>
      <p>当前共有 {collections.length} 个集合</p>
      
      <div>
        <h2>按类型分组的集合:</h2>
        {Object.entries(groupedCollections).map(([type, items]) => (
          <div key={type} style={{ marginBottom: '20px' }}>
            <h3>{type} ({items.length} 个)</h3>
            <ul>
              {items.map(item => (
                <li key={item.id}>
                  <strong>{item.attributes.name}</strong> - {item.type}
                  {item.type === CollectionType.Prompts && (
                    <span> (PromptType: {item.attributes.type})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h2>所有集合详情:</h2>
        <pre>{JSON.stringify(collections, null, 2)}</pre>
      </div>
    </div>
  );
};

export default TestPage;