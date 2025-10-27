// 综合测试科技设定同步过程，包括解析、表单填充和保存

// 模拟worldSettingParserService的部分功能
const extractValue = (line) => {
  // 处理中文冒号和英文冒号
  const colonIndex = line.indexOf('：');
  if (colonIndex > -1) {
    return line.substring(colonIndex + 1).trim();
  }

  const englishColonIndex = line.indexOf(':');
  if (englishColonIndex > -1) {
    return line.substring(englishColonIndex + 1).trim();
  }

  return line.trim();
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
          } else if (currentField === 'details') {
            // 将包含子项名称的行直接添加到细节补充内容中
            if (!details.details) {
              details.details = trimmedLine;
            } else {
              details.details += '\n' + trimmedLine;
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

// 模拟AI生成的科技内容
const aiGeneratedContent = `【科技设定：量子计算技术】
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
这项技术仍在严格管控中，只有少数研究机构掌握`;

console.log('=== AI生成的科技内容 ===');
console.log(aiGeneratedContent);

// 1. 模拟handleAISync中的解析过程
console.log('\n=== 1. 解析AI生成的内容 ===');
const parsedData = parseSettingDetails(aiGeneratedContent, 'technology');
console.log('解析结果:');
for (const [key, value] of Object.entries(parsedData)) {
  console.log(`${key}: ${typeof value === 'string' ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : value}`);
}

// 2. 模拟handleAISync中的表单数据准备过程
console.log('\n=== 2. 准备表单数据 ===');
const formData = {
  name: parsedData.name || 'AI生成内容',
  description: parsedData.description || '',
  tags: parsedData.tags ? parsedData.tags.join('、') : '',
  level: parsedData.level || '',
  applications: parsedData.applications || '',
  limitations: parsedData.limitations || '',
  impact: parsedData.impact || '',
  details: parsedData.details || ''
};

console.log('准备的表单数据:');
for (const [key, value] of Object.entries(formData)) {
  console.log(`${key}: ${typeof value === 'string' ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : value}`);
}

// 3. 模拟表单设置值的过程
console.log('\n=== 3. 模拟表单设置值 ===');
console.log('设置到表单的值:');
console.log('impact (社会影响):', formData.impact);
console.log('details (细节补充):', formData.details);

// 4. 模拟handleSubmit中的处理过程
console.log('\n=== 4. 模拟handleSubmit处理 ===');
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
console.log('impact (社会影响):', elementData.impact);
console.log('details (细节补充):', elementData.details);

// 5. 检查是否有问题
console.log('\n=== 5. 问题检查 ===');
let hasIssues = false;

// 检查关键字段是否为空
if (!elementData.impact || elementData.impact.trim() === '') {
  console.log('❌ 社会影响字段为空');
  hasIssues = true;
} else {
  console.log('✅ 社会影响字段有内容');
}

if (!elementData.details || elementData.details.trim() === '') {
  console.log('❌ 细节补充字段为空');
  hasIssues = true;
} else {
  console.log('✅ 细节补充字段有内容');
}

// 检查是否包含标签内容
if (elementData.impact && elementData.impact.includes('对社会的影响：')) {
  console.log('⚠️  社会影响字段包含标签内容');
} else {
  console.log('✅ 社会影响字段不包含标签内容');
}

if (elementData.details && elementData.details.includes('细节补充')) {
  console.log('⚠️  细节补充字段包含标签内容');
} else {
  console.log('✅ 细节补充字段不包含标签内容');
}

if (!hasIssues) {
  console.log('\n✅ 所有字段都正常');
} else {
  console.log('\n❌ 存在问题需要修复');
}

// 6. 模拟多次同步的情况
console.log('\n=== 6. 模拟多次同步 ===');
console.log('第一次同步结果:');
console.log('impact:', elementData.impact);
console.log('details:', elementData.details);

console.log('\n第二次同步结果:');
console.log('impact:', elementData.impact);
console.log('details:', elementData.details);

console.log('\n结论: 如果解析和处理逻辑正确，应该一次同步就能完成，不需要多次点击');