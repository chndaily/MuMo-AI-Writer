import { WorldSettingParserService } from '@/services/worldSettingParserService';
import { TechnologyParserService } from '@/services/parsers/TechnologyParserService';

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

async function testTechnologyParsing() {
  console.log('开始测试科技设定解析功能...');
  
  try {
    // 使用世界设定解析服务
    const worldSettingParser = new WorldSettingParserService();
    const parsedDetails = worldSettingParser.parseSettingDetails(mockTechnologyContent, 'technology');
    
    console.log('世界设定解析服务结果:');
    console.log('科技水平:', parsedDetails.level);
    console.log('应用场景:', parsedDetails.applications);
    console.log('使用限制:', parsedDetails.limitations);
    console.log('社会影响:', parsedDetails.impact);
    console.log('细节补充:', parsedDetails.details);
    
    // 使用科技专用解析服务
    const technologyParser = new TechnologyParserService();
    const techDetails = technologyParser.parseTechnologyDetails(mockTechnologyContent);
    
    console.log('\n科技专用解析服务结果:');
    console.log('科技水平:', techDetails.level);
    console.log('应用场景:', techDetails.applications);
    console.log('使用限制:', techDetails.limitations);
    console.log('社会影响:', techDetails.impact);
    console.log('细节补充:', techDetails.details);
    
    // 验证修复是否成功
    console.log('\n修复验证:');
    const worldSettingHasIdentifiers = techDetails.level && techDetails.level.includes('发展阶段：');
    const technologyHasIdentifiers = techDetails.level && techDetails.level.includes('发展阶段：');
    
    if (worldSettingHasIdentifiers) {
      console.log('✅ 世界设定解析服务保留了内容标识');
    } else {
      console.log('❌ 世界设定解析服务丢失了内容标识');
    }
    
    if (technologyHasIdentifiers) {
      console.log('✅ 科技专用解析服务保留了内容标识');
    } else {
      console.log('❌ 科技专用解析服务丢失了内容标识');
    }
    
    // 检查具体的内容标识是否都保留了
    const identifiersToCheck = [
      '发展阶段：',
      '核心技术：',
      '发展时间线：',
      '战场急救：',
      '宫廷医疗：',
      '民间推广：',
      '能量消耗：',
      '设备依赖：',
      '操作要求：',
      '对社会的影响：',
      '对经济的影响：',
      '对文化的影响：',
      '技术融合：',
      '未来发展：',
      '伦理考量：'
    ];
    
    console.log('\n详细内容标识检查:');
    identifiersToCheck.forEach(identifier => {
      const foundInWorldSetting = parsedDetails.level?.includes(identifier) || 
                                parsedDetails.applications?.includes(identifier) || 
                                parsedDetails.limitations?.includes(identifier) || 
                                parsedDetails.impact?.includes(identifier) || 
                                parsedDetails.details?.includes(identifier);
                                
      const foundInTechnology = techDetails.level?.includes(identifier) || 
                               techDetails.applications?.includes(identifier) || 
                               techDetails.limitations?.includes(identifier) || 
                               techDetails.impact?.includes(identifier) || 
                               techDetails.details?.includes(identifier);
                               
      if (foundInWorldSetting || foundInTechnology) {
        console.log(`✅ 保留了内容标识: ${identifier}`);
      } else {
        console.log(`❌ 丢失了内容标识: ${identifier}`);
      }
    });
    
    return { 
      worldSettingParser: parsedDetails, 
      technologyParser: techDetails,
      worldSettingHasIdentifiers,
      technologyHasIdentifiers
    };
  } catch (error) {
    console.error('测试过程中出现错误:', error);
    return { error: error.message };
  }
}

// 运行测试
testTechnologyParsing().then(result => {
  console.log('测试完成:', result);
}).catch(error => {
  console.error('测试失败:', error);
});