// API端点测试脚本
const https = require('https');

// 测试的API端点
const endpoints = [
  {
    name: '健康检查',
    url: 'https://mumoai.vercel.app/api/health',
    method: 'GET'
  },
  {
    name: '用户登录',
    url: 'https://mumoai.vercel.app/api/auth/login',
    method: 'POST',
    data: {
      email: 'admin@example.com',
      password: 'admin123'
    }
  },
  {
    name: '用户注册',
    url: 'https://mumoai.vercel.app/api/auth/register',
    method: 'POST',
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: 'test123'
    }
  }
];

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(endpoint.url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          name: endpoint.name,
          url: endpoint.url,
          method: endpoint.method,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject({
        name: endpoint.name,
        url: endpoint.url,
        method: endpoint.method,
        error: error.message
      });
    });
    
    // 如果有数据，发送数据
    if (endpoint.data) {
      req.write(JSON.stringify(endpoint.data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('=== API端点测试 ===\n');
  
  for (const endpoint of endpoints) {
    console.log(`测试: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    console.log(`方法: ${endpoint.method}`);
    
    try {
      const result = await testEndpoint(endpoint);
      console.log(`状态码: ${result.statusCode}`);
      console.log(`状态消息: ${result.statusMessage}`);
      
      if (result.data) {
        try {
          const jsonData = JSON.parse(result.data);
          console.log(`响应数据: ${JSON.stringify(jsonData, null, 2)}`);
        } catch (e) {
          console.log(`响应数据: ${result.data}`);
        }
      }
      
      if (result.statusCode === 200 || result.statusCode === 201) {
        console.log('✓ 测试通过');
      } else if (result.statusCode === 405) {
        console.log('✗ 405错误: 方法不被允许');
      } else {
        console.log(`⚠ 状态码异常: ${result.statusCode}`);
      }
    } catch (error) {
      console.log(`✗ 测试失败: ${error.error}`);
    }
    
    console.log('');
  }
  
  console.log('=== 测试完成 ===');
}

runTests();