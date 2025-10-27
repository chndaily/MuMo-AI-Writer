import worldSettingParserService from './worldSettingParserService';

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

console.log('=== 科技设定解析测试 ===');
const technologyResult = worldSettingParserService.parseSettingDetails(technologyContent, 'technology');

console.log('解析结果:');
console.log('名称:', technologyResult.name);
console.log('标签:', technologyResult.tags);
console.log('描述:', technologyResult.description);
console.log('科技水平:', technologyResult.level);
console.log('应用场景:', technologyResult.applications);
console.log('使用限制:', technologyResult.limitations);
console.log('社会影响:', technologyResult.impact);
console.log('细节补充:', technologyResult.details);

// 模拟WorldElementPanel中的处理逻辑
console.log('\n=== 模拟WorldElementPanel处理逻辑 ===');

// 准备表单数据（模拟handleAISync中的逻辑）
const formData: any = {
  name: technologyResult.name || 'AI生成内容',
  description: technologyResult.description || '',
  tags: technologyResult.tags ? technologyResult.tags.join('、') : ''
};

// 科技设定字段处理（修复后的逻辑）
Object.assign(formData, {
  level: technologyResult.level || '',
  applications: technologyResult.applications || '',
  limitations: technologyResult.limitations || '',
  impact: technologyResult.impact || '',
  details: technologyResult.details || ''
});

console.log('表单数据:');
console.log('社会影响:', formData.impact);
console.log('细节补充:', formData.details);

// 检查是否有undefined或空值
console.log('\n=== 字段检查 ===');
for (const [key, value] of Object.entries(formData)) {
  if (value === undefined) {
    console.log(`警告: ${key} 字段为 undefined`);
  } else if (value === '') {
    console.log(`注意: ${key} 字段为空`);
  }
}