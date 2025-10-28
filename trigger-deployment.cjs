// 触发Vercel部署脚本
const { exec } = require('child_process');

console.log('=== 触发Vercel部署 ===\n');

// 检查当前Git状态
exec('git status --porcelain', (error, stdout, stderr) => {
  if (error) {
    console.log(`检查Git状态时出错: ${error.message}`);
    return;
  }
  
  if (stdout.trim() !== '') {
    console.log('检测到未提交的更改，先提交更改:');
    exec('git add . && git commit -m "Update deployment configuration"', (error, stdout, stderr) => {
      if (error) {
        console.log(`提交更改时出错: ${error.message}`);
        return;
      }
      console.log('更改已提交');
      pushToRemote();
    });
  } else {
    console.log('没有未提交的更改，直接推送触发部署');
    pushToRemote();
  }
});

function pushToRemote() {
  console.log('\n推送代码到GitHub以触发Vercel部署...');
  
  exec('git push origin main', (error, stdout, stderr) => {
    if (error) {
      console.log(`推送失败: ${error.message}`);
      return;
    }
    
    console.log('✓ 代码已推送到GitHub');
    console.log('✓ Vercel部署应该已触发');
    console.log('\n请在Vercel控制台中查看部署进度');
    console.log('部署完成后，请测试以下URL:');
    console.log('  - https://mumoai.vercel.app/api/health');
    console.log('  - https://mumoai.vercel.app/api/auth/login');
  });
}

console.log('提示: 如果部署仍然失败，请检查Vercel控制台中的部署日志');