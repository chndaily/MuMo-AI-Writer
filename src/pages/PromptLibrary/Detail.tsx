import React from 'react';
import { Collection, CollectionType } from '#/promptLibrary';
import type { ModelCollection, PromptCollection, DefaultPromptCollection, PersonaCollection, PresetCollection } from '#/promptLibrary';
import EmptyDetail from './EmptyDetail';
import DefaultsDetail from './DefaultsDetail';
import SimplifiedModelsDetail from './SimplifiedModelsDetail';
import SimplifiedPromptDetail from './SimplifiedPromptDetail';
import SimplifiedPersonasDetail from './SimplifiedPersonasDetail';
import SimplifiedPresetsDetail from './SimplifiedPresetsDetail';
import DebugDetail from './DebugDetail';

interface CollectionDetailProps {
  collection: Collection | null | undefined
}

const CollectionDetail: React.FC<CollectionDetailProps> = ({ collection }) => {
  // 如果是调试模式，显示调试信息
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
  if (isDebugMode) {
    return <DebugDetail />;
  }
  
  return <>
    {!collection && <EmptyDetail />}
    {collection?.type === CollectionType.Models && <SimplifiedModelsDetail collection={collection as ModelCollection} />}
    {collection?.type === CollectionType.Defaults && <DefaultsDetail collection={collection as DefaultPromptCollection} />}
    {collection?.type === CollectionType.Prompts && <SimplifiedPromptDetail collection={collection as PromptCollection} />}
    {collection?.type === CollectionType.Personas && <SimplifiedPersonasDetail collection={collection as PersonaCollection} />}
    {collection?.type === CollectionType.Presets && <SimplifiedPresetsDetail collection={collection as PresetCollection} />}
  </>;
};

export default CollectionDetail;