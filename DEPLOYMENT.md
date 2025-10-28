# 部署指南

## 目录
- [Vercel部署](#vercel部署)
- [Render部署](#render部署)
- [Netlify部署](#netlify部署)
- [GitHub Pages部署](#github-pages部署)
- [国内部署选项](#国内部署选项)
- [后端服务部署](#后端服务部署)
- [MongoDB数据库配置](#mongodb数据库配置)
- [环境变量配置](#环境变量配置)
- [常见问题解决](#常见问题解决)

## Vercel部署

### 自动部署（推荐）
1. 访问[Vercel官网](https://vercel.com/)并使用GitHub账号登录
2. 点击"New Project"
3. 选择你的项目仓库
4. Vercel会自动检测项目配置并使用正确的构建设置
5. 点击"Deploy"开始部署

### 手动配置
如果自动检测失败，需要手动配置：
- Build Command: `pnpm build:vercel`
- Output Directory: `dist`
- Install Command: `pnpm install`

### 环境变量设置
在Vercel项目设置中配置以下环境变量：
- `MONGODB_URI` = `mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0`
- `VITE_API_BASE_URL` = `https://mumoai.vercel.app`

### 全栈部署说明
项目支持在Vercel上同时部署前端和后端：
- 前端静态文件部署在根路径
- 后端API服务部署在`/api/*`路径下
- 数据库通过MongoDB Atlas云服务连接

## Render部署

### 后端服务部署（推荐）
Render是一个对国内访问友好的部署平台，支持Node.js后端服务。

1. 访问[Render官网](https://render.com/)并注册账号
2. 点击"New" -> "Web Service"
3. 连接你的GitHub仓库
4. 填写以下配置：
   - Name: mumo-ai-writer-backend
   - Region: 选择离你较近的地区
   - Branch: main
   - Root Directory: 保持为空
   - Environment: Node
   - Build Command: `pnpm install`
   - Start Command: `node server.cjs`
5. 在"Advanced"中添加环境变量：
   - `MONGODB_URI` = `mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0`
   - `VITE_API_BASE_URL` = `https://你的Render应用域名.onrender.com`
   - `WECHAT_APPID` = `你的微信AppID（可选）`
   - `WECHAT_MCHID` = `你的微信商户ID（可选）`
   - `ALIPAY_APP_ID` = `你的支付宝AppID（可选）`
6. 点击"Create Web Service"

### 前端静态网站部署
1. 访问[Render官网](https://render.com/)并登录
2. 点击"New" -> "Static Site"
3. 连接你的GitHub仓库
4. 填写以下配置：
   - Name: mumo-ai-writer-frontend
   - Build Command: `pnpm build:vercel`
   - Publish Directory: `dist`
5. 添加环境变量：
   - `VITE_API_BASE_URL` = `https://你的Render后端服务域名.onrender.com`
6. 点击"Create Static Site"

### 自定义域名配置
1. 在Render项目设置中找到"Custom Domains"
2. 添加你的自定义域名
3. 按照提示配置DNS记录

## Netlify部署

### 配置文件
项目根目录已包含[netlify.toml](file:///e:/NovelSystem/taotao-writing-master/netlify.toml)配置文件：

```toml
[build]
  command = "pnpm build:vercel"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--version"
```

### 部署步骤
1. 访问[Netlify官网](https://www.netlify.com/)并使用GitHub账号登录
2. 点击"Add new site" -> "Import an existing project"
3. 选择你的GitHub仓库
4. Netlify会自动使用[netlify.toml](file:///e:/NovelSystem/taotao-writing-master/netlify.toml)中的配置
5. 点击"Deploy site"

### 环境变量设置
由于Netlify只托管静态文件，你需要设置API基础URL环境变量：
1. 在Netlify项目设置中找到"Environment variables"
2. 添加以下变量：
   - `VITE_API_BASE_URL` = `你的后端服务URL`

## GitHub Pages部署

### 自动部署
项目包含GitHub Actions工作流文件 [.github/workflows/deploy.yml](file:///e:/NovelSystem/taotao-writing-master/.github/workflows/deploy.yml)：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: '8'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build:vercel
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 手动部署
1. 构建项目：`pnpm build:vercel`
2. 将`dist`目录内容推送到`gh-pages`分支

### 环境变量设置
在GitHub仓库设置中配置环境变量：
- `VITE_API_BASE_URL` = `你的后端服务URL`

## 国内部署选项

### Gitee Pages
1. 将代码推送到Gitee仓库
2. 在Gitee仓库设置中启用Pages服务
3. 选择静态文件目录（通常是dist目录）

### 服务器部署
如果拥有自己的服务器，可以：
1. 构建项目：`pnpm build:vercel`
2. 将`dist`目录内容部署到Nginx/Apache服务器
3. 配置反向代理指向后端服务

## 后端服务部署

由于Netlify、GitHub Pages等静态托管平台不支持后端服务，你需要将后端服务部署到支持Node.js的平台。

### Render部署后端（推荐）
Render支持全栈部署，后端服务会自动部署。

### Vercel部署后端（如果Vercel可用）
Vercel支持全栈部署，后端服务会自动部署到`/api/*`路径下。

## MongoDB数据库配置

### 使用MongoDB Atlas（推荐）
1. 访问[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费账户
3. 创建M0免费集群
4. 在"Database Access"中添加数据库用户
5. 在"Network Access"中添加IP白名单（0.0.0.0/0表示允许所有IP）
6. 获取连接字符串：
   - 点击"Connect"按钮
   - 选择"Connect your application"
   - 复制连接字符串并替换用户名和密码

### 环境变量配置
无论使用哪种部署方式，都需要配置以下环境变量：
- `MONGODB_URI` = `mongodb+srv://<username>:<password>@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0`

注意：
1. 连接字符串必须包含数据库名称（mumo-ai-writer）
2. 用户名和密码需要进行URL编码（特殊字符需要转换）
3. 确保数据库用户具有读写权限

## 环境变量配置

### 项目中的环境变量文件
项目包含以下环境变量配置文件：
- [.env.example](file:///e:/NovelSystem/taotao-writing-master/.env.example) - 环境变量示例文件
- [.env.server](file:///e:/NovelSystem/taotao-writing-master/.env.server) - 服务器端环境变量配置
- [.env](file:///e:/NovelSystem/taotao-writing-master/.env) - 本地开发环境变量配置

### 必需的环境变量
在部署时，需要配置以下环境变量：

1. **MongoDB连接字符串**：
   - 变量名：`MONGODB_URI`
   - 值格式：`mongodb+srv://<username>:<password>@<cluster>/<database-name>?<options>`
   - 示例：`mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0`

2. **API基础URL**：
   - 变量名：`VITE_API_BASE_URL`
   - 值格式：`https://<your-domain>.vercel.app`（Vercel部署时）
   - 示例：`https://mumoai.vercel.app`

### 环境变量验证
项目包含验证脚本[validate-config.js](file:///e:/NovelSystem/taotao-writing-master/validate-config.js)，可以运行以下命令检查配置：
```bash
node validate-config.js
```

## 常见问题解决

### "Cannot find module 'novel'"错误
这是由于pnpm工作区结构导致的构建顺序问题。确保使用`pnpm build:vercel`命令而不是`pnpm build`。

### 页面空白和MIME类型错误
这是由于资源路径配置不正确导致的。确保在[vite.config.ts](file:///e:/NovelSystem/taotao-writing-master/vite.config.ts)中正确配置了base路径。

### 数据库连接失败
如果遇到数据库连接问题，请检查：
1. MongoDB Atlas连接字符串是否正确
2. 数据库用户权限是否正确设置
3. IP白名单是否允许来自后端服务的连接
4. 环境变量是否正确配置

### API请求失败
如果前端无法连接到后端API，请检查：
1. 后端服务是否正常运行
2. `VITE_API_BASE_URL`环境变量是否正确设置
3. CORS配置是否允许来自前端的请求

### 登录时出现405错误
405错误表示"Method Not Allowed"，即请求的方法不被允许。这通常是因为后端没有正确处理前端发送的HTTP请求方法（如POST）。

#### 解决方案：
1. 确保后端API已正确实现POST方法的路由
2. 检查部署平台是否包含了所有API文件
3. 确认环境变量已正确配置
4. 测试API端点是否正常工作：
   - 访问 `https://你的项目域名/api/health` 检查服务状态
   - 访问 `https://你的项目域名/api/test/db-test` 检查数据库连接

#### 故障排除步骤：
1. **检查API路由配置**：
   - 确认配置文件中正确配置了API路由
   - 确保API文件路径正确

2. **验证API端点**：
   - 直接在浏览器中访问健康检查端点检查API服务是否正常运行
   - 使用curl或Postman测试POST请求

3. **检查环境变量**：
   - 确保在部署平台项目设置中正确配置了`VITE_API_BASE_URL`
   - 检查前端是否正确读取了环境变量

4. **查看部署日志**：
   - 在部署平台控制台查看部署日志，检查是否有错误信息
   - 检查API函数的运行日志

### "(intermediate value).find is not a function"错误
这个错误通常出现在MongoDB查询结果处理过程中，表示尝试在非数组或非查询对象上调用了find方法。

#### 解决方案：
1. **检查MongoDB查询代码**：
   - 确保正确使用MongoDB查询方法
   - 使用`await collection.find({}).toArray()`而不是`collection.find({})`
   - 避免直接在查询游标上调用数组方法

2. **测试数据库连接**：
   - 运行测试脚本检查数据库连接

3. **查看后端日志**：
   - 在部署平台控制台查看API函数日志
   - 检查是否有数据库连接错误或查询错误

### Function Runtimes版本错误
错误信息：`Error: Function Runtimes must have a valid version`

这是由于配置中函数运行时版本指定不正确导致的。解决方案：
1. 在配置文件中，将`"runtime": "nodejs18.x"`修改为`"runtime": "@vercel/node@3.0.7"`
2. 重新部署项目
3. 确保使用支持的运行时版本

支持的Node.js运行时版本包括：
- `@vercel/node@3.0.7` (推荐)
- `@vercel/node@2.13.0`
- `@vercel/node@1.14.0`

避免使用如`nodejs18.x`这样的格式，应该使用`@vercel/node@版本号`的格式。