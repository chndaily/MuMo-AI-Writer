// 使用CommonJS格式的测试脚本
const { exec } = require('child_process');

// 测试的URL列表
const urls = [
  'https://mumoai.vercel.app',
  'https://mumoai.vercel.app/api/health',
  'https://mumoai.vercel.app/api/test/db-test'
];

console.log('=== 木墨文坊部署状态检查 (使用curl) ===\n');

// 逐个测试URL
urls.forEach((url, index) => {
  console.log(`测试 ${index + 1}: ${url}`);
  
  // 使用curl测试URL
  exec(`curl -I -m 10 "${url}"`, (error, stdout, stderr) => {
    if (error) {
      console.log(`  结果: 访问失败`);
      console.log(`  错误: ${error.message}`);
    } else {
      console.log(`  结果: 访问成功`);
      console.log(`  输出: ${stdout}`);
    }
    console.log();
    
    // 如果是最后一个URL，显示完成信息
    if (index === urls.length - 1) {
      console.log('=== 测试完成 ===');
    }
  });
});