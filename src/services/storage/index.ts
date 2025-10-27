export { CharacterStorageService } from './CharacterStorageService';
export { LocationStorageService } from './LocationStorageService';
export { CultureStorageService } from './CultureStorageService';
export { TechnologyStorageService } from './TechnologyStorageService';
export { MagicStorageService } from './MagicStorageService';
export { HistoryStorageService } from './HistoryStorageService';

// 导出所有存储服务实例
import { CharacterStorageService } from './CharacterStorageService';
import { LocationStorageService } from './LocationStorageService';
import { CultureStorageService } from './CultureStorageService';
import { TechnologyStorageService } from './TechnologyStorageService';
import { MagicStorageService } from './MagicStorageService';
import { HistoryStorageService } from './HistoryStorageService';

export const storageServices = {
  character: new CharacterStorageService(),
  location: new LocationStorageService(),
  culture: new CultureStorageService(),
  technology: new TechnologyStorageService(),
  magic: new MagicStorageService(),
  history: new HistoryStorageService()
};