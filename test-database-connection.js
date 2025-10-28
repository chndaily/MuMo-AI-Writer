// 数据库连接测试脚本
async function testDatabaseConnection() {
  const apiUrl = process.argv[2] || 'http://localhost:3000';
  
  console.log(`=== 木墨文坊数据库连接测试 ===`);
  console.log(`API地址: ${apiUrl}\n`);
  
  try {
    // 测试健康检查端点
    console.log('1. 测试健康检查端点...');
    const healthResponse = await fetch(`${apiUrl}/api/health`);
    console.log(`   状态码: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   响应数据:', healthData);
    } else {
      console.log('   健康检查失败');
    }
    
    // 测试数据库连接端点
    console.log('\n2. 测试数据库连接...');
    const dbTestResponse = await fetch(`${apiUrl}/api/test/db-test`);
    console.log(`   状态码: ${dbTestResponse.status}`);
    
    if (dbTestResponse.ok) {
      const dbData = await dbTestResponse.json();
      console.log('   数据库状态:', dbData.status);
      console.log('   消息:', dbData.message);
      if (dbData.collections) {
        console.log('   集合列表:', dbData.collections);
      }
    } else {
      console.log('   数据库连接测试失败');
      try {
        const errorData = await dbTestResponse.json();
        console.log('   错误详情:', errorData);
      } catch (e) {
        console.log('   无法解析错误响应');
      }
    }
    
    // 测试用户API
    console.log('\n3. 测试用户API...');
    const usersResponse = await fetch(`${apiUrl}/api/users`);
    console.log(`   状态码: ${usersResponse.status}`);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`   用户数量: ${Array.isArray(usersData) ? usersData.length : '未知'}`);
      if (Array.isArray(usersData) && usersData.length > 0) {
        console.log('   第一个用户:', usersData[0]);
      }
    } else {
      console.log('   用户API测试失败');
      try {
        const errorData = await usersResponse.json();
        console.log('   错误详情:', errorData);
      } catch (e) {
        console.log('   无法解析错误响应');
      }
    }
    
    // 测试小说API
    console.log('\n4. 测试小说API...');
    const novelsResponse = await fetch(`${apiUrl}/api/novels`);
    console.log(`   状态码: ${novelsResponse.status}`);
    
    if (novelsResponse.ok) {
      const novelsData = await novelsResponse.json();
      console.log(`   小说数量: ${Array.isArray(novelsData) ? novelsData.length : '未知'}`);
    } else {
      console.log('   小说API测试失败');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
testDatabaseConnection();