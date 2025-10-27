import worldSettingParserService from './worldSettingParserService';

// 测试文化设定解析
const cultureContent = `
【文化设定1：科技文明】
---
【基本信息】
【名称】：科技文明
【标签】：未来、科技、理性
【描述】：一个高度发达的科技文明社会
【传统习俗】
主要节日：解谜日（每年举行技术难题竞赛）、创世庆典（纪念零壹降临日）
礼仪规范：进入实验室前需进行净化仪式，学术辩论前需交换计算筹码
【价值观念】
核心价值：追求真理、崇尚理性
道德标准：以是否促进科技进步为道德评判标准
【艺术表现】
文学形式：科幻小说、技术论文
音乐舞蹈：电子音乐、数据可视化艺术
视觉艺术：全息投影、数字雕塑
【宗教信仰】
主要信仰：科学至上主义
宗教仪式：每日晨祷（向科学致敬）、月度技术分享会
【语言文字】
语言特点：精确、逻辑性强
文字系统：基于二进制的象形文字
【细节补充】
这是一个以科技为核心的社会文明
`;

console.log('=== 文化设定解析结果 ===');
const cultureResult = worldSettingParserService.parseSettingDetails(cultureContent, 'culture');
console.log('传统习俗:', cultureResult.customs);
console.log('价值观念:', cultureResult.values);
console.log('艺术表现:', cultureResult.art);
console.log('宗教信仰:', cultureResult.religion);
console.log('语言文字:', cultureResult.language);

// 测试科技设定解析
const technologyContent = `
【科技设定1：量子计算技术】
---
【基本信息】
【名称】：量子计算技术
【标签】：计算、量子、未来
【描述】：基于量子力学原理的超级计算技术
【科技水平】
发展阶段：理论研究阶段
核心技术：量子纠缠、叠加态维持
【应用场景】
主要用途：密码破解、大数据分析
应用领域：军事、金融、科研
【使用限制】
能源需求：需要超低温环境维持
副作用：可能引发时间线紊乱
【社会影响】
对社会的影响：极大提升了计算能力，但也带来了安全风险
【细节补充】
这项技术仍在严格管控中
`;

console.log('\n=== 科技设定解析结果 ===');
const technologyResult = worldSettingParserService.parseSettingDetails(technologyContent, 'technology');
console.log('科技水平:', technologyResult.level);
console.log('应用场景:', technologyResult.applications);
console.log('使用限制:', technologyResult.limitations);
console.log('社会影响:', technologyResult.impact);

// 测试魔法设定解析
const magicContent = `
【魔法设定1：元素魔法】
---
【基本信息】
【名称】：元素魔法
【标签】：元素、自然、基础
【描述】：操控自然元素的基础魔法体系
【魔法系统】
体系特点：四大元素相生相克
修行方式：冥想、元素感知训练
【能量源泉】
来源：自然界的元素精灵
获取方式：与元素精灵签订契约
【施法规则】
施法条件：需要相应的魔法媒介
限制因素：施法者精神力有限
【法术示例】
基础法术：火球术、水箭术
高级法术：雷暴术、地裂术
【魔法物品】
代表性物品：元素法杖、精灵宝石
【制作方法】
需要特定的材料和仪式
【细节补充】
元素魔法是所有魔法的基础
`;

console.log('\n=== 魔法设定解析结果 ===');
const magicResult = worldSettingParserService.parseSettingDetails(magicContent, 'magic');
console.log('魔法系统:', magicResult.system);
console.log('能量源泉:', magicResult.sources);
console.log('施法规则:', magicResult.rules);
console.log('法术示例:', magicResult.spells);
console.log('魔法物品:', magicResult.artifacts);