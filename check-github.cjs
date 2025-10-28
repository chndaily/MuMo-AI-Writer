// GitHub状态检查脚本
const { exec } = require('child_process');

console.log('=== GitHub状态检查 ===\n');

// 检查最后一次提交
console.log('1. 最后一次提交:');
exec('git log -1 --oneline', (error, stdout, stderr) => {
  if (error) {
    console.log(`   获取提交信息失败: ${error.message}`);
  } else {
    console.log(`   ${stdout}`);
  }
  
  // 检查远程仓库状态
  console.log('\n2. 远程仓库状态:');
  exec('git remote show origin', (error, stdout, stderr) => {
    if (error) {
      console.log(`   获取远程仓库信息失败: ${error.message}`);
    } else {
      console.log(`   远程仓库信息:`);
      console.log(stdout);
    }
    
    // 检查是否有未推送的提交
    console.log('\n3. 检查未推送的提交:');
    exec('git status', (error, stdout, stderr) => {
      if (error) {
        console.log(`   获取状态信息失败: ${error.message}`);
      } else {
        console.log(`   ${stdout}`);
      }
      
      console.log('=== 检查完成 ===');
      console.log('\n如果应用无法访问，请检查：');
      console.log('1. Vercel控制台中的部署状态');
      console.log('2. 部署日志中是否有错误');
      console.log('3. 环境变量是否已正确配置');
    });
  });
});