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

console.log('=== 历史设定解析测试 ===');

// 测试世界设定解析服务
console.log('\n1. 测试WorldSettingParserService:');
try {
  const worldSettings = await worldSettingParser.parseMultipleWorldSettings(mockHistoryContent, 'history');
  console.log('解析结果:', JSON.stringify(worldSettings, null, 2));
  
  if (worldSettings.length > 0) {
    const firstHistory = worldSettings[0];
    console.log('\n第一个历史设定的详细信息:');
    console.log('名称:', firstHistory.name);
    console.log('时间线:', firstHistory.timeline);
    console.log('重要事件:', firstHistory.events);
    console.log('历史人物:', firstHistory.figures);
    console.log('历史后果:', firstHistory.consequences);
    console.log('细节补充:', firstHistory.details);
  }
} catch (error) {
  console.error('WorldSettingParserService解析失败:', error);
}

// 测试历史解析服务
console.log('\n2. 测试HistoryParserService:');
try {
  const historyDetails = historyParser.parseHistoryDetails(mockHistoryContent);
  console.log('历史详情解析结果:', JSON.stringify(historyDetails, null, 2));
  
  console.log('\n检查内容标识是否保留:');
  console.log('时间线是否包含"重要时期：" ?', historyDetails.timeline?.includes('重要时期：'));
  console.log('重要事件是否包含"重大事件：" ?', historyDetails.events?.includes('重大事件：'));
  console.log('历史人物是否包含"关键人物：" ?', historyDetails.figures?.includes('关键人物：'));
  console.log('历史后果是否包含"对后世的影响：" ?', historyDetails.consequences?.includes('对后世的影响：'));
  console.log('细节补充是否包含"社会状况：" ?', historyDetails.details?.includes('社会状况：'));
} catch (error) {
  console.error('HistoryParserService解析失败:', error);
}

console.log('\n=== 测试完成 ===');
