# 项目结构说明

## 🎯 项目概述

AI智能小说创作平台是一个基于React+Antd+Zustand+Vite的现代化AI智能小说创作平台，旨在为作者提供高效、智能的写作体验。

## 🏗️ 目录结构

```
src/
├── components/          # 通用组件
│   ├── AppHeader.tsx   # 应用头部组件
│   └── AppSider.tsx    # 应用侧边栏组件
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

## 📁 详细目录说明

### components/ - 通用组件
存放项目中可复用的UI组件：
- **AppHeader.tsx**: 应用顶部导航栏，包含logo、导航菜单和用户操作
- **AppSider.tsx**: 应用侧边栏，提供主要功能导航

### pages/ - 页面组件
存放应用的主要页面组件：
- **HomePage.tsx**: 应用首页，展示平台概览、快速操作和统计数据
- **NovelEditor.tsx**: 小说编辑器页面，提供专业的在线编辑功能
- **NovelList.tsx**: 小说列表页面，管理所有小说作品

### stores/ - 状态管理
使用Zustand进行状态管理：
- **novelStore.ts**: 小说数据状态管理，包含小说的CRUD操作、自动保存等

### hooks/ - 自定义Hook
存放自定义React Hook：
- **useNovel.ts**: 小说相关操作Hook，封装小说编辑、保存等逻辑

### utils/ - 工具函数
存放通用工具函数：
- **helpers.ts**: 包含日期格式化、字数统计、防抖节流、本地存储等工具函数

### types/ - 类型定义
存放TypeScript类型定义：
- **index.ts**: 定义全局类型，包括小说、用户、AI相关类型等

### styles/ - 样式文件
存放全局样式文件和组件样式。

### 根目录文件
- **App.tsx**: 主应用组件，包含路由配置和主要布局
- **main.tsx**: 应用入口文件，负责渲染应用
- **index.css**: 全局样式文件

## 🚀 技术栈

### 核心技术
- **React 18**: 前端框架
- **TypeScript**: 类型检查
- **Vite**: 构建工具
- **Zustand**: 状态管理
- **Ant Design**: UI组件库

### 依赖说明
#### 核心依赖
- `react`: React核心库
- `react-dom`: React DOM渲染
- `react-router-dom`: 路由管理
- `antd`: Ant Design UI组件库
- `zustand`: 轻量级状态管理
- `axios`: HTTP客户端
- `dayjs`: 日期处理
- `react-markdown`: Markdown渲染

#### 开发依赖
- `@vitejs/plugin-react`: Vite React插件
- `typescript`: TypeScript支持
- `vite`: 构建工具
- `@types/*`: TypeScript类型定义

## ⚙️ 配置文件

### 构建配置
- **vite.config.ts**: Vite构建配置
- **tsconfig.json**: TypeScript配置
- **tsconfig.node.json**: Node.js环境TypeScript配置

### 代码规范
- **.eslintrc**: ESLint配置
- **.prettierrc**: Prettier代码格式化配置

### 其他配置
- **.env**: 环境变量配置
- **.gitignore**: Git忽略文件配置
- **index.html**: HTML模板文件

## 📦 包管理

### 依赖管理
- 使用pnpm作为包管理工具
- 支持monorepo结构管理多个包

### 脚本命令
```json
{
  "scripts": {
    "dev": "vite",           // 启动开发服务器
    "build": "tsc && vite build",  // 构建生产版本
    "preview": "vite preview"      // 预览生产版本
  }
}
```

## 🎨 设计规范

### 组件设计
- 遵循Ant Design设计规范
- 使用函数式组件和Hooks
- 组件单一职责原则
- TypeScript类型安全

### 样式规范
- 优先使用Ant Design组件样式
- 自定义样式使用CSS-in-JS或CSS模块
- 响应式设计原则
- 主题一致性

### 状态管理
- 使用Zustand进行全局状态管理
- 合理划分状态模块
- 状态更新的不可变性
- 性能优化的selectors

## 🔧 开发指南

### 添加新页面
1. 在`pages/`目录下创建新的页面组件
2. 在`App.tsx`中添加路由配置
3. 在`AppSider.tsx`中添加导航菜单项

### 添加新组件
1. 在`components/`目录下创建组件
2. 使用TypeScript定义组件props接口
3. 遵循Ant Design设计规范

### 状态管理扩展
1. 在`stores/`目录下创建新的store文件
2. 定义状态类型和初始值
3. 实现状态更新函数
4. 在需要的组件中使用useStore Hook

### 工具函数扩展
1. 在`utils/`目录下创建新的工具文件
2. 导出需要的工具函数
3. 在其他文件中导入使用

## 📊 项目特点

### 性能优化
- 使用Vite构建，快速热重载
- React.memo优化组件渲染
- 懒加载优化首屏加载
- 代码分割提高加载性能

### 用户体验
- 响应式设计支持多端访问
- 实时字数统计和自动保存
- 强大的搜索和筛选功能
- 现代化的UI设计

### 可维护性
- 清晰的目录结构
- TypeScript类型安全
- 组件化设计
- 规范的代码风格

## 🚀 部署说明

### 构建步骤
1. 安装依赖：`pnpm install`
2. 构建项目：`pnpm run build`
3. 部署构建产物`dist/`目录

### 环境配置
- 通过环境变量配置API地址等
- 支持多环境配置（开发、测试、生产）

### 部署方式
- 静态文件部署（Nginx、Apache等）
- 云平台部署（Vercel、Netlify等）
- Docker容器化部署