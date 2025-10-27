import worldSettingParserService from '../worldSettingParserService';

describe('WorldSettingParserService', () => {
  describe('parseLocationContent', () => {
    it('should correctly parse location content and extract description separately', async () => {
      const testContent = `【地点设定1：咸阳天工苑】
---
【基本信息】
【名称】：咸阳天工苑
【标签】：城市、繁华、港口
【描述】：咸阳天工苑是这个世界中最繁华的科技城市之一，拥有先进的能量技术和晶片生产能力。
【类型】：科技城市
【重要性】：核心城市
【地理环境】
地理位置：位于大陆东部沿海地区
气候特征：亚热带海洋性气候
地形特征：平原地形，地势平坦
自然资源：丰富的能量矿藏和晶片原料
生态环境：人工生态与自然生态完美融合
【文化背景】
历史背景：始建于三百年前，由第一批移民建立
文化特色：科技与传统文化相结合
建筑风格：现代化摩天大楼与古典园林相结合
社会结构：以技术等级划分的社会阶层
【政治环境】
统治体系：由天工院统一管理
法律法规：严格的科技保密法
【经济状况】
主要产业：能量采集、晶片生产、修行培训
贸易情况：只与天工苑进行技术交换
财富水平：无传统货币流通，完全资源配给制
【细节补充】
城市中心有一座高达千米的能量塔，是整个城市的能源核心。`;

      const result = await worldSettingParserService.parseLocationContent(testContent);
      
      // 验证基本字段
      expect(result.name).toBe('咸阳天工苑');
      expect(result.tags).toEqual(['城市', '繁华', '港口']);
      
      // 验证描述字段只包含描述内容，不包含其他字段
      expect(result.description).toBe('咸阳天工苑是这个世界中最繁华的科技城市之一，拥有先进的能量技术和晶片生产能力。');
      
      // 验证其他字段正确解析
      expect(result.type).toBe('科技城市');
      expect(result.importance).toBe('核心城市');
      expect(result.geography).toContain('地理位置：位于大陆东部沿海地区');
      expect(result.culture).toContain('历史背景：始建于三百年前');
      expect(result.politics).toContain('统治体系：由天工院统一管理');
      expect(result.economy).toContain('主要产业：能量采集、晶片生产、修行培训');
    });

    it('should handle location content without explicit description field', async () => {
      const testContent = `【地点设定1：荒野营地】
---
【名称】：荒野营地
【标签】：荒野、临时、简陋
类型：临时营地
重要性：次要
地理环境：位于荒野之中，四周是广阔的草原
文化背景：游牧民族的临时聚集地
政治环境：无固定统治体系
经济状况：以物易物的原始经济
细节补充：夜晚可以清晰地看到星空`;

      const result = await worldSettingParserService.parseLocationContent(testContent);
      
      // 验证基本字段
      expect(result.name).toBe('荒野营地');
      expect(result.tags).toEqual(['荒野', '临时', '简陋']);
      
      // 验证描述字段正确处理
      expect(result.description).toBe('');
      
      // 验证其他字段正确解析
      expect(result.type).toBe('临时营地');
      expect(result.importance).toBe('次要');
      expect(result.geography).toBe('位于荒野之中，四周是广阔的草原');
      expect(result.culture).toBe('游牧民族的临时聚集地');
      expect(result.politics).toBe('无固定统治体系');
      expect(result.economy).toBe('以物易物的原始经济');
    });
  });
});