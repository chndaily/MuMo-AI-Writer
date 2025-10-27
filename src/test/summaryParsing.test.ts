// 测试AI生成内容中摘要的解析

// 测试用例：验证AI生成内容中摘要的解析
describe('Summary Parsing Test', () => {
  it('should parse content and summary from AI response', () => {
    // 模拟AI生成的内容（包含摘要）
    const aiResponse = `在一个遥远的王国里，年轻的王子艾伦正面临着前所未有的挑战。他的父亲，国王罗伯特，在一次狩猎中神秘失踪，留下了一个充满疑云的王国。艾伦必须在寻找父亲的同时，处理国内日益增长的不满情绪和来自邻国的威胁。

随着调查的深入，艾伦发现父亲的失踪并非偶然，而是一个精心策划的阴谋的一部分。他开始怀疑自己最信任的顾问，甚至是家族成员。在这个过程中，艾伦不仅要面对外部的敌人，还要对抗自己内心的恐惧和不确定性。

在一次与邻国使节的秘密会面中，艾伦意外得知了一个古老的预言，这个预言似乎与他家族的命运紧密相连。他意识到，要拯救王国和找到父亲，他必须踏上一段充满危险的旅程，寻找传说中的智慧之石。

#SUMMARY#
年轻的王子艾伦在父亲神秘失踪后，发现这是一个精心策划的阴谋。他必须在处理国内问题和外部威胁的同时，踏上寻找父亲和智慧之石的危险旅程。`;

    // 解析逻辑
    const summarySeparator = '#SUMMARY#';
    let content = '';
    let summary = '';

    if (aiResponse.includes(summarySeparator)) {
      const parts = aiResponse.split(summarySeparator);
      if (parts.length === 2) {
        content = parts[0].trim();
        summary = parts[1].trim();
      }
    }

    // 验证解析结果
    expect(content).toContain('年轻的王子艾伦正面临着前所未有的挑战');
    expect(summary).toContain('年轻的王子艾伦在父亲神秘失踪后');
    expect(summary.length).toBeLessThanOrEqual(100);
    
    console.log('Content:', content);
    console.log('Summary:', summary);
  });

  it('should handle AI response without summary', () => {
    // 模拟AI生成的内容（不包含摘要）
    const aiResponse = `在一个遥远的王国里，年轻的王子艾伦正面临着前所未有的挑战。他的父亲，国王罗伯特，在一次狩猎中神秘失踪，留下了一个充满疑云的王国。艾伦必须在寻找父亲的同时，处理国内日益增长的不满情绪和来自邻国的威胁。

随着调查的深入，艾伦发现父亲的失踪并非偶然，而是一个精心策划的阴谋的一部分。他开始怀疑自己最信任的顾问，甚至是家族成员。在这个过程中，艾伦不仅要面对外部的敌人，还要对抗自己内心的恐惧和不确定性。

在一次与邻国使节的秘密会面中，艾伦意外得知了一个古老的预言，这个预言似乎与他家族的命运紧密相连。他意识到，要拯救王国和找到父亲，他必须踏上一段充满危险的旅程，寻找传说中的智慧之石。`;

    // 解析逻辑
    const summarySeparator = '#SUMMARY#';
    let content = '';
    let summary = '';

    if (aiResponse.includes(summarySeparator)) {
      const parts = aiResponse.split(summarySeparator);
      if (parts.length === 2) {
        content = parts[0].trim();
        summary = parts[1].trim();
      }
    } else {
      // 如果没有摘要分隔符，则整个响应都是内容
      content = aiResponse.trim();
    }

    // 验证解析结果
    expect(content).toContain('年轻的王子艾伦正面临着前所未有的挑战');
    expect(summary).toBe('');
    
    console.log('Content without summary:', content);
  });
});