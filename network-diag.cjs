// 网络诊断脚本
const { exec } = require('child_process');
const dns = require('dns').promises;

async function diagnoseNetwork() {
  console.log('=== 网络诊断 ===\n');
  
  // 1. 检查域名解析
  console.log('1. 检查域名解析:');
  try {
    const addresses = await dns.resolve4('mumoai.vercel.app');
    console.log(`   解析结果: ${addresses.join(', ')}`);
  } catch (error) {
    console.log(`   解析失败: ${error.message}`);
  }
  
  // 2. 检查GitHub域名解析
  console.log('\n2. 检查GitHub域名解析:');
  try {
    const addresses = await dns.resolve4('github.com');
    console.log(`   解析结果: ${addresses.join(', ')}`);
  } catch (error) {
    console.log(`   解析失败: ${error.message}`);
  }
  
  // 3. 使用nslookup检查域名
  console.log('\n3. 使用nslookup检查域名:');
  exec('nslookup mumoai.vercel.app', (error, stdout, stderr) => {
    if (error) {
      console.log(`   nslookup失败: ${error.message}`);
    } else {
      console.log(`   nslookup结果:\n${stdout}`);
    }
    
    // 4. 检查网络连接
    console.log('\n4. 检查网络连接:');
    exec('ping -n 1 github.com', (error, stdout, stderr) => {
      if (error) {
        console.log(`   网络连接检查失败: ${error.message}`);
      } else {
        console.log(`   网络连接正常`);
      }
      
      console.log('\n=== 诊断完成 ===');
      console.log('\n如果域名解析失败，请检查：');
      console.log('1. Vercel项目是否已正确部署');
      console.log('2. 自定义域名是否已正确配置');
      console.log('3. DNS设置是否正确');
    });
  });
}

diagnoseNetwork();