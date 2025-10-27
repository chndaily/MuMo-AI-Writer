import { WorldSettingParserService } from './worldSettingParserService';

describe('WorldSettingParserService', () => {
  let service: WorldSettingParserService;

  beforeEach(() => {
    service = new WorldSettingParserService();
  });

  describe('parseSettingDetails', () => {
    it('should correctly parse culture settings with prefixed sub-items', () => {
      const content = `
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

      const result = service.parseSettingDetails(content, 'culture');
      
      // 验证传统习俗包含完整的内容，包括子项名称
      expect(result.customs).toContain('主要节日：解谜日（每年举行技术难题竞赛）、创世庆典（纪念零壹降临日）');
      expect(result.customs).toContain('礼仪规范：进入实验室前需进行净化仪式，学术辩论前需交换计算筹码');
      
      // 验证价值观念包含完整的内容，包括子项名称
      expect(result.values).toContain('核心价值：追求真理、崇尚理性');
      expect(result.values).toContain('道德标准：以是否促进科技进步为道德评判标准');
      
      // 验证艺术表现包含完整的内容，包括子项名称
      expect(result.art).toContain('文学形式：科幻小说、技术论文');
      expect(result.art).toContain('音乐舞蹈：电子音乐、数据可视化艺术');
      expect(result.art).toContain('视觉艺术：全息投影、数字雕塑');
      
      // 验证宗教信仰包含完整的内容，包括子项名称
      expect(result.religion).toContain('主要信仰：科学至上主义');
      expect(result.religion).toContain('宗教仪式：每日晨祷（向科学致敬）、月度技术分享会');
      
      // 验证语言文字包含完整的内容，包括子项名称
      expect(result.language).toContain('语言特点：精确、逻辑性强');
      expect(result.language).toContain('文字系统：基于二进制的象形文字');
    });

    it('should correctly parse technology settings with prefixed sub-items', () => {
      const content = `
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

      const result = service.parseSettingDetails(content, 'technology');
      
      // 验证科技水平包含完整的内容，包括子项名称
      expect(result.level).toContain('发展阶段：理论研究阶段');
      expect(result.level).toContain('核心技术：量子纠缠、叠加态维持');
    });

    it('should correctly parse magic settings with prefixed sub-items', () => {
      const content = `
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

      const result = service.parseSettingDetails(content, 'magic');
      
      // 验证魔法系统包含完整的内容，包括子项名称
      expect(result.system).toContain('体系特点：四大元素相生相克');
      expect(result.system).toContain('修行方式：冥想、元素感知训练');
    });

    it('should correctly parse history settings with prefixed sub-items', () => {
      const content = `
【历史设定1：大灾变时代】
---
【基本信息】
【名称】：大灾变时代
【标签】：灾难、重建、黑暗
【描述】：一次毁灭性的全球灾难及其后续发展
【时间线】
重要时期：灾变初期、重建中期
时间节点：灾变元年、重建十周年
【重要事件】
重大事件：天火降临、海啸滔天
影响：文明毁灭、人口锐减
【历史人物】
关键人物：救世主艾伦、科学家莉娜
贡献：领导重建、保存知识
【历史后果】
对后世的影响：建立了新的社会秩序，科技发展重心转移
【细节补充】
这段历史被后世称为"新纪元"
`;

      const result = service.parseSettingDetails(content, 'history');
      
      // 验证时间线包含完整的内容，包括子项名称
      expect(result.timeline).toContain('重要时期：灾变初期、重建中期');
      expect(result.timeline).toContain('时间节点：灾变元年、重建十周年');
    });
  });
});