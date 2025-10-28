// Render平台部署指南脚本
console.log('=== 木墨文坊 Render 部署指南 ===\n');

console.log('Render 是一个对国内访问友好的部署平台，支持全栈应用部署。\n');

console.log('## 部署步骤：\n');

console.log('1. 注册 Render 账号');
console.log('   - 访问 https://render.com/');
console.log('   - 使用 GitHub 账号注册登录\n');

console.log('2. 部署后端服务');
console.log('   - 点击 "New" -> "Web Service"');
console.log('   - 连接你的 GitHub 仓库 (https://github.com/chndaily/MuMo-AI-Writer)');
console.log('   - 配置如下：');
console.log('     * Name: mumo-ai-writer-backend');
console.log('     * Region: 选择离你较近的地区');
console.log('     * Branch: main');
console.log('     * Environment: Node');
console.log('     * Build Command: pnpm install');
console.log('     * Start Command: node server.cjs\n');

console.log('3. 配置环境变量');
console.log('   在 "Advanced" 设置中添加以下环境变量：');
console.log('   - MONGODB_URI = mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0');
console.log('   - VITE_API_BASE_URL = https://你的应用名.onrender.com');
console.log('   - WECHAT_APPID = 你的微信AppID（可选）');
console.log('   - WECHAT_MCHID = 你的微信商户ID（可选）');
console.log('   - ALIPAY_APP_ID = 你的支付宝AppID（可选）\n');

console.log('4. 部署前端静态网站');
console.log('   - 点击 "New" -> "Static Site"');
console.log('   - 连接你的 GitHub 仓库');
console.log('   - 配置如下：');
console.log('     * Name: mumo-ai-writer-frontend');
console.log('     * Build Command: pnpm build:vercel');
console.log('     * Publish Directory: dist\n');

console.log('5. 前端环境变量配置');
console.log('   添加环境变量：');
console.log('   - VITE_API_BASE_URL = https://你的后端服务名.onrender.com\n');

console.log('## 注意事项：\n');
console.log('1. Render 的免费套餐对于个人项目足够使用');
console.log('2. 部署完成后，Render 会提供一个 .onrender.com 的子域名');
console.log('3. 你可以配置自定义域名');
console.log('4. 首次部署可能需要几分钟时间');
console.log('5. 后续推送代码会自动触发重新部署\n');

console.log('## 国内访问优势：\n');
console.log('1. Render 的服务器在国外但对国内访问相对友好');
console.log('2. 静态文件CDN加速');
console.log('3. 稳定性较好');
console.log('4. 免费额度充足\n');

console.log('部署完成后，你可以访问以下URL测试：');
console.log('- 后端健康检查: https://你的后端服务名.onrender.com/api/health');
console.log('- 前端应用: https://你的前端服务名.onrender.com\n');

console.log('如果遇到问题，可以查看 Render 控制台的日志信息。');