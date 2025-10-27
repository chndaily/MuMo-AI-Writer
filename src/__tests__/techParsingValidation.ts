import { TechnologyParserService } from '../services/parsers/TechnologyParserService';
import { WorldSettingParserService } from '../services/worldSettingParserService';

// 模拟的AI生成科技内容
const mockTechnologyContent = `
【科技设定1：量子经络同步技术】

【基本信息】
【名称】：量子经络同步技术
【标签】：医疗科技、量子技术、生物工程
【描述】：结合量子纠缠原理与传统经络理论的前沿医疗技术

【科技水平】
发展阶段：实验性应用阶段（已在蒙恬精锐部队和太医署小范围试用）
核心技术：量子纠缠同步、纳米神经接口、经络频率映射
发展时间线：前214年理论验证→前210年首个人体实验→前205年军事应用版完成

【应用场景】
战场急救：通过量子同步实现远程医疗支援，可在千里之外进行手术
宫廷医疗：为皇室成员提供全天候健康监控和疾病预防
民间推广：逐步向普通民众开放基础医疗应用

【使用限制】
能量消耗：单次完整治疗需要消耗大量量子能量，限制了使用频次
设备依赖：需要复杂的量子设备支持，难以小型化
操作要求：需要经过严格训练的专业医师操作

【社会影响】
对社会的影响：显著提升整体医疗水平，延长人均寿命
对经济的影响：催生新的医疗产业链，创造大量就业机会
对文化的影响：融合传统中医与现代科技，形成新的医疗文化

【细节补充】
技术融合：将古老的经络理论与前沿量子技术完美结合
未来发展：计划进一步降低能耗并提高治疗精度
伦理考量：需要建立严格的使用规范防止技术滥用
`;

function validateContentIdentifiers(content: string, fieldName: string, identifiers: string[]): boolean {
  console.log(`\n检查${fieldName}字段的内容标识:`);
  let allFound = true;
  
  for (const identifier of identifiers) {
    if (content.includes(identifier)) {
      console.log(`✅ 包含内容标识: ${identifier}`);
    } else {
      console.log(`❌ 缺少内容标识: ${identifier}`);
      allFound = false;
    }
  }
  
  return allFound;
}

function testTechnologyParsing() {
  console.log('开始验证科技设定解析功能...');
  
  try {
    // 使用世界设定解析服务
    const worldSettingParser = new WorldSettingParserService();
    const worldParsedDetails = worldSettingParser.parseSettingDetails(mockTechnologyContent, 'technology');
    
    console.log('\n=== 世界设定解析服务结果 ===');
    console.log('科技水平字段内容:');
    console.log(worldParsedDetails.level);
    
    console.log('\n应用场景字段内容:');
    console.log(worldParsedDetails.applications);
    
    console.log('\n使用限制字段内容:');
    console.log(worldParsedDetails.limitations);
    
    console.log('\n社会影响字段内容:');
    console.log(worldParsedDetails.impact);
    
    // 使用科技专用解析服务
    const technologyParser = new TechnologyParserService();
    const techParsedDetails = technologyParser.parseTechnologyDetails(mockTechnologyContent);
    
    console.log('\n=== 科技专用解析服务结果 ===');
    console.log('科技水平字段内容:');
    console.log(techParsedDetails.level);
    
    console.log('\n应用场景字段内容:');
    console.log(techParsedDetails.applications);
    
    console.log('\n使用限制字段内容:');
    console.log(techParsedDetails.limitations);
    
    console.log('\n社会影响字段内容:');
    console.log(techParsedDetails.impact);
    
    // 验证内容标识是否保留
    console.log('\n=== 内容标识验证 ===');
    
    const techLevelIdentifiers = [
      '发展阶段：',
      '核心技术：',
      '发展时间线：'
    ];
    
    const applicationsIdentifiers = [
      '战场急救：',
      '宫廷医疗：',
      '民间推广：'
    ];
    
    const limitationsIdentifiers = [
      '能量消耗：',
      '设备依赖：',
      '操作要求：'
    ];
    
    const impactIdentifiers = [
      '对社会的影响：',
      '对经济的影响：',
      '对文化的影响：'
    ];
    
    const detailsIdentifiers = [
      '技术融合：',
      '未来发展：',
      '伦理考量：'
    ];
    
    let worldSettingValid = true;
    let technologyValid = true;
    
    // 验证世界设定解析服务
    console.log('\n--- 世界设定解析服务验证 ---');
    worldSettingValid = worldSettingValid && validateContentIdentifiers(worldParsedDetails.level || '', '科技水平', techLevelIdentifiers);
    worldSettingValid = worldSettingValid && validateContentIdentifiers(worldParsedDetails.applications || '', '应用场景', applicationsIdentifiers);
    worldSettingValid = worldSettingValid && validateContentIdentifiers(worldParsedDetails.limitations || '', '使用限制', limitationsIdentifiers);
    worldSettingValid = worldSettingValid && validateContentIdentifiers(worldParsedDetails.impact || '', '社会影响', impactIdentifiers);
    worldSettingValid = worldSettingValid && validateContentIdentifiers(worldParsedDetails.details || '', '细节补充', detailsIdentifiers);
    
    // 验证科技专用解析服务
    console.log('\n--- 科技专用解析服务验证 ---');
    technologyValid = technologyValid && validateContentIdentifiers(techParsedDetails.level || '', '科技水平', techLevelIdentifiers);
    technologyValid = technologyValid && validateContentIdentifiers(techParsedDetails.applications || '', '应用场景', applicationsIdentifiers);
    technologyValid = technologyValid && validateContentIdentifiers(techParsedDetails.limitations || '', '使用限制', limitationsIdentifiers);
    technologyValid = technologyValid && validateContentIdentifiers(techParsedDetails.impact || '', '社会影响', impactIdentifiers);
    technologyValid = technologyValid && validateContentIdentifiers(techParsedDetails.details || '', '细节补充', detailsIdentifiers);
    
    console.log('\n=== 验证结果 ===');
    if (worldSettingValid) {
      console.log('✅ 世界设定解析服务正确保留了所有内容标识');
    } else {
      console.log('❌ 世界设定解析服务丢失了部分内容标识');
    }
    
    if (technologyValid) {
      console.log('✅ 科技专用解析服务正确保留了所有内容标识');
    } else {
      console.log('❌ 科技专用解析服务丢失了部分内容标识');
    }
    
    console.log('\n✅ 验证完成');
    
  } catch (error) {
    console.error('验证过程中出现错误:', error);
  }
}

// 运行验证
testTechnologyParsing();