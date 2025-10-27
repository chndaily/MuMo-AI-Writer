// 测试科技设定编辑修复逻辑

// 模拟WorldElement接口
const element = {
  id: "tech-001",
  novelId: "novel-001",
  name: "量子计算技术",
  description: "基于量子力学原理的超级计算技术",
  type: "technology",
  tags: ["计算", "量子", "未来"],
  level: "发展阶段：理论研究阶段\n核心技术：量子纠缠、叠加态维持",
  applications: "主要用途：密码破解、大数据分析\n应用领域：军事、金融、科研",
  limitations: "能源需求：需要超低温环境维持\n副作用：可能引发时间线紊乱",
  impact: "对社会的影响：极大提升了计算能力，但也带来了安全风险\n对经济的影响：催生了全新的量子计算产业\n对文化的影响：改变了人们对计算和信息的认知",
  details: "细节补充：这项技术仍在严格管控中，只有少数研究机构掌握"
};

console.log("=== 原始元素数据 ===");
console.log("impact (社会影响):", element.impact);
console.log("details (细节补充):", element.details);

// 模拟修复后的handleEdit逻辑
function handleEdit(element) {
  console.log("\n=== 模拟handleEdit处理 ===");
  
  // 对于科技设定类型，清理社会影响和细节补充字段中的标签内容
  let impact = element.impact || '';
  let details = element.details || '';
  
  // 清理社会影响字段中的标签内容
  if (impact.includes('对社会的影响：')) {
    // 提取"对社会的影响："之后的实际内容
    const impactLines = impact.split('\n');
    const cleanedImpactLines = impactLines.map(line => {
      if (line.includes('对社会的影响：')) {
        const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
        if (colonIndex > -1) {
          return line.substring(colonIndex + 1).trim();
        }
      } else if (line.includes('对经济的影响：')) {
        const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
        if (colonIndex > -1) {
          return line.substring(colonIndex + 1).trim();
        }
      } else if (line.includes('对文化的影响：')) {
        const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
        if (colonIndex > -1) {
          return line.substring(colonIndex + 1).trim();
        }
      }
      return line;
    }).filter(line => line.trim() !== ''); // 过滤掉空行
    
    impact = cleanedImpactLines.join('\n');
  }
  
  // 清理细节补充字段中的标签内容
  if (details.includes('细节补充：')) {
    // 提取"细节补充："之后的实际内容
    const detailsLines = details.split('\n');
    const cleanedDetailsLines = detailsLines.map(line => {
      if (line.includes('细节补充：')) {
        const colonIndex = Math.max(line.indexOf('：'), line.indexOf(':'));
        if (colonIndex > -1) {
          return line.substring(colonIndex + 1).trim();
        }
      }
      return line;
    }).filter(line => line.trim() !== ''); // 过滤掉空行
    
    details = cleanedDetailsLines.join('\n');
  }
  
  // 准备表单字段值
  const formValues = {
    ...element,
    impact: impact,
    details: details
  };
  
  console.log("处理后的impact (社会影响):", formValues.impact);
  console.log("处理后的details (细节补充):", formValues.details);
  
  return formValues;
}

// 执行测试
const result = handleEdit(element);

console.log("\n=== 验证结果 ===");
console.log("社会影响字段是否还包含标签内容:");
if (result.impact.includes('对社会的影响：')) {
  console.log("❌ 仍然包含标签内容");
} else {
  console.log("✅ 不再包含标签内容");
}

console.log("细节补充字段是否还包含标签内容:");
if (result.details.includes('细节补充：')) {
  console.log("❌ 仍然包含标签内容");
} else {
  console.log("✅ 不再包含标签内容");
}

console.log("\n=== 处理前后对比 ===");
console.log("处理前社会影响内容:");
console.log(element.impact);
console.log("\n处理后社会影响内容:");
console.log(result.impact);

console.log("\n处理前细节补充内容:");
console.log(element.details);
console.log("\n处理后细节补充内容:");
console.log(result.details);

// 模拟多次编辑的情况
console.log("\n=== 模拟多次编辑 ===");
console.log("第一次编辑结果:");
console.log("impact:", result.impact);
console.log("details:", result.details);

// 再次调用handleEdit（模拟用户第二次点击编辑）
const result2 = handleEdit(result);
console.log("\n第二次编辑结果:");
console.log("impact:", result2.impact);
console.log("details:", result2.details);

console.log("\n结论: 修复后的逻辑应该能确保在第一次编辑时就清理掉标签内容，避免需要多次点击的问题");