// 简单的API测试脚本
// 使用Node.js内置的fetch

async function testApi() {
  try {
    console.log('=== 木墨文坊 API 测试 ===\n');
    
    // 测试健康检查端点
    console.log('1. 测试健康检查端点...');
    const healthResponse = await fetch('https://mumoai.onrender.com/api/health');
    console.log('   状态码:', healthResponse.status);
    
    const healthText = await healthResponse.text();
    
    // 尝试解析为JSON
    try {
      const healthData = JSON.parse(healthText);
      console.log('   响应数据:', JSON.stringify(healthData, null, 2));
    } catch (parseError) {
      console.log('   响应内容 (非JSON):', healthText.substring(0, 100) + '...');
    }
    
    // 测试用户登录端点
    console.log('\n2. 测试用户登录端点...');
    const loginResponse = await fetch('https://mumoai.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    console.log('   状态码:', loginResponse.status);
    const loginText = await loginResponse.text();
    
    // 尝试解析为JSON
    try {
      const loginData = JSON.parse(loginText);
      console.log('   响应数据:', JSON.stringify(loginData, null, 2));
    } catch (parseError) {
      console.log('   响应内容 (非JSON):', loginText.substring(0, 100) + '...');
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('API测试失败:', error);
  }
}

testApi();