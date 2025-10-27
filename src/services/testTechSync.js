// 简化版本的科技设定测试，使用JavaScript而不是TypeScript

// 模拟worldSettingParserService的部分功能
const extractValue = (line) => {
  console.log(`提取值，原始行: "${line}"`);
  // 处理中文冒号和英文冒号
  const colonIndex = line.indexOf('：');
  if (colonIndex > -1) {
    const value = line.substring(colonIndex + 1).trim();
    console.log(`检测到中文冒号，提取的值: "${value}"`);
    return value;
  }

  const englishColonIndex = line.indexOf(':');
  if (englishColonIndex > -1) {
    const value = line.substring(englishColonIndex + 1).trim();
    console.log(`检测到英文冒号，提取的值: "${value}"`);
    return value;
  }

  const trimmed = line.trim();
  console.log(`没有检测到冒号，返回整行: "${trimmed}"`);
  return trimmed;
};

// 模拟科技设定解析逻辑
function parseSettingDetails(content, type) {
  const lines = content.split('\n');
  const details = {};
  
  let currentField = null;
  let inBasicInfo = false;

  if (type === 'technology') {
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检查是否进入新的部分
      if (trimmedLine.includes('【基本信息】')) {
        inBasicInfo = true;
        currentField = null;
        continue;
      } else if (trimmedLine.includes('【科技水平】')) {
        inBasicInfo = false;
        currentField = 'level';
        continue;
      } else if (trimmedLine.includes('【应用场景】')) {
        currentField = 'applications';
        continue;
      } else if (trimmedLine.includes('【使用限制】')) {
        currentField = 'limitations';
        continue;
      } else if (trimmedLine.includes('【社会影响】')) {
        currentField = 'impact';
        continue;
      } else if (trimmedLine.includes('【细节补充】')) {
        currentField = 'details';
        continue;
      }
      
      // 处理各部分内容
      if (inBasicInfo) {
        // 处理基本信息部分
        if (trimmedLine.includes('名称') || trimmedLine.includes('名字')) {
          details.name = extractValue(trimmedLine);
        } else if (trimmedLine.includes('标签')) {
          const tagsStr = extractValue(trimmedLine);
          if (tagsStr) {
            // 支持多种分隔符：逗号、顿号、中文顿号
            const extractedTags = tagsStr.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag);
            details.tags = extractedTags;
          }
        } else if (trimmedLine.includes('描述')) {
          details.description = extractValue(trimmedLine);
        }
      } else if (currentField) {
        // 忽略空行和分隔符
        if (trimmedLine && !trimmedLine.includes('【') && !trimmedLine.startsWith('---')) {
          // 处理科技水平字段，包含发展阶段和核心技术等内容
          if (currentField === 'level') {
            // 将包含子项名称的行直接添加到科技水平内容中
            if (!details.level) {
              details.level = trimmedLine;
            } else {
              details.level += '\n' + trimmedLine;
            }
          } else if (currentField === 'applications') {
            // 将包含子项名称的行直接添加到应用场景内容中
            if (!details.applications) {
              details.applications = trimmedLine;
            } else {
              details.applications += '\n' + trimmedLine;
            }
          } else if (currentField === 'limitations') {
            // 将包含子项名称的行直接添加到使用限制内容中
            if (!details.limitations) {
              details.limitations = trimmedLine;
            } else {
              details.limitations += '\n' + trimmedLine;
            }
          } else if (currentField === 'impact') {
            // 将包含子项名称的行直接添加到社会影响内容中
            if (!details.impact) {
              details.impact = trimmedLine;
            } else {
              details.impact += '\n' + trimmedLine;
            }
          } else {
            // 处理其他字段的列表项（以-开头的行）
            if (trimmedLine.startsWith('-')) {
              if (!details[currentField]) {
                details[currentField] = extractValue(trimmedLine);
              } else {
                details[currentField] += '\n' + extractValue(trimmedLine);
              }
            } else {
              // 处理普通文本行，如果行中包含冒号，则提取冒号后的内容，否则直接使用整行
              let valueToUse = trimmedLine;
              if (trimmedLine.includes('：') || trimmedLine.includes(':')) {
                valueToUse = extractValue(trimmedLine);
              }
              if (!details[currentField]) {
                details[currentField] = valueToUse;
              } else {
                details[currentField] += '\n' + valueToUse;
              }
            }
          }
        }
      } else {
        // 处理没有明确部分的内容
        if (trimmedLine.includes('标签')) {
          if (!details.tags) {
            details.tags = extractValue(trimmedLine);
          } else {
            details.tags += '\n' + extractValue(trimmedLine);
          }
        } else if (trimmedLine.includes('水平')) {
          if (!details.level) {
            details.level = extractValue(trimmedLine);
          } else {
            details.level += '\n' + extractValue(trimmedLine);
          }
        } else if (trimmedLine.includes('应用')) {
          if (!details.applications) {
            details.applications = extractValue(trimmedLine);
          } else {
            details.applications += '\n' + extractValue(trimmedLine);
          }
        } else if (trimmedLine.includes('限制')) {
          if (!details.limitations) {
            details.limitations = extractValue(trimmedLine);
          } else {
            details.limitations += '\n' + extractValue(trimmedLine);
          }
        } else if (trimmedLine.includes('影响')) {
          if (!details.impact) {
            details.impact = extractValue(trimmedLine);
          } else {
            details.impact += '\n' + extractValue(trimmedLine);
          }
        } else if (trimmedLine.includes('细节')) {
          if (!details.details) {
            details.details = extractValue(trimmedLine);
          } else {
            details.details += '\n' + extractValue(trimmedLine);
          }
        }
      }
    }
  }

  return details;
}

