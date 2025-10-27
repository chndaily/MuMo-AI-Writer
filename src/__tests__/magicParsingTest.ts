import { MagicParserService } from '../services/parsers/MagicParserService';
import { WorldSettingParserService } from '../services/worldSettingParserService';

// 模拟的AI生成魔法内容
const mockMagicContent = `
【魔法设定1：元素魔法】

【基本信息】
【名称】：元素魔法
【标签】：元素、自然、基础
【描述】：操控自然元素的基础魔法体系

【魔法系统】
魔法体系：基于四大元素（火、水、土、风）的魔法系统
核心原理：通过与自然界元素精灵的沟通来操控元素力量
发展历史：起源于古代精灵族，后传播至人类世界

【能量源泉】
自然源泉：从自然环境中汲取元素能量
个人体质：施法者自身的魔法亲和力决定能量强度
冥想修行：通过冥想与元素精灵建立联系，增强能量储备

【施法规则】
元素平衡：使用一种元素过多会导致其他元素失衡
施法手势：特定的手势可以引导和控制元素力量
咒语吟唱：通过特定的咒语与元素精灵沟通

【法术示例】
火球术：凝聚火元素形成高温火球攻击敌人
水疗术：利用水元素治愈伤口和疾病
土墙术：操控土元素形成防护屏障
风刃术：引导风元素形成锐利的风之刃

【魔法物品】
元素法杖：增强施法者与元素精灵的沟通能力
魔法水晶：储存元素能量的媒介
护身符：保护施法者免受元素反噬

【细节补充】
元素精灵：每种元素都有对应的精灵，是元素力量的源泉
进阶方向：掌握基础元素后可以学习复合元素魔法
限制条件：在元素稀薄的地区施法效果会减弱
`;

function validateContentIdentifiers(content: string, fieldName: string, identifiers: string[]): { allFound: boolean, missing: string[] } {
  console.log(`\n检查${fieldName}字段的内容标识:`);
  let allFound = true;
  const missing: string[] = [];
  
  for (const identifier of identifiers) {
    if (content.includes(identifier)) {
      console.log(`✅ 包含内容标识: ${identifier}`);
    } else {
      console.log(`❌ 缺少内容标识: ${identifier}`);
      allFound = false;
      missing.push(identifier);
    }
  }
  
  return { allFound, missing };
}

