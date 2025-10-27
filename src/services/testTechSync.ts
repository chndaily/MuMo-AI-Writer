import worldSettingParserService from './worldSettingParserService';

// 测试科技设定AI生成内容
const testTechContent = `【名称】：心灵感应技术
【标签】：科技、心灵、通讯
【描述】：一种能够实现人与人之间直接心灵交流的先进技术

【科技水平】
发展阶段：高度成熟
核心技术：基于量子纠缠原理的心灵波传输

【应用场景】
主要用途：远距离即时通讯
应用领域：军事、医疗、教育

【使用限制】
能源需求：需要高纯度能量晶体
副作用：长期使用可能导致精神疲劳

【社会影响】
对社会的影响：彻底改变了人类的交流方式，消除了语言障碍
对经济的影响：催生了全新的心灵通讯产业
对文化的影响：促进了不同文化间的深度理解与融合

【细节补充】
发展历史：起源于21世纪末的量子研究突破
未来趋势：有望实现跨星际的心灵通讯`;

async function testTechParsing() {
  console.log('开始测试科技设定解析...');
  
  try {
    // 测试解析科技设定内容
    const parsedData = worldSettingParserService.parseSettingDetails(testTechContent, 'technology');
    console.log('解析结果:', parsedData);
    
    // 验证关键字段是否存在
    console.log('社会影响(impact)字段内容:', parsedData.impact);
    console.log('细节补充(details)字段内容:', parsedData.details);
    
    // 检查是否包含关键内容
    console.log('是否包含"社会影响"内容:', !!parsedData.impact && parsedData.impact.includes('社会影响'));
    console.log('是否包含"细节补充"内容:', !!parsedData.details && parsedData.details.includes('细节补充'));
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行测试
testTechParsing();