// API测试脚本
async function testAPI() {
  const apiUrl = process.argv[2] || 'http://localhost:3000';
  
  console.log(`Testing API at: ${apiUrl}`);
  
  try {
    // 测试健康检查端点
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${apiUrl}/api/health`);
    console.log('Health Status:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('Health Data:', healthData);
    
    // 测试登录端点 (POST方法)
    console.log('\n2. Testing login endpoint (POST)...');
    const loginResponse = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    console.log('Login Status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login Data:', loginData);
    
    // 测试登录端点 (GET方法) - 这应该返回405错误
    console.log('\n3. Testing login endpoint (GET) - should return 405...');
    const getLoginResponse = await fetch(`${apiUrl}/api/auth/login`);
    console.log('GET Login Status:', getLoginResponse.status);
    if (getLoginResponse.status === 405) {
      console.log('✓ Correctly returned 405 for GET request to POST-only endpoint');
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();