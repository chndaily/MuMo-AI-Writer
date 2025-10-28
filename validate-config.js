// 环境变量配置验证脚本
console.log('=== 木墨文坊环境变量配置验证 ===\n');

// 检查VITE_API_BASE_URL
const apiBaseUrl = process.env.VITE_API_BASE_URL || import.meta.env?.VITE_API_BASE_URL;
console.log('1. API基础URL检查:');
if (apiBaseUrl) {
  console.log(`   值: ${apiBaseUrl}`);
  
  // 检查是否包含协议前缀
  if (apiBaseUrl.startsWith('https://')) {
    console.log('   ✓ 包含正确的协议前缀 https://');
  } else if (apiBaseUrl.startsWith('http://')) {
    console.log('   ⚠ 包含HTTP协议前缀，生产环境建议使用HTTPS');
  } else {
    console.log('   ✗ 缺少协议前缀，应为 https://your-domain.vercel.app');
  }
  
  // 检查是否包含末尾斜杠
  if (apiBaseUrl.endsWith('/')) {
    console.log('   ⚠ URL末尾包含斜杠，建议移除');
  } else {
    console.log('   ✓ URL格式正确');
  }
} else {
  console.log('   ✗ 未设置 VITE_API_BASE_URL');
}

console.log();

// 检查MONGODB_URI
const mongodbUri = process.env.MONGODB_URI || import.meta.env?.MONGODB_URI;
console.log('2. MongoDB连接字符串检查:');
if (mongodbUri) {
  console.log(`   值: ${mongodbUri}`);
  
  // 检查协议
  if (mongodbUri.startsWith('mongodb+srv://')) {
    console.log('   ✓ 使用正确的MongoDB SRV协议');
  } else if (mongodbUri.startsWith('mongodb://')) {
    console.log('   ⚠ 使用标准MongoDB协议，云部署建议使用SRV协议');
  } else {
    console.log('   ✗ 协议不正确，应以 mongodb+srv:// 或 mongodb:// 开头');
  }
  
  // 检查是否包含用户名和密码
  if (mongodbUri.includes(':') && mongodbUri.includes('@')) {
    console.log('   ✓ 包含认证信息');
  } else {
    console.log('   ✗ 缺少认证信息');
  }
  
  // 检查是否指定数据库名称
  const uriParts = mongodbUri.split('/');
  if (uriParts.length > 3 && uriParts[3] && !uriParts[3].startsWith('?')) {
    console.log('   ✓ 指定数据库名称');
  } else {
    console.log('   ⚠ 未明确指定数据库名称，可能需要在连接时指定');
  }
} else {
  console.log('   ✗ 未设置 MONGODB_URI');
}

console.log();

// 检查必需的环境变量是否存在
console.log('3. 必需环境变量检查:');
const requiredVars = ['VITE_API_BASE_URL', 'MONGODB_URI'];
const missingVars = [];

for (const varName of requiredVars) {
  const value = process.env[varName] || import.meta.env?.[varName];
  if (!value) {
    missingVars.push(varName);
  }
}

if (missingVars.length === 0) {
  console.log('   ✓ 所有必需的环境变量都已设置');
} else {
  console.log(`   ✗ 缺少以下环境变量: ${missingVars.join(', ')}`);
}

console.log();

// 提供配置建议
console.log('4. 配置建议:');
console.log('   基于你提供的信息，建议的配置为:');
console.log('   VITE_API_BASE_URL=https://mumoai.vercel.app');
console.log('   MONGODB_URI=mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0');

console.log('\n=== 验证完成 ===');