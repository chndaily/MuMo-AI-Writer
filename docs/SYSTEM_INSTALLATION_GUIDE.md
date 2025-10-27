# 木墨文坊 (MuMo AI Writer) 安装说明

## 📋 文档概述

本文档提供了木墨文坊的详细安装和部署指南，帮助开发者和系统管理员正确安装、配置和部署系统。

## 🛠️ 环境要求

### 操作系统
- Windows 10/11/Server 2019/2022
- macOS 10.15或更高版本
- Linux (Ubuntu 20.04+/CentOS 7+/Debian 10+)

### 软件依赖
- Node.js >= 16.0.0
- npm >= 8.0.0 或 pnpm >= 7.0.0
- MongoDB >= 4.4
- Git (可选，用于代码管理)

### 浏览器兼容性
- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

## 🚀 快速安装

### 1. 获取源代码
```bash
# 克隆仓库
git clone https://github.com/your-repo/mumo-ai-writer.git
cd mumo-ai-writer

# 或者下载压缩包并解压
```

### 2. 安装依赖
```bash
# 使用npm
npm install

# 或者使用pnpm (推荐)
pnpm install
```

### 3. 配置环境变量
复制并修改环境配置文件：
```bash
# 复制示例配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

主要配置项：
```env
# MongoDB连接字符串
MONGODB_URI=mongodb://localhost:27017/mumo_ai_writer

# JWT密钥
JWT_SECRET=your_jwt_secret_key

# AI模型API密钥
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key

# 应用端口
PORT=3000
```

### 4. 启动开发服务器
```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务
node server.cjs
```

### 5. 访问应用
打开浏览器访问 `http://localhost:5173` (默认前端端口)

## 🏗️ 生产环境部署

### 构建生产版本
```bash
# 构建前端
npm run build

# 预览生产版本
npm run preview
```

### 部署选项

#### 1. 传统服务器部署
```bash
# 构建前端静态文件
npm run build

# 将dist目录部署到Web服务器
# 配置反向代理指向后端服务
```

#### 2. Docker部署
构建Docker镜像：
```bash
# 构建镜像
docker build -t mumo-ai-writer .

# 运行容器
docker run -d -p 3000:3000 --name mumo-ai-writer mumo-ai-writer
```

#### 3. 云平台部署
- Vercel/Netlify (前端)
- Heroku/Railway (后端)
- 需要分别部署前端和后端服务

### 环境配置

#### 生产环境变量
创建 `.env.production` 文件：
```env
# 生产环境MongoDB连接
MONGODB_URI=mongodb://production-server:27017/mumo_ai_writer

# 生产环境JWT密钥（必须更安全）
JWT_SECRET=your_production_jwt_secret_key

# 生产环境端口
PORT=8080

# 其他生产环境配置
NODE_ENV=production
```

## 🗄️ 数据库配置

### MongoDB安装
#### Windows
1. 下载MongoDB Community Server
2. 运行安装程序
3. 启动MongoDB服务

#### macOS
```bash
# 使用Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu)
```bash
# 导入MongoDB公钥
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -

# 添加MongoDB源
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# 更新包列表
sudo apt-get update

# 安装MongoDB
sudo apt-get install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 数据库初始化
系统会在首次启动时自动初始化数据库结构和默认数据。

## 🔧 详细配置说明

### AI模型配置
平台支持多种AI模型提供商：

#### OpenAI
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选，支持自定义端点
```

#### Anthropic
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Google
```env
GOOGLE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### DeepSeek
```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 会员系统配置
```env
# 免费会员AI生成次数限制
FREE_AI_LIMIT=10

# 基础会员AI生成次数限制
BASIC_AI_LIMIT=100

# 专业会员AI生成次数限制
PROFESSIONAL_AI_LIMIT=-1  # -1表示无限制
```

### 安全配置
```env
# JWT配置
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=24h

# 密码加密
BCRYPT_SALT_ROUNDS=12
```

## 🔄 数据迁移

### 从旧版本升级
1. 备份现有数据库
2. 更新代码到新版本
3. 运行数据库迁移脚本
4. 重启服务

### 数据备份与恢复
```bash
# 备份MongoDB数据
mongodump --uri="mongodb://localhost:27017/mumo_ai_writer" --out=./backup

# 恢复MongoDB数据
mongorestore --uri="mongodb://localhost:27017/mumo_ai_writer" ./backup/mumo_ai_writer
```

## 📊 性能优化

### 前端优化
- 启用gzip压缩
- 配置CDN加速静态资源
- 启用浏览器缓存
- 优化图片资源

### 后端优化
- 数据库索引优化
- API响应缓存
- 连接池配置
- 负载均衡

### 数据库优化
```javascript
// 在MongoDB中创建索引
db.novels.createIndex({ "userId": 1 })
db.chapters.createIndex({ "novelId": 1, "order": 1 })
db.characters.createIndex({ "novelId": 1 })
```

## 🔒 安全配置

### HTTPS配置
推荐使用HTTPS保护数据传输安全：
- 使用Let's Encrypt获取免费SSL证书
- 配置Nginx反向代理
- 强制HTTPS重定向

### CORS配置
```javascript
// server.cjs中配置CORS
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true
}));
```

### 输入验证
所有用户输入都应进行验证和清理：
- 使用Joi或Yup进行数据验证
- 防止XSS攻击
- 防止SQL注入（虽然使用MongoDB，但仍需注意NoSQL注入）

## 🛠️ 故障排除

### 常见问题

#### 1. 启动失败
```bash
# 检查Node.js版本
node --version

# 检查端口占用
lsof -i :3000

# 查看详细错误日志
npm run dev --verbose
```

#### 2. 数据库连接失败
```bash
# 检查MongoDB服务状态
sudo systemctl status mongod

# 测试数据库连接
mongosh mongodb://localhost:27017/mumo_ai_writer
```

#### 3. AI功能不可用
- 检查API密钥配置
- 验证网络连接
- 查看AI提供商服务状态

#### 4. 权限问题
- 检查文件权限
- 确认用户权限配置
- 验证JWT配置

### 日志查看
```bash
# 查看前端日志
tail -f logs/frontend.log

# 查看后端日志
tail -f logs/backend.log

# 查看MongoDB日志
tail -f /var/log/mongodb/mongod.log
```

## 🧪 测试

### 单元测试
```bash
# 运行单元测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 集成测试
```bash
# 运行集成测试
npm run test:integration
```

### 端到端测试
```bash
# 运行端到端测试
npm run test:e2e
```

## 📈 监控与维护

### 系统监控
- CPU和内存使用率
- 数据库性能
- API响应时间
- 错误率统计

### 定期维护
- 数据库备份
- 日志轮转
- 依赖更新
- 安全补丁

## 📄 相关文档

- [系统使用说明](./SYSTEM_USAGE_GUIDE.md) - 系统功能使用指南
- [系统概述](./SYSTEM_OVERVIEW.md) - 系统架构和技术说明
- [开发指南](./development/README.md) - 开发相关文档
- [部署指南](./development/deployment.md) - 详细部署说明

## 🤝 技术支持

如遇到安装问题，请通过以下方式联系技术支持：
- 提交Issue到代码仓库
- 发送邮件至 support@mumo-ai-writer.com
- 在线客服（工作时间：周一至周五 9:00-18:00）

---
**木墨文坊** - 让创作更简单，让故事更精彩！ ✨