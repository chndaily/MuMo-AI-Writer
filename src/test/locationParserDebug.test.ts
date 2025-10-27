import { WorldSettingParserService } from '../services/worldSettingParserService';

// 创建世界设定解析服务实例
const worldSettingParserService = new WorldSettingParserService();

// 测试用例：调试地点解析逻辑
describe('Location Parser Debug', () => {
  test('should parse location content with section markers', () => {
    // 模拟AI生成的地点内容（带章节标记）
    const aiGeneratedLocationContent = `【地点设定1：青云镇】

【基本信息】
【名称】：青云镇
【类型】：商贸小镇
【重要性】：区域商贸中心
【标签】：小镇、商贸、交通枢纽
【描述】：位于三省交界处的繁华小镇，是周边地区的商贸中心

【地理位置】
【描述】：青云镇坐落在青云山脉的东麓，地处三省交界的战略要地。东临碧水江，西靠青云山，南接官道，北通驿路。镇子依山傍水而建，地势相对平坦，交通便利。

【地形特征】
【描述】：镇子周边地形以丘陵为主，地势起伏不大。青云山在镇子西侧，山势不高但林木茂密。碧水江从镇子东侧流过，江面宽阔，水流平缓。镇中心地势较为平坦，适合建设。`;

    // 调用解析服务解析AI生成的地点内容
    const parsedDetails = worldSettingParserService.parseSettingDetails(aiGeneratedLocationContent, 'location');
    
    // 打印解析结果
    console.log('Parsed details:', parsedDetails);
    
    // 验证解析结果
    expect(parsedDetails).toBeDefined();
  });

  test('should parse location content without section markers', () => {
    // 模拟AI生成的地点内容（不带章节标记）
    const aiGeneratedLocationContent = `青云镇

类型：商贸小镇
重要性：区域商贸中心
标签：小镇、商贸、交通枢纽
描述：位于三省交界处的繁华小镇，是周边地区的商贸中心

地理位置：青云镇坐落在青云山脉的东麓，地处三省交界的战略要地。东临碧水江，西靠青云山，南接官道，北通驿路。镇子依山傍水而建，地势相对平坦，交通便利。

地形特征：镇子周边地形以丘陵为主，地势起伏不大。青云山在镇子西侧，山势不高但林木茂密。碧水江从镇子东侧流过，江面宽阔，水流平缓。镇中心地势较为平坦，适合建设。`;

    // 调用解析服务解析AI生成的地点内容
    const parsedDetails = worldSettingParserService.parseSettingDetails(aiGeneratedLocationContent, 'location');
    
    // 打印解析结果
    console.log('Parsed details without sections:', parsedDetails);
    
    // 验证解析结果
    expect(parsedDetails).toBeDefined();
    
    // 验证特定字段是否被正确解析
    expect(parsedDetails.locationType).toContain('商贸小镇');
    expect(parsedDetails.importance).toContain('区域商贸中心');
    expect(parsedDetails.geography).toContain('青云镇坐落在青云山脉的东麓');
    expect(parsedDetails.terrain).toContain('镇子周边地形以丘陵为主');
  });
});