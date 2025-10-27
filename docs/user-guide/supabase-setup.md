# Supabase 数据库配置使用指南

## 🚀 快速开始

### 1. 准备 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并创建账户
2. 创建新项目
3. 在项目设置中获取以下信息：
   - **项目URL**: `https://your-project.supabase.co`
   - **匿名密钥**: 在 Settings → API 中找到 `anon` key
   - **服务角色密钥**: 在 Settings → API 中找到 `service_role` key（可选）

### 2. 创建数据库表

在 Supabase SQL 编辑器中执行以下 SQL：

```sql
-- 创建小说表
CREATE TABLE IF NOT EXISTS public.novels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    genre TEXT,
    word_count INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    description TEXT,
    tags TEXT[],
    cover_image TEXT,
    author TEXT,
    target_word_count INTEGER DEFAULT 100000,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建角色表
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    role TEXT,
    appearance TEXT,
    personality TEXT,
    background TEXT,
    relationships TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建大纲表
CREATE TABLE IF NOT EXISTS public.outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT,
    order_num INTEGER DEFAULT 0,
    parent_id UUID REFERENCES outlines(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建地点表
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT,
    importance TEXT,
    geography TEXT,
    climate TEXT,
    politics TEXT,
    economy TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 启用行级安全性（可选，用于多用户支持）
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_characters_novel_id ON characters(novel_id);
CREATE INDEX IF NOT EXISTS idx_outlines_novel_id ON outlines(novel_id);
CREATE INDEX IF NOT EXISTS idx_outlines_parent_id ON outlines(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_novel_id ON locations(novel_id);
```

### 3. 配置应用

1. 访问应用中的 "数据库配置" 页面
2. 填写 Supabase 项目信息：
   - **项目URL**: 您的 Supabase 项目 URL
   - **匿名密钥**: 从 Supabase 控制台复制
   - **服务角色密钥**: 可选，用于管理员操作
3. 点击 "测试连接" 确保配置正确
4. 启用 "启用自动同步" 选项
5. 点击 "保存配置"

## 🔄 工作流程

### 离线模式
- 所有数据保存在本地 IndexedDB
- 创作不受网络影响
- 数据安全存储在本地

### 在线模式
- 数据自动同步到 Supabase 云端
- 支持多设备访问
- 实时备份保护

### 混合模式（推荐）
```
本地创作 → IndexedDB → 自动同步 → Supabase 云端
    ↓           ↓            ↓            ↓
  实时保存    离线可用     网络恢复时同步   多设备访问
```

## ⚙️ 配置选项

### 基础配置
- **项目URL**: Supabase 项目地址
- **匿名密钥**: 用于基本数据操作
- **服务角色密钥**: 用于管理员级别操作

### 同步设置
- **启用自动同步**: 数据变更时自动同步到云端
- **同步间隔**: 定时同步的时间间隔（分钟）
- **冲突解决**: 以最后修改时间为准

## 📊 数据统计

配置页面实时显示：
- **本地数据**: IndexedDB 中的数据量
- **云端数据**: Supabase 中的数据量
- **最后同步时间**: 上次成功同步的时间

## 🔒 数据安全

### 权限控制
- 匿名密钥仅允许基本读写操作
- 服务角色密钥具有完全管理权限
- 支持行级安全性（RLS）

### 备份策略
- 本地 IndexedDB 作为主要存储
- Supabase 云端作为备份和同步
- 支持手动导出数据

## 🚨 故障排除

### 连接失败
1. 检查网络连接
2. 验证 Supabase 项目 URL 格式
3. 确认 API 密钥正确
4. 检查 Supabase 项目状态

### 同步失败
1. 检查网络状态
2. 验证数据库表结构
3. 查看浏览器控制台错误
4. 尝试手动同步

### 数据丢失
1. 检查本地 IndexedDB 数据
2. 查看云端 Supabase 数据
3. 使用数据导出功能备份
4. 联系技术支持

## 💡 最佳实践

### 1. 渐进式迁移
- 先在测试环境验证配置
- 小批量迁移重要数据
- 保留本地备份

### 2. 定期备份
- 启用自动同步
- 定期手动导出数据
- 监控同步状态

### 3. 性能优化
- 适当设置同步间隔
- 避免频繁的大数据量操作
- 使用索引优化查询

## 🎯 高级功能

### 多用户协作（未来支持）
- 用户认证系统
- 权限控制
- 实时协作编辑

### 数据分析（计划中）
- 写作习惯分析
- 进度统计
- 创作趋势

---

## 📞 技术支持

如遇问题，请提供：
1. 错误信息截图
2. 浏览器控制台日志
3. 网络环境描述
4. 操作步骤复现