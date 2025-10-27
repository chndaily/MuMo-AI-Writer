export { CharacterParserService } from './CharacterParserService';
export { LocationParserService } from './LocationParserService';
export { CultureParserService } from './CultureParserService';
export { TechnologyParserService } from './TechnologyParserService';
export { MagicParserService } from './MagicParserService';
export { HistoryParserService } from './HistoryParserService';

// 导出默认实例
import characterParser from './CharacterParserService';
import locationParser from './LocationParserService';
import cultureParser from './CultureParserService';
import technologyParser from './TechnologyParserService';
import magicParser from './MagicParserService';
import historyParser from './HistoryParserService';

export const parserServices = {
  character: characterParser,
  location: locationParser,
  culture: cultureParser,
  technology: technologyParser,
  magic: magicParser,
  history: historyParser
};