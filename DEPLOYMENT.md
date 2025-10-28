# 木墨文坊部署指南

## Netlify 部署（推荐的替代方案）

由于 Gitee Pages 可能不可用，推荐使用 Netlify 作为替代方案：

1. 注册 Netlify 账号（如果还没有）
2. 将代码推送到 GitHub：
   ```bash
   git push origin main
   ```

3. 在 Netlify 上连接 GitHub 仓库：
   - 登录 Netlify 控制台
   - 点击 "New site from Git"
   - 选择 GitHub 并授权
   - 选择您的仓库

4. 配置部署设置：
   - Build command: `pnpm build:vercel`
   - Publish directory: `dist`

5. 部署完成后，Netlify 会提供一个临时域名

## GitHub Pages 部署（推荐的替代方案）

由于 Gitee Pages 可能不可用，推荐使用 GitHub Pages 作为替代方案：

1. 确保代码已推送到 GitHub：
   ```bash
   git push origin main
   ```

2. 在 GitHub 仓库中启用 Pages：
   - 进入仓库的 Settings
   - 点击左侧菜单的 Pages
   - 选择 Source 为 GitHub Actions
   - 保存设置

3. 创建 GitHub Actions 工作流文件 [.github/workflows/deploy.yml](file:///e:/NovelSystem/taotao-writing-master/.github/workflows/deploy.yml)：
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

4. 推送此文件到 GitHub：
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Pages deployment workflow"
   git push origin main
   ```

5. 在 GitHub 仓库的 Settings > Pages 中设置：
   - Source: Deploy from a branch
   - Branch: gh-pages

## Gitee Pages 部署（如果可用）

1. 确保仓库为公开仓库
2. 在仓库页面点击"服务"选项卡
3. 查找并启用 Pages 服务
4. 设置分支为 main，目录为 dist
5. 点击"立即部署"

**注意：如果找不到 Pages 服务，可能是由于以下原因：**
- 您的 Gitee 账户等级不支持 Pages 服务
- Pages 服务仅对部分用户开放
- 仓库设置问题

## 如果所有平台都不可用的替代方案

### 方案一：使用 Gitee Go（如果可用）
Gitee Go 是 Gitee 提供的 CI/CD 服务，可以用来部署静态网站。

### 方案二：腾讯云静态网站托管
1. 注册腾讯云账号
2. 进入对象存储 COS 控制台
3. 创建存储桶并开启静态网站托管
4. 将构建后的文件上传到存储桶
5. 配置 CDN 加速（可选）

### 方案三：阿里云静态网站托管
1. 注册阿里云账号
2. 进入对象存储 OSS 控制台
3. 创建 Bucket 并开启静态网站托管
4. 将构建后的文件上传到 Bucket
5. 配置 CDN 加速（可选）

### 方案四：手动部署到任何支持静态文件托管的服务
1. 构建项目：
   ```bash
   pnpm build:vercel
   ```
2. 将 [dist](file:///e:/NovelSystem/taotao-writing-master/dist) 目录中的所有文件上传到支持静态文件托管的服务

## 自动化部署脚本

使用 deploy-gitee.bat 脚本可以简化部署流程：
- Windows 系统：双击运行 deploy-gitee.bat
- 其他系统：参考脚本内容执行相应命令

## 常见问题

### Q: 为什么找不到 Pages 服务？
A: 可能是因为您的 Gitee 账户等级不支持 Pages 服务，或者 Pages 服务仅对部分用户开放。

### Q: 如何检查我的 Gitee 账户是否支持 Pages？
A: 检查您的 Gitee 账户套餐，或者联系 Gitee 客服确认。

### Q: 有没有其他免费的国内静态网站托管服务？
A: 可以考虑使用 coding.net 的 Pages 服务，或者使用一些云服务商提供的免费额度。

### Q: GitHub Pages 在国内访问速度如何？
A: GitHub Pages 在国内访问速度一般，但比 Vercel 要好一些。如果需要更好的国内访问速度，建议使用国内的云服务提供商。

### Q: 为什么部署时会出现 "Cannot find module 'novel'" 错误？
A: 这是因为项目使用了 pnpm 工作区结构，"novel" 是一个本地工作区包。需要先构建这个本地包，然后再构建主应用。确保使用 `pnpm build:vercel` 命令而不是 `pnpm build`。