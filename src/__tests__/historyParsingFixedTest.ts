import { WorldSettingParserService } from '../services/worldSettingParserService';
import { HistoryParserService } from '../services/parsers/HistoryParserService';

// 创建解析服务实例
const worldSettingParser = new WorldSettingParserService();
const historyParser = new HistoryParserService();

// 模拟的AI生成历史内容
const mockHistoryContent = `
【历史设定1：大秦帝国的兴衰】

【基本信息】
【名称】：大秦帝国的兴衰
【标签】：帝国、兴衰、战争
【描述】：讲述大秦帝国从建立到衰落的完整历史进程

【时间线】
重要时期：公元前221年秦始皇统一六国
时间节点：公元前210年秦始皇驾崩
年代跨度：公元前221年至公元前207年

【重要事件】
重大事件：焚书坑儒事件
影响：加强了思想控制但激化了社会矛盾
战争冲突：陈胜吴广起义
政治变迁：秦二世即位与赵高专权
文化交融：统一文字度量衡

【历史人物】
关键人物：秦始皇嬴政
贡献：统一六国建立中央集权制度
英雄豪杰：蒙恬将军
奸臣恶徒：赵高
普通民众：陈胜、吴广

【历史后果】
对后世的影响：建立了中央集权制度影响后世两千余年
遗产传承：统一的文字度量衡制度
未解之谜：秦始皇陵的秘密

【细节补充】
社会状况：严格的等级制度和法律体系
经济发展：统一货币促进商业发展
科技水平：兵马俑制作工艺达到巅峰
其他相关信息：长城的修建与维护
`;

console.log('开始验证修复后的历史设定解析功能...');

// 测试世界设定解析服务
console.log('\n=== 世界设定解析服务结果 ===');
try {
  const worldSettings = await worldSettingParser.parseMultipleWorldSettings(mockHistoryContent, 'history');
  
  if (worldSettings.length > 0) {
    const firstHistory = worldSettings[0];
    console.log('时间线字段内容:');
    console.log(firstHistory.timeline);
    console.log('\n重要事件字段内容:');
    console.log(firstHistory.events);
    console.log('\n历史人物字段内容:');
    console.log(firstHistory.figures);
    console.log('\n历史后果字段内容:');
    console.log(firstHistory.consequences);
    console.log('\n细节补充字段内容:');
    console.log(firstHistory.details);
  }
} catch (error) {
  console.error('WorldSettingParserService解析失败:', error);
}

// 测试历史解析服务
console.log('\n=== 历史专用解析服务结果 ===');
try {
  const historyDetails = historyParser.parseHistoryDetails(mockHistoryContent);
  console.log('时间线字段内容:');
  console.log(historyDetails.timeline);
  console.log('\n重要事件字段内容:');
  console.log(historyDetails.events);
  console.log('\n历史人物字段内容:');
  console.log(historyDetails.figures);
  console.log('\n历史后果字段内容:');
  console.log(historyDetails.consequences);
  console.log('\n细节补充字段内容:');
  console.log(historyDetails.details);
} catch (error) {
  console.error('HistoryParserService解析失败:', error);
}

// 验证内容标识是否保留
console.log('\n=== 内容标识验证 ===');

// 验证函数
function checkContentIdentifiers(content: string, identifiers: string[]): { missing: string[], present: string[] } {
  const missing: string[] = [];
  const present: string[] = [];
  
  for (const identifier of identifiers) {
    if (content && content.includes(identifier)) {
      present.push(identifier);
    } else {
      missing.push(identifier);
    }
  }
  
  return { missing, present };
}

// 定义应该保留的内容标识
const timelineIdentifiers = ['重要时期：', '时间节点：', '年代跨度：'];
const eventsIdentifiers = ['重大事件：', '影响：', '战争冲突：', '政治变迁：', '文化交融：'];
const figuresIdentifiers = ['关键人物：', '贡献：', '英雄豪杰：', '奸臣恶徒：', '普通民众：'];
const consequencesIdentifiers = ['对后世的影响：', '遗产传承：', '未解之谜：'];
const detailsIdentifiers = ['社会状况：', '经济发展：', '科技水平：', '其他相关信息：'];

try {
  const worldSettings = await worldSettingParser.parseMultipleWorldSettings(mockHistoryContent, 'history');
  if (worldSettings.length > 0) {
    const firstHistory = worldSettings[0];
    
    console.log('--- 世界设定解析服务验证 ---');
    
    // 检查时间线字段的内容标识
    console.log('检查时间线字段的内容标识:');
    const timelineResult = checkContentIdentifiers(firstHistory.timeline, timelineIdentifiers);
    if (timelineResult.missing.length === 0) {
      console.log('✅ 包含所有时间线内容标识');
    } else {
      console.log('❌ 缺失时间线内容标识:', timelineResult.missing);
    }
    
    // 检查重要事件字段的内容标识
    console.log('检查重要事件字段的内容标识:');
    const eventsResult = checkContentIdentifiers(firstHistory.events, eventsIdentifiers);
    if (eventsResult.missing.length === 0) {
      console.log('✅ 包含所有重要事件内容标识');
    } else {
      console.log('❌ 缺失重要事件内容标识:', eventsResult.missing);
    }
    
    // 检查历史人物字段的内容标识
    console.log('检查历史人物字段的内容标识:');
    const figuresResult = checkContentIdentifiers(firstHistory.figures, figuresIdentifiers);
    if (figuresResult.missing.length === 0) {
      console.log('✅ 包含所有历史人物内容标识');
    } else {
      console.log('❌ 缺失历史人物内容标识:', figuresResult.missing);
    }
    
    // 检查历史后果字段的内容标识
    console.log('检查历史后果字段的内容标识:');
    const consequencesResult = checkContentIdentifiers(firstHistory.consequences, consequencesIdentifiers);
    if (consequencesResult.missing.length === 0) {
      console.log('✅ 包含所有历史后果内容标识');
    } else {
      console.log('❌ 缺失历史后果内容标识:', consequencesResult.missing);
    }
    
    // 检查细节补充字段的内容标识
    console.log('检查细节补充字段的内容标识:');
    const detailsResult = checkContentIdentifiers(firstHistory.details, detailsIdentifiers);
    if (detailsResult.missing.length === 0) {
      console.log('✅ 包含所有细节补充内容标识');
    } else {
      console.log('❌ 缺失细节补充内容标识:', detailsResult.missing);
    }
  }
} catch (error) {
  console.error('世界设定解析服务验证失败:', error);
}

try {
  const historyDetails = historyParser.parseHistoryDetails(mockHistoryContent);
  
  console.log('--- 历史专用解析服务验证 ---');
  
  // 检查时间线字段的内容标识
  console.log('检查时间线字段的内容标识:');
  const timelineResult = checkContentIdentifiers(historyDetails.timeline, timelineIdentifiers);
  if (timelineResult.missing.length === 0) {
    console.log('✅ 包含所有时间线内容标识');
  } else {
    console.log('❌ 缺失时间线内容标识:', timelineResult.missing);
  }
  
  // 检查重要事件字段的内容标识
  console.log('检查重要事件字段的内容标识:');
  const eventsResult = checkContentIdentifiers(historyDetails.events, eventsIdentifiers);
  if (eventsResult.missing.length === 0) {
    console.log('✅ 包含所有重要事件内容标识');
  } else {
    console.log('❌ 缺失重要事件内容标识:', eventsResult.missing);
  }
  
  // 检查历史人物字段的内容标识
  console.log('检查历史人物字段的内容标识:');
  const figuresResult = checkContentIdentifiers(historyDetails.figures, figuresIdentifiers);
  if (figuresResult.missing.length === 0) {
    console.log('✅ 包含所有历史人物内容标识');
  } else {
    console.log('❌ 缺失历史人物内容标识:', figuresResult.missing);
  }
  
  // 检查历史后果字段的内容标识
  console.log('检查历史后果字段的内容标识:');
  const consequencesResult = checkContentIdentifiers(historyDetails.consequences, consequencesIdentifiers);
  if (consequencesResult.missing.length === 0) {
    console.log('✅ 包含所有历史后果内容标识');
  } else {
    console.log('❌ 缺失历史后果内容标识:', consequencesResult.missing);
  }
  
  // 检查细节补充字段的内容标识
  console.log('检查细节补充字段的内容标识:');
  const detailsResult = checkContentIdentifiers(historyDetails.details, detailsIdentifiers);
  if (detailsResult.missing.length === 0) {
    console.log('✅ 包含所有细节补充内容标识');
  } else {
    console.log('❌ 缺失细节补充内容标识:', detailsResult.missing);
  }
} catch (error) {
  console.error('历史专用解析服务验证失败:', error);
}

console.log('\n=== 验证结果 ===');
console.log('✅ 修复后的历史设定解析功能验证完成');