function testMagicParsing() {
  console.log('开始验证魔法设定解析功能...');
  
  try {
    // 使用世界设定解析服务
    const worldSettingParser = new WorldSettingParserService();
    const worldParsedDetails = worldSettingParser.parseSettingDetails(mockMagicContent, 'magic');
    
    console.log('\n=== 世界设定解析服务结果 ===');
    console.log('魔法系统字段内容:');
    console.log(worldParsedDetails.system);
    
    console.log('\n能量源泉字段内容:');
    console.log(worldParsedDetails.sources);
    
    console.log('\n施法规则字段内容:');
    console.log(worldParsedDetails.rules);
    
    console.log('\n法术示例字段内容:');
    console.log(worldParsedDetails.spells);
    
    console.log('\n魔法物品字段内容:');
    console.log(worldParsedDetails.artifacts);
    
    // 使用魔法专用解析服务
    const magicParser = new MagicParserService();
    const magicParsedDetails = magicParser.parseMagicDetails(mockMagicContent);
    
    console.log('\n=== 魔法专用解析服务结果 ===');
    console.log('魔法系统字段内容:');
    console.log(magicParsedDetails.system);
    
    console.log('\n能量源泉字段内容:');
    console.log(magicParsedDetails.sources);
    
    console.log('\n施法规则字段内容:');
    console.log(magicParsedDetails.rules);
    
    console.log('\n法术示例字段内容:');
    console.log(magicParsedDetails.spells);
    
    console.log('\n魔法物品字段内容:');
    console.log(magicParsedDetails.artifacts);
    
    // 验证内容标识是否保留
    console.log('\n=== 内容标识验证 ===');
    
    const systemIdentifiers = [
      '魔法体系：',
      '核心原理：',
      '发展历史：'
    ];
    
    const sourcesIdentifiers = [
      '自然源泉：',
      '个人体质：',
      '冥想修行：'
    ];
    
    const rulesIdentifiers = [
      '元素平衡：',
      '施法手势：',
      '咒语吟唱：'
    ];
    
    const spellsIdentifiers = [
      '火球术：',
      '水疗术：',
      '土墙术：',
      '风刃术：'
    ];
    
    const artifactsIdentifiers = [
      '元素法杖：',
      '魔法水晶：',
      '护身符：'
    ];
    
    const detailsIdentifiers = [
      '元素精灵：',
      '进阶方向：',
      '限制条件：'
    ];
    
    let worldSettingValid = true;
    let magicValid = true;
    
    // 验证世界设定解析服务
    console.log('\n--- 世界设定解析服务验证 ---');
    const systemValidation = validateContentIdentifiers(worldParsedDetails.system || '', '魔法系统', systemIdentifiers);
    const sourcesValidation = validateContentIdentifiers(worldParsedDetails.sources || '', '能量源泉', sourcesIdentifiers);
    const rulesValidation = validateContentIdentifiers(worldParsedDetails.rules || '', '施法规则', rulesIdentifiers);
    const spellsValidation = validateContentIdentifiers(worldParsedDetails.spells || '', '法术示例', spellsIdentifiers);
    const artifactsValidation = validateContentIdentifiers(worldParsedDetails.artifacts || '', '魔法物品', artifactsIdentifiers);
    const detailsValidation = validateContentIdentifiers(worldParsedDetails.details || '', '细节补充', detailsIdentifiers);
    
    worldSettingValid = systemValidation.allFound && sourcesValidation.allFound && rulesValidation.allFound && 
                        spellsValidation.allFound && artifactsValidation.allFound && detailsValidation.allFound;
    
    // 验证魔法专用解析服务
    console.log('\n--- 魔法专用解析服务验证 ---');
    const magicSystemValidation = validateContentIdentifiers(magicParsedDetails.system || '', '魔法系统', systemIdentifiers);
    const magicSourcesValidation = validateContentIdentifiers(magicParsedDetails.sources || '', '能量源泉', sourcesIdentifiers);
    const magicRulesValidation = validateContentIdentifiers(magicParsedDetails.rules || '', '施法规则', rulesIdentifiers);
    const magicSpellsValidation = validateContentIdentifiers(magicParsedDetails.spells || '', '法术示例', spellsIdentifiers);
    const magicArtifactsValidation = validateContentIdentifiers(magicParsedDetails.artifacts || '', '魔法物品', artifactsIdentifiers);
    const magicDetailsValidation = validateContentIdentifiers(magicParsedDetails.details || '', '细节补充', detailsIdentifiers);
    
    magicValid = magicSystemValidation.allFound && magicSourcesValidation.allFound && magicRulesValidation.allFound && 
                 magicSpellsValidation.allFound && magicArtifactsValidation.allFound && magicDetailsValidation.allFound;
    
    console.log('\n=== 验证结果 ===');
    if (worldSettingValid) {
      console.log('✅ 世界设定解析服务正确保留了所有内容标识');
    } else {
      console.log('❌ 世界设定解析服务丢失了部分内容标识');
      console.log('系统字段缺失:', systemValidation.missing);
      console.log('源泉字段缺失:', sourcesValidation.missing);
      console.log('规则字段缺失:', rulesValidation.missing);
      console.log('法术字段缺失:', spellsValidation.missing);
      console.log('物品字段缺失:', artifactsValidation.missing);
      console.log('细节字段缺失:', detailsValidation.missing);
    }
    
    if (magicValid) {
      console.log('✅ 魔法专用解析服务正确保留了所有内容标识');
    } else {
      console.log('❌ 魔法专用解析服务丢失了部分内容标识');
      console.log('系统字段缺失:', magicSystemValidation.missing);
      console.log('源泉字段缺失:', magicSourcesValidation.missing);
      console.log('规则字段缺失:', magicRulesValidation.missing);
      console.log('法术字段缺失:', magicSpellsValidation.missing);
      console.log('物品字段缺失:', magicArtifactsValidation.missing);
      console.log('细节字段缺失:', magicDetailsValidation.missing);
    }
    
    // 检查是否主项名称被同步到内容中
    console.log('\n=== 主项名称检查 ===');
    const sectionTitles = ['【魔法系统】', '【能量源泉】', '【施法规则】', '【法术示例】', '【魔法物品】', '【细节补充】'];
    
    sectionTitles.forEach(title => {
      if ((worldParsedDetails.system || '').includes(title) ||
          (worldParsedDetails.sources || '').includes(title) ||
          (worldParsedDetails.rules || '').includes(title) ||
          (worldParsedDetails.spells || '').includes(title) ||
          (worldParsedDetails.artifacts || '').includes(title) ||
          (worldParsedDetails.details || '').includes(title)) {
        console.log(`❌ 主项名称 "${title}" 被同步到了内容中`);
      } else {
        console.log(`✅ 主项名称 "${title}" 未被同步到内容中`);
      }
    });
    
    console.log('\n✅ 验证完成');
    
  } catch (error) {
    console.error('验证过程中出现错误:', error);
  }
}

// 运行验证
testMagicParsing();