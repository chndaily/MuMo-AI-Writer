// 简单连接测试脚本
const net = require('net');

console.log('=== 简单连接测试 ===\n');

// 测试端口连接
const host = 'mumoai.vercel.app';
const port = 443;

console.log(`测试连接到 ${host}:${port}`);

const socket = new net.Socket();

socket.setTimeout(5000); // 5秒超时

socket.connect(port, host, () => {
  console.log('✓ 连接成功');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log(`✗ 连接失败: ${err.message}`);
  socket.destroy();
});

socket.on('timeout', () => {
  console.log('✗ 连接超时');
  socket.destroy();
});

// 也测试一下GitHub的连接
setTimeout(() => {
  console.log('\n测试连接到 GitHub (20.205.243.166:443)');
  
  const githubSocket = new net.Socket();
  githubSocket.setTimeout(5000);
  
  githubSocket.connect(443, '20.205.243.166', () => {
    console.log('✓ GitHub连接成功');
    githubSocket.destroy();
  });
  
  githubSocket.on('error', (err) => {
    console.log(`✗ GitHub连接失败: ${err.message}`);
    githubSocket.destroy();
  });
  
  githubSocket.on('timeout', () => {
    console.log('✗ GitHub连接超时');
    githubSocket.destroy();
  });
}, 1000);