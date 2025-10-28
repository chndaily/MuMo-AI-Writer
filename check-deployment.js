// 部署状态检查脚本
import { get } from 'https';

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      resolve({
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        headers: response.headers
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('请求超时'));
    });
  });
}

async function checkDeployment() {
  console.log('=== 木墨文坊部署状态检查 ===\n');
  
  const urls = [
    'https://mumoai.vercel.app',
    'https://mumoai.vercel.app/api/health',
    'https://mumoai.vercel.app/api/test/db-test'
  ];
  
  for (const url of urls) {
    console.log(`检查: ${url}`);
    try {
      const result = await checkUrl(url);
      console.log(`  状态码: ${result.statusCode}`);
      console.log(`  状态消息: ${result.statusMessage}`);
      if (result.statusCode === 200) {
        console.log('  ✓ 访问正常');
      } else {
        console.log(`  ⚠ 状态码异常: ${result.statusCode}`);
      }
    } catch (error) {
      console.log(`  ✗ 访问失败: ${error.message}`);
    }
    console.log();
  }
  
  console.log('=== 检查完成 ===');
  console.log('\n如果所有检查都失败，请确认：');
  console.log('1. Vercel部署是否已完成');
  console.log('2. 域名是否正确配置');
  console.log('3. 网络连接是否正常');
}

checkDeployment();