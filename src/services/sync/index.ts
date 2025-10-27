export { CharacterSyncService } from './CharacterSyncService';
export { LocationSyncService } from './LocationSyncService';
export { CultureSyncService } from './CultureSyncService';
export { TechnologySyncService } from './TechnologySyncService';
export { MagicSyncService } from './MagicSyncService';
export { HistorySyncService } from './HistorySyncService';

// 导出所有同步服务实例
import { characterSyncService } from './CharacterSyncService';
import { locationSyncService } from './LocationSyncService';
import { cultureSyncService } from './CultureSyncService';
import { technologySyncService } from './TechnologySyncService';
import { magicSyncService } from './MagicSyncService';
import { historySyncService } from './HistorySyncService';

export const syncServices = {
  character: characterSyncService,
  location: locationSyncService,
  culture: cultureSyncService,
  technology: technologySyncService,
  magic: magicSyncService,
  history: historySyncService
};