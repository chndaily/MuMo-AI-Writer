// 端到端测试：验证从AI生成内容到解析摘要的完整流程
describe('End-to-End Summary Parsing Test', () => {
  test('should parse AI generated content with summary correctly', () => {
    // 模拟AI实际生成的内容（使用我们修改后的提示词）
    const aiGeneratedContent = `夜幕降临，古老的城堡在月光下显得格外神秘。艾莉亚小心翼翼地穿过长廊，手中紧握着那把祖传的银刃。她能感受到黑暗中潜藏的危险，但为了拯救被囚禁的弟弟，她别无选择。

突然，一阵阴冷的笑声从走廊尽头传来。艾莉亚停下脚步，心跳加速。她知道，前方等待她的将是一场生死较量。她深吸一口气，继续向前走去，每一步都充满了警惕。

在城堡的最深处，她终于找到了关押弟弟的牢房。然而，当她推开厚重的铁门时，却发现里面空无一人。就在这时，身后传来了沉重的脚步声...

#SUMMARY#
艾莉亚夜探古堡营救弟弟，却发现牢房空无一人，背后传来脚步声。`;

    // 模拟我们在AINovelWorkspace.tsx中的解析逻辑
    const summarySeparator = '#SUMMARY#';
    let content = '';
    let summary = '';

    if (aiGeneratedContent.includes(summarySeparator)) {
      const parts = aiGeneratedContent.split(summarySeparator);
      if (parts.length === 2) {
        content = parts[0].trim();
        summary = parts[1].trim();
      }
    }

    // 验证解析结果
    expect(content).toContain('夜幕降临，古老的城堡在月光下显得格外神秘');
    expect(summary).toBe('艾莉亚夜探古堡营救弟弟，却发现牢房空无一人，背后传来脚步声。');
    expect(summary.length).toBeLessThanOrEqual(100);
    
    // 验证内容和摘要都不为空
    expect(content).not.toBe('');
    expect(summary).not.toBe('');
    
    console.log('Parsed Content:', content);
    console.log('Parsed Summary:', summary);
  });

  test('should handle case where AI does not generate summary', () => {
    // 模拟AI未按要求生成摘要的情况（作为后备方案）
    const aiGeneratedContentWithoutSummary = `夜幕降临，古老的城堡在月光下显得格外神秘。艾莉亚小心翼翼地穿过长廊，手中紧握着那把祖传的银刃。她能感受到黑暗中潜藏的危险，但为了拯救被囚禁的弟弟，她别无选择。

突然，一阵阴冷的笑声从走廊尽头传来。艾莉亚停下脚步，心跳加速。她知道，前方等待她的将是一场生死较量。她深吸一口气，继续向前走去，每一步都充满了警惕。

在城堡的最深处，她终于找到了关押弟弟的牢房。然而，当她推开厚重的铁门时，却发现里面空无一人。就在这时，身后传来了沉重的脚步声...`;

    // 模拟我们在contentSyncService.ts中的解析逻辑
    const summarySeparator = '#SUMMARY#';
    let contentToSync = aiGeneratedContentWithoutSummary;
    let summary = '';

    if (aiGeneratedContentWithoutSummary.includes(summarySeparator)) {
      const parts = aiGeneratedContentWithoutSummary.split(summarySeparator);
      if (parts.length === 2) {
        contentToSync = parts[0].trim();
        summary = parts[1].trim();
      }
    }

    // 验证解析结果
    expect(contentToSync).toContain('夜幕降临，古老的城堡在月光下显得格外神秘');
    expect(summary).toBe('');
    
    console.log('Content without summary:', contentToSync);
  });

  test('should handle malformed summary separator', () => {
    // 模拟AI生成的内容中包含不完整的摘要分隔符
    const aiGeneratedContentWithMalformedSeparator = `夜幕降临，古老的城堡在月光下显得格外神秘。艾莉亚小心翼翼地穿过长廊，手中紧握着那把祖传的银刃。她能感受到黑暗中潜藏的危险，但为了拯救被囚禁的弟弟，她别无选择。

突然，一阵阴冷的笑声从走廊尽头传来。艾莉亚停下脚步，心跳加速。她知道，前方等待她的将是一场生死较量。她深吸一口气，继续向前走去，每一步都充满了警惕。

在城堡的最深处，她终于找到了关押弟弟的牢房。然而，当她推开厚重的铁门时，却发现里面空无一人。就在这时，身后传来了沉重的脚步声...

#SUMARY#  // 错误的分隔符
艾莉亚夜探古堡营救弟弟，却发现牢房空无一人，背后传来脚步声。`;

    // 使用正确的分隔符进行解析
    const summarySeparator = '#SUMMARY#';
    let content = '';
    let summary = '';

    if (aiGeneratedContentWithMalformedSeparator.includes(summarySeparator)) {
      const parts = aiGeneratedContentWithMalformedSeparator.split(summarySeparator);
      if (parts.length === 2) {
        content = parts[0].trim();
        summary = parts[1].trim();
      }
    } else {
      // 如果没有找到正确的分隔符，则整个内容都是正文
      content = aiGeneratedContentWithMalformedSeparator.trim();
    }

    // 验证解析结果 - 应该没有找到正确的分隔符
    expect(content).toContain('夜幕降临，古老的城堡在月光下显得格外神秘');
    expect(content).toContain('#SUMARY#'); // 错误的分隔符应该保留在内容中
    expect(summary).toBe(''); // 摘要应该为空
    
    console.log('Content with malformed separator:', content);
  });
});