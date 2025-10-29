# Windows本地部署指南

## 环境准备

在Windows系统上部署木墨文坊系统，需要先安装以下软件：

1. **Node.js (版本18或更高)**
   - 访问 [Node.js官网](https://nodejs.org/) 下载并安装最新LTS版本
   - 安装完成后，在命令行中验证版本：
     ```
     node --version
     npm --version
     ```

2. **pnpm包管理器**
   - 安装pnpm：
     ```
     npm install -g pnpm
     ```
   - 验证安装：
     ```
     pnpm --version
     ```

3. **MongoDB数据库**
   - 访问 [MongoDB官网](https://www.mongodb.com/try/download/community) 下载MongoDB Community Server
   - 安装并启动MongoDB服务
   - 确保MongoDB服务正在运行（默认端口27017）

## 项目依赖安装

有两种方式安装项目依赖：

### 方式一：使用命令行
```bash
pnpm install
```

### 方式二：使用批处理文件
双击项目根目录下的 `install-deps.bat` 文件自动安装依赖

## 环境变量配置

### 前端环境变量
在项目根目录下创建或编辑 `.env` 文件：
```env
# API配置
VITE_API_BASE_URL=http://localhost:3001

# 应用标题
VITE_APP_TITLE=木墨文坊

# 调试模式
VITE_DEBUG=true
```

### 后端环境变量
在项目根目录下创建或编辑 `.env.server` 文件：
```env
# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/mumo-ai-writer

# 微信支付配置（可选）
WECHAT_APPID=your-wechat-appid
WECHAT_MCHID=your-wechat-mchid
WECHAT_PUBLIC_KEY=your-wechat-public-key
WECHAT_PRIVATE_KEY=your-wechat-private-key

# 支付宝配置（可选）
ALIPAY_APP_ID=your-alipay-app-id
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_PUBLIC_KEY=your-alipay-public-key
ALIPAY_PRIVATE_KEY=your-alipay-private-key
ALIPAY_SIGN_TYPE=RSA2
```

## 启动服务

### 启动前端服务
```bash
pnpm dev
```
前端服务默认运行在 `http://localhost:3030`

### 启动后端服务
```bash
pnpm server
```
或者
```bash
node server.cjs
```
后端服务默认运行在 `http://localhost:3001`

## 访问系统

1. 确保MongoDB服务正在运行
2. 启动后端服务
3. 启动前端服务
4. 在浏览器中访问 `http://localhost:3030`

## 常见问题

### 1. 端口被占用
如果默认端口被占用，可以在启动时指定其他端口：
- 前端：修改 `vite.config.ts` 中的 port 配置
- 后端：设置环境变量 PORT 或修改 `server.cjs` 中的 port 配置

### 2. MongoDB连接失败
- 检查MongoDB服务是否正在运行
- 检查 `.env.server` 中的 MONGODB_URI 配置是否正确
- 确保防火墙没有阻止MongoDB端口

### 3. 依赖安装失败
- 清除缓存后重新安装：
  ```
  pnpm store prune
  pnpm install
  ```
- 检查网络连接是否正常