// 测试科技设定解析
const technologyContent = `
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
对经济的影响：催生了全新的量子计算产业
对文化的影响：改变了人们对计算和信息的认知
【细节补充】
这项技术仍在严格管控中，只有少数研究机构掌握
`;

console.log('=== 科技设定解析测试 ===');
const technologyResult = parseSettingDetails(technologyContent, 'technology');

console.log('解析结果:');
console.log('名称:', technologyResult.name);
console.log('标签:', technologyResult.tags);
console.log('描述:', technologyResult.description);
console.log('科技水平:', technologyResult.level);
console.log('应用场景:', technologyResult.applications);
console.log('使用限制:', technologyResult.limitations);
console.log('社会影响:', technologyResult.impact);
console.log('细节补充:', technologyResult.details);

// 模拟WorldElementPanel中的处理逻辑
console.log('\n=== 模拟WorldElementPanel处理逻辑 ===');

// 准备表单数据（模拟handleAISync中的逻辑）
const formData = {
  name: technologyResult.name || 'AI生成内容',
  description: technologyResult.description || '',
  tags: technologyResult.tags ? technologyResult.tags.join('、') : ''
};

// 科技设定字段处理（修复后的逻辑）
Object.assign(formData, {
  level: technologyResult.level || '',
  applications: technologyResult.applications || '',
  limitations: technologyResult.limitations || '',
  impact: technologyResult.impact || '',
  details: technologyResult.details || ''
});

console.log('表单数据:');
console.log('社会影响:', formData.impact);
console.log('细节补充:', formData.details);

// 检查是否有undefined或空值
console.log('\n=== 字段检查 ===');
for (const [key, value] of Object.entries(formData)) {
  if (value === undefined) {
    console.log(`警告: ${key} 字段为 undefined`);
  } else if (value === '') {
    console.log(`注意: ${key} 字段为空`);
  }
}

// 模拟handleSubmit中的处理逻辑
console.log('\n=== 模拟handleSubmit处理逻辑 ===');
const values = formData;
const elementData = {
  // 基础字段
  name: values.name,
  description: values.description,
  tags: values.tags ? values.tags.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag) : [],
  
  // 科技设定特定字段
  level: values.level,
  applications: values.applications,
  limitations: values.limitations,
  impact: values.impact,
  details: values.details
};

console.log('准备保存的元素数据:');
console.log('社会影响:', elementData.impact);
console.log('细节补充:', elementData.details);

// 检查元素数据中的字段
console.log('\n=== 元素数据字段检查 ===');
for (const [key, value] of Object.entries(elementData)) {
  if (value === undefined) {
    console.log(`警告: ${key} 字段为 undefined`);
  } else if (value === '') {
    console.log(`注意: ${key} 字段为空`);
  } else if (Array.isArray(value) && value.length === 0) {
    console.log(`注意: ${key} 字段为空数组`);
  }
}