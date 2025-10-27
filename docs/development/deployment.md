# 项目部署指南

## 🎯 部署概述

AI智能小说创作平台支持多种部署方式，可根据实际需求选择最适合的部署方案。项目基于Vite构建，支持静态部署和容器化部署。

## 🚀 快速部署

### 环境要求
- **Node.js**: 16.0.0 或更高版本
- **包管理器**: pnpm (推荐) 或 npm
- **构建工具**: Vite
- **浏览器**: 现代浏览器（Chrome、Firefox、Safari、Edge等）

### 本地开发部署
```bash
# 克隆项目
git clone <项目地址>

# 进入项目目录
cd novel-writing-platform

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

## 📦 生产环境部署

### 构建项目
```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm run build
```

构建完成后，所有静态资源将生成在 `dist/` 目录中。

### 静态文件部署

#### Nginx部署
1. 将 `dist/` 目录中的所有文件复制到Nginx服务器的web目录
2. 配置Nginx支持SPA路由：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;
    
    # 支持 React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存优化
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache部署
1. 将 `dist/` 目录中的所有文件复制到Apache服务器的web目录
2. 配置 `.htaccess` 文件支持SPA路由：

```apache
Options -MultiViews
RewriteEngine On

# 处理SPA路由
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### 容器化部署

#### Docker部署
1. 构建Docker镜像：
```bash
docker build -t novel-writing-platform .
```

2. 运行容器：
```bash
docker run -p 80:80 novel-writing-platform
```

#### Docker Compose部署
```yaml
version: '3.8'
services:
  novel-platform:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
```

运行命令：
```bash
docker-compose up -d
```

### 云平台部署

#### Vercel部署
1. 安装Vercel CLI：
```bash
npm i -g vercel
```

2. 部署项目：
```bash
vercel --prod
```

#### Netlify部署
1. 在Netlify控制台连接Git仓库
2. 配置构建设置：
   - 构建命令：`pnpm run build`
   - 发布目录：`dist`
   - Node版本：18或更高

#### GitHub Pages部署
在 `.github/workflows/deploy.yml` 中添加：

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
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: latest
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build
      run: pnpm run build
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## ⚙️ 环境配置

### 环境变量
在项目根目录创建 `.env` 文件配置环境变量：

```env
# API基础地址
VITE_API_BASE_URL=https://your-api.com

# 应用标题
VITE_APP_TITLE=AI智能小说创作平台

# 是否启用调试模式
VITE_DEBUG=false

# Supabase配置
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 多环境配置
支持不同环境的配置文件：
- `.env.development` - 开发环境
- `.env.production` - 生产环境
- `.env.test` - 测试环境

## 🔧 构建优化

### 代码分割
项目已配置动态导入和路由级代码分割，自动将代码分割为多个chunk。

### 资源压缩
生产构建自动启用以下优化：
- **Gzip压缩**：静态资源Gzip压缩
- **图片优化**：图片文件压缩优化
- **CSS/JS最小化**：代码最小化处理
- **Tree Shaking**：移除未使用的代码

### CDN配置
建议将静态资源托管到CDN以提高加载速度：

```js
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  }
})
```

## 🔒 安全配置

### HTTPS配置
强烈建议启用HTTPS：
- 使用Let's Encrypt免费SSL证书
- 配置HTTP到HTTPS重定向

### 安全头配置

#### Nginx安全头
```nginx
# 安全头配置
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header Content-Security-Policy "default-src 'self';";
```

#### 内容安全策略
配置Content Security Policy防止XSS攻击：
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

## ⚡ 性能优化

### 预加载关键资源
```html
<!-- 预加载关键CSS -->
<link rel="preload" href="/assets/index.css" as="style">

<!-- 预加载关键字体 -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
```

### 资源缓存策略
- **静态资源**：长期缓存（1年）
- **HTML文件**：不缓存或短期缓存
- **API请求**：根据需要设置缓存头

### 懒加载优化
```typescript
// 路由组件懒加载
const NovelEditor = lazy(() => import('@/pages/NovelEditor'))

// 组件懒加载
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'))
```

## 🐛 故障排除

### 构建失败
1. 检查Node.js版本（推荐18+）
2. 清除缓存：
   ```bash
   pnpm clean
   # 或删除 node_modules 和 pnpm-lock.yaml
   rm -rf node_modules pnpm-lock.yaml
   ```
3. 重新安装依赖：
   ```bash
   pnpm install
   ```

### 运行时错误
1. 检查浏览器控制台错误信息
2. 确认API接口地址配置正确
3. 检查网络连接和防火墙设置
4. 验证环境变量配置

### 路由问题
确保服务器配置支持SPA路由：
- 所有路由都应返回 `index.html`
- 配置 `try_files` 或等效设置

### 性能问题
1. 检查资源加载时间
2. 分析bundle大小：
   ```bash
   pnpm run build -- --analyze
   ```
3. 优化大体积依赖
4. 启用代码分割

## 📊 监控和日志

### 前端监控
集成前端监控服务：
- **错误监控**：捕获JavaScript错误
- **性能监控**：监控页面加载性能
- **用户行为**：分析用户使用行为

### 日志配置
```typescript
// 生产环境日志
if (import.meta.env.PROD) {
  // 发送日志到监控服务
  console.log = (...args) => {
    // 上报日志
  }
}
```

## 🎯 最佳实践

### 部署流程
1. **代码审查**：确保代码质量
2. **测试验证**：完成功能测试和性能测试
3. **构建检查**：验证构建过程无错误
4. **灰度发布**：先小范围部署验证
5. **全量发布**：确认无误后全量发布

### 备份策略
1. **代码备份**：使用Git进行版本控制
2. **数据备份**：定期备份用户数据
3. **配置备份**：备份环境配置文件
4. **灾难恢复**：制定灾难恢复计划

### 版本管理
1. **语义化版本**：遵循SemVer规范
2. **变更日志**：维护详细的变更日志
3. **回滚机制**：支持快速回滚到历史版本

## 📞 技术支持

如遇到部署问题，请按以下步骤排查：

1. **环境检查**
   - 确认Node.js版本符合要求
   - 确认包管理器版本
   - 检查系统资源（内存、磁盘空间）

2. **构建检查**
   - 查看构建日志
   - 检查依赖安装是否成功
   - 验证配置文件是否正确

3. **运行检查**
   - 查看浏览器控制台错误
   - 检查网络请求是否正常
   - 验证环境变量配置

4. **性能检查**
   - 分析页面加载时间
   - 检查资源大小
   - 优化关键渲染路径

---

🎉 **部署成功后，您的AI智能小说创作平台就可以正常使用了！**