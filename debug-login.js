// 登录调试脚本
async function debugLogin() {
  // 从命令行参数获取API基础URL
  const apiUrl = process.argv[2] || 'http://localhost:3000';
  
  console.log(`调试登录功能，API地址: ${apiUrl}`);
  
  try {
    console.log('\n1. 测试API基础连接...');
    const healthResponse = await fetch(`${apiUrl}/api/health`);
    console.log('健康检查状态:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('健康检查数据:', healthData);
    }
    
    console.log('\n2. 测试登录端点...');
    const loginUrl = `${apiUrl}/api/auth/login`;
    console.log('登录URL:', loginUrl);
    
    // 测试OPTIONS请求（预检请求）
    console.log('\n3. 发送OPTIONS请求...');
    const optionsResponse = await fetch(loginUrl, {
      method: 'OPTIONS'
    });
    console.log('OPTIONS响应状态:', optionsResponse.status);
    console.log('允许的方法:', optionsResponse.headers.get('allow'));
    
    // 测试POST请求
    console.log('\n4. 发送POST登录请求...');
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    console.log('登录响应状态:', loginResponse.status);
    console.log('响应头 Content-Type:', loginResponse.headers.get('content-type'));
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('登录响应数据:', loginData);
    } else {
      console.log('登录失败，状态码:', loginResponse.status);
      console.log('状态文本:', loginResponse.statusText);
      
      try {
        const errorText = await loginResponse.text();
        console.log('错误响应内容:', errorText);
      } catch (e) {
        console.log('无法读取错误响应内容');
      }
    }
    
  } catch (error) {
    console.error('调试过程中发生错误:', error);
  }
}

// 运行调试函数
debugLogin();