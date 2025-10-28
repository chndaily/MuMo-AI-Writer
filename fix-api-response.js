// API响应处理修复脚本
console.log('=== 木墨文坊API响应处理修复 ===\n');

// 修复后的apiRequest函数
function fixApiRequest(responseData) {
  console.log('原始响应数据:', typeof responseData, responseData);
  
  // 检查数据类型
  if (responseData === null || responseData === undefined) {
    console.log('响应数据为空');
    return responseData;
  }
  
  // 如果已经是数组，直接返回
  if (Array.isArray(responseData)) {
    console.log('数据已经是数组');
    return responseData;
  }
  
  // 如果是对象，检查是否包含find/filter方法
  if (typeof responseData === 'object') {
    // 检查是否是MongoDB查询结果对象
    if (responseData.hasOwnProperty('find') || responseData.hasOwnProperty('filter')) {
      console.log('检测到可能是MongoDB查询结果对象');
      
      // 尝试转换为数组（如果是游标对象）
      if (typeof responseData.toArray === 'function') {
        try {
          const arrayData = responseData.toArray();
          console.log('已转换为数组:', arrayData);
          return arrayData;
        } catch (e) {
          console.log('转换为数组时出错:', e);
        }
      }
    }
    
    // 如果是普通对象，直接返回
    console.log('数据是普通对象');
    return responseData;
  }
  
  // 如果是其他类型，尝试解析为JSON
  if (typeof responseData === 'string') {
    try {
      const parsedData = JSON.parse(responseData);
      console.log('已解析JSON字符串:', parsedData);
      return fixApiRequest(parsedData); // 递归处理解析后的数据
    } catch (e) {
      console.log('无法解析为JSON:', e);
      return responseData;
    }
  }
  
  console.log('未知数据类型');
  return responseData;
}

// 测试函数
function testFix() {
  console.log('开始测试修复函数...\n');
  
  // 测试用例1: 正常数组
  console.log('测试1: 正常数组');
  const testArray = [{id: 1, name: 'test'}, {id: 2, name: 'test2'}];
  console.log('结果:', fixApiRequest(testArray));
  console.log();
  
  // 测试用例2: 正常对象
  console.log('测试2: 正常对象');
  const testObject = {id: 1, name: 'test'};
  console.log('结果:', fixApiRequest(testObject));
  console.log();
  
  // 测试用例3: 字符串
  console.log('测试3: JSON字符串');
  const testString = '[{"id": 1, "name": "test"}]';
  console.log('结果:', fixApiRequest(testString));
  console.log();
  
  // 测试用例4: null/undefined
  console.log('测试4: null值');
  console.log('结果:', fixApiRequest(null));
  console.log();
  
  console.log('测试完成');
}

// 运行测试
testFix();

console.log('\n=== 修复脚本执行完成 ===');