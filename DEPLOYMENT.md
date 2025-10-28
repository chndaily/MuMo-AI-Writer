# 木墨文坊部署指南

## Gitee Pages 部署（推荐，如果可用）

1. 确保仓库为公开仓库
2. 在仓库页面点击"服务"选项卡
3. 查找并启用 Pages 服务
4. 设置分支为 main，目录为 dist
5. 点击"立即部署"

**注意：如果找不到 Pages 服务，可能是由于以下原因：**
- 您的 Gitee 账户等级不支持 Pages 服务
- Pages 服务仅对部分用户开放
- 仓库设置问题

## 如果 Gitee Pages 不可用的替代方案

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

### 方案四：使用 Netlify（国外服务，但有国内节点）
1. 注册 Netlify 账号
2. 将代码推送到 GitHub
3. 在 Netlify 上连接 GitHub 仓库
4. 设置构建命令：`pnpm build`
5. 设置发布目录：`dist`

### 方案五：手动部署到任何支持静态文件托管的服务
1. 构建项目：
   ```bash
   pnpm build
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