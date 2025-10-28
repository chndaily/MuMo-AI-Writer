# 木墨文坊 (MuMo AI Writer)

木墨文坊是一个基于 AI 技术的智能写作平台，帮助用户高效创作精彩内容。

## 系统特性

- AI 辅助写作
- 智能内容生成
- 多种创作工具
- 会员体系
- 多平台支持

## 部署说明

请查看 [DEPLOYMENT.md](DEPLOYMENT.md) 文件获取详细的部署说明。

## 技术栈

- React + TypeScript
- Vite
- Ant Design
- MongoDB
- Supabase
- 多种 AI 模型集成

## 系统名称

- 中文名：木墨文坊
- 英文名：MuMo AI Writer

## 🚀 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design 5.x
- **样式解决方案**: Antd-style
- **状态管理**: Zustand
- **构建工具**: Vite
- **路由管理**: React Router DOM
- **HTTP客户端**: Axios
- **日期处理**: Day.js
- **Markdown渲染**: React Markdown

## ✨ 主要功能

### 🎯 核心功能
- **智能编辑器**: 专业的在线小说编辑器，支持实时预览
- **AI写作助手**: 集成AI技术，提供智能写作建议
- **创作模板**: 丰富的模板库，快速开始创作
- **版本管理**: 自动保存和版本历史管理
- **数据分析**: 详细的创作数据统计

### 📊 管理功能
- **小说管理**: 创建、编辑、删除小说作品
- **分类管理**: 支持多种小说类型分类
- **进度跟踪**: 实时跟踪创作进度
- **搜索过滤**: 强大的搜索和筛选功能

### 🎨 用户体验
- **响应式设计**: 支持桌面端和移动端
- **主题切换**: 支持明暗主题切换
- **多语言支持**: 中文界面
- **快捷键支持**: 提升编辑效率

## 🛠️ 项目结构

```
src/
├── components/          # 通用组件
│   ├── AppHeader.tsx   # 应用头部
│   └── AppSider.tsx    # 应用侧边栏
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 首页
│   ├── NovelEditor.tsx # 小说编辑器
│   └── NovelList.tsx   # 小说列表
├── stores/             # 状态管理
│   └── novelStore.ts   # 小说状态管理
├── hooks/              # 自定义Hook
│   └── useNovel.ts     # 小说相关Hook
├── utils/              # 工具函数
│   └── helpers.ts      # 通用工具函数
├── types/              # 类型定义
│   └── index.ts        # 全局类型
├── styles/             # 样式文件
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 📦 依赖说明

### 核心依赖
- `react`: React核心库
- `react-dom`: React DOM渲染
- `antd`: Ant Design UI组件库
- `@ant-design/icons`: Ant Design图标库
- `zustand`: 轻量级状态管理
- `react-router-dom`: 路由管理

### 开发依赖
- `@vitejs/plugin-react`: Vite React插件
- `typescript`: TypeScript支持
- `vite`: 构建工具
- `eslint`: 代码检查

## 🎨 自定义配置

### Vite配置
项目使用Vite作为构建工具，配置文件位于 `vite.config.ts`。

### TypeScript配置
TypeScript配置文件位于 `tsconfig.json`，已配置路径别名 `@` 指向 `src` 目录。

### ESLint配置
代码检查配置已集成，支持React和TypeScript规则。

## 🔧 开发指南

### 添加新页面
1. 在 `src/pages/` 目录下创建新的页面组件
2. 在 `src/App.tsx` 中添加路由配置
3. 在 `src/components/AppSider.tsx` 中添加导航菜单项

### 添加新组件
1. 在 `src/components/` 目录下创建组件
2. 使用TypeScript定义组件props接口
3. 遵循Ant Design设计规范

### 状态管理
使用Zustand进行状态管理，相关store位于 `src/stores/` 目录。

### 样式规范
- 优先使用Ant Design组件样式
- 自定义样式使用CSS-in-JS或CSS模块
- 遵循响应式设计原则

## 🚀 部署

### 构建
```bash
npm run build
```

### 部署到静态服务器
构建完成后，将 `dist` 目录部署到任何静态文件服务器。

### 环境变量
创建 `.env` 文件配置环境变量：
```
VITE_API_BASE_URL=your_api_url
VITE_APP_TITLE=木墨文坊
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 项目讨论区

## 📚 文档中心

有关更详细的使用说明和开发指南，请参阅 [文档中心](./docs/README.md)。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**木墨文坊** - 让创作更简单，让故事更精彩！ ✨