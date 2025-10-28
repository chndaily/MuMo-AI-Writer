# 木墨文坊 (MuMo AI Writer)

![木墨文坊](https://github.com/chndaily/MuMo-AI-Writer/blob/main/images/logo.png?raw=true)

木墨文坊是一个基于AI技术的创新写作平台，旨在帮助作家和内容创作者更高效地创作小说和其他文学作品。

## 系统特性

- 🤖 AI辅助创作：集成多种AI模型，提供智能写作建议
- 📚 小说管理：完整的小说、章节、角色、地点等创作元素管理
- 🎨 可视化工具：提供关系网、时间线等可视化创作工具
- ☁️ 云端同步：支持多设备数据同步
- 📱 响应式设计：适配各种设备屏幕

## 技术栈

- 前端：React + TypeScript + Vite
- 后端：Node.js + Express
- 数据库：MongoDB
- 部署：Vercel/Netlify + MongoDB Atlas
- 包管理：pnpm

## 部署说明

请参考 [DEPLOYMENT.md](DEPLOYMENT.md) 文件获取详细的部署指南。

## 环境要求

- Node.js 18+
- pnpm 8+
- MongoDB Atlas账户

## 快速开始

1. 克隆项目：
   ```bash
   git clone https://github.com/chndaily/MuMo-AI-Writer.git
   ```

2. 安装依赖：
   ```bash
   pnpm install
   ```

3. 启动开发服务器：
   ```bash
   pnpm dev
   ```

## 项目结构

```
├── packages/
│   └── headless/          # headless编辑器
├── src/                   # 主应用源码
│   ├── components/        # React组件
│   ├── pages/             # 页面组件
│   ├── services/          # 业务逻辑和服务
│   ├── stores/            # 状态管理
│   └── ...
├── api/                   # Vercel API路由
├── dist/                  # 构建输出目录
└── ...
```

## 许可证

本项目采用 MIT 许可证。
