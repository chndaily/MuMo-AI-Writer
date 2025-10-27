import { WorldSettingParserService } from '../services/worldSettingParserService';
import { TechnologyParserService } from '../services/parsers/TechnologyParserService';

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
    
    // 使用科技专用解析服务
    const technologyParser = new TechnologyParserService();
    const techDetails = technologyParser.parseTechnologyDetails(mockTechnologyContent);
    
    console.log('\n科技专用解析服务结果:');
    console.log('科技水平:', techDetails.level);
    console.log('应用场景:', techDetails.applications);
    console.log('使用限制:', techDetails.limitations);
    
    // 检查内容标识是否保留
    console.log('\n内容标识检查:');
    const identifiersToCheck = [
      '发展阶段：',
      '核心技术：',
      '发展时间线：',
      '战场急救：',
      '宫廷医疗：',
      '民间推广：',
      '能量消耗：',
      '设备依赖：',
      '操作要求：'
    ];
    
    identifiersToCheck.forEach(identifier => {
      const foundInWorldSetting = parsedDetails.level?.includes(identifier) || 
                                parsedDetails.applications?.includes(identifier) || 
                                parsedDetails.limitations?.includes(identifier);
                                
      const foundInTechnology = techDetails.level?.includes(identifier) || 
                               techDetails.applications?.includes(identifier) || 
                               techDetails.limitations?.includes(identifier);
                               
      if (foundInWorldSetting || foundInTechnology) {
        console.log(`✅ 保留了内容标识: ${identifier}`);
      } else {
        console.log(`❌ 丢失了内容标识: ${identifier}`);
      }
    });
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 运行测试
testTechnologyParsing();