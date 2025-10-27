# IndexDB数据存储使用指南

## 🎯 概述

IndexDB是AI智能小说创作平台的核心数据存储方案，提供本地持久化存储能力，确保用户创作数据的安全性和可用性。

## 🏗️ 架构设计

### 数据存储结构
```
小说创作平台数据库 (novel-writing-platform)
├── 小说存储 (novels)
│   ├── id: string (主键)
│   ├── title: string (标题)
│   ├── content: string (内容)
│   ├── genre: string (类型)
│   ├── wordCount: number (字数)
│   ├── progress: number (进度)
│   ├── status: string (状态)
│   ├── description: string (描述)
│   ├── tags: string[] (标签)
│   ├── coverImage: string (封面图片)
│   ├── author: string (作者)
│   ├── targetWordCount: number (目标字数)
│   ├── isPublic: boolean (是否公开)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
├── 章节存储 (chapters)
│   ├── id: string (主键)
│   ├── novelId: string (小说ID，外键)
│   ├── title: string (标题)
│   ├── content: string (内容)
│   ├── order: number (排序)
│   ├── wordCount: number (字数)
│   ├── status: string (状态)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
├── 类型存储 (genres)
│   ├── id: string (主键)
│   ├── name: string (名称)
│   ├── displayName: string (显示名称)
│   ├── description: string (描述)
│   ├── color: string (颜色)
│   ├── isActive: boolean (是否激活)
│   └── createdAt: Date (创建时间)
├── 大纲存储 (outlines)
│   ├── id: string (主键)
│   ├── novelId: string (小说ID)
│   ├── title: string (标题)
│   ├── content: string (内容)
│   ├── type: string (类型)
│   ├── orderNum: number (排序)
│   ├── parentId: string (父级ID)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
├── 角色存储 (characters)
│   ├── id: string (主键)
│   ├── novelId: string (小说ID)
│   ├── name: string (名称)
│   ├── description: string (描述)
│   ├── role: string (角色类型)
│   ├── appearance: string (外貌特征)
│   ├── personality: string (性格特质)
│   ├── background: string (背景故事)
│   ├── relationships: string (人际关系)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
├── 地点存储 (locations)
│   ├── id: string (主键)
│   ├── novelId: string (小说ID)
│   ├── name: string (名称)
│   ├── description: string (描述)
│   ├── type: string (类型)
│   ├── importance: string (重要性)
│   ├── geography: string (地理环境)
│   ├── climate: string (气候特征)
│   ├── politics: string (政治环境)
│   ├── economy: string (经济状况)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
├── 文化存储 (cultures)
│   ├── id: string (主键)
│   ├── novelId: string (小说ID)
│   ├── name: string (名称)
│   ├── description: string (描述)
│   ├── customs: string (传统习俗)
│   ├── values: string (价值观念)
│   ├── arts: string (艺术表现)
│   ├── religion: string (宗教信仰)
│   ├── language: string (语言文字)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
├── 科技存储 (technologies)
│   ├── id: string (主键)
│   ├── novelId: string (小说ID)
│   ├── name: string (名称)
│   ├── description: string (描述)
│   ├── level: string (科技水平)
│   ├── core: string (核心技术)
│   ├── applications: string (应用场景)
│   ├── limitations: string (使用限制)
│   ├── impact: string (社会影响)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
├── 魔法存储 (magics)
│   ├── id: string (主键)
│   ├── novelId: string (小说ID)
│   ├── name: string (名称)
│   ├── description: string (描述)
│   ├── system: string (魔法系统)
│   ├── sources: string (能量源泉)
│   ├── rules: string (施法规则)
│   ├── spells: string (法术示例)
│   ├── artifacts: string (魔法物品)
│   ├── worldRelation: string (世界观关联)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
├── 历史存储 (histories)
│   ├── id: string (主键)
│   ├── novelId: string (小说ID)
│   ├── name: string (名称)
│   ├── description: string (描述)
│   ├── timeline: string (时间线)
│   ├── events: string (重要事件)
│   ├── figures: string (历史人物)
│   ├── consequences: string (历史后果)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
├── 统计存储 (stats)
│   ├── id: string (主键)
│   ├── totalWordCount: number (总字数)
│   ├── totalNovels: number (总小说数)
│   ├── averageWordCount: number (平均字数)
│   ├── writingStreak: number (写作连续天数)
│   ├── totalTime: number (总写作时间)
│   ├── completedNovels: number (已完成小说数)
│   ├── dailyGoal: number (每日目标)
│   ├── weeklyGoal: number (每周目标)
│   ├── monthlyGoal: number (每月目标)
│   ├── createdAt: Date (创建时间)
│   └── lastModified: Date (最后修改时间)
└── 标签存储 (tags)
    ├── id: string (主键)
    ├── name: string (名称)
    ├── color: string (颜色)
    ├── isActive: boolean (是否激活)
    └── createdAt: Date (创建时间)
```

## 🔧 核心服务

### IndexDBService
IndexDBService是操作IndexDB的核心服务类，提供以下功能：

#### 数据库初始化
```typescript
// 初始化数据库
await indexDBService.initDB()

// 重置数据库
await indexDBService.resetDB()
```

#### 小说操作
```typescript
// 添加小说
const novel = await indexDBService.addNovel({
  title: '新小说',
  content: '小说内容',
  genre: 'fantasy',
  // ...其他字段
})

// 更新小说
await indexDBService.updateNovel(novelId, {
  title: '更新的标题',
  progress: 50
})

// 删除小说
await indexDBService.deleteNovel(novelId)

// 获取所有小说
const novels = await indexDBService.getAllNovels()

// 根据ID获取小说
const novel = await indexDBService.getNovelById(novelId)

// 搜索小说
const results = await indexDBService.searchNovels({
  keyword: '关键词',
  genre: 'fantasy'
})
```

#### 章节操作
```typescript
// 添加章节
const chapter = await indexDBService.addChapter({
  novelId: novelId,
  title: '第一章',
  content: '章节内容',
  order: 1
})

// 更新章节
await indexDBService.updateChapter(chapterId, {
  title: '新章节标题'
})

// 删除章节
await indexDBService.deleteChapter(chapterId)

// 获取小说的所有章节
const chapters = await indexDBService.getChaptersByNovelId(novelId)
```

#### 类型操作
```typescript
// 添加类型
const genre = await indexDBService.addGenre({
  name: 'new-genre',
  displayName: '新类型',
  description: '类型描述'
})

// 更新类型
await indexDBService.updateGenre(genreId, {
  displayName: '更新的类型名'
})

// 删除类型
await indexDBService.deleteGenre(genreId)

// 获取所有类型
const genres = await indexDBService.getAllGenres()

// 获取活跃类型
const activeGenres = await indexDBService.getActiveGenres()
```

#### 世界观设定操作
```typescript
// 添加角色
const character = await indexDBService.addCharacter({
  novelId: novelId,
  name: '角色名',
  description: '角色描述'
  // ...其他字段
})

// 添加地点
const location = await indexDBService.addLocation({
  novelId: novelId,
  name: '地点名',
  description: '地点描述'
  // ...其他字段
})

// 添加文化设定
const culture = await indexDBService.addCulture({
  novelId: novelId,
  name: '文化名',
  description: '文化描述'
  // ...其他字段
})

// 添加科技设定
const technology = await indexDBService.addTechnology({
  novelId: novelId,
  name: '科技名',
  description: '科技描述'
  // ...其他字段
})

// 添加魔法设定
const magic = await indexDBService.addMagic({
  novelId: novelId,
  name: '魔法名',
  description: '魔法描述'
  // ...其他字段
})

// 添加历史设定
const history = await indexDBService.addHistory({
  novelId: novelId,
  name: '历史名',
  description: '历史描述'
  // ...其他字段
})
```

### Zustand Store集成
通过Zustand Store与IndexDB服务集成，提供响应式状态管理：

```typescript
import { useNovelIndexDBStore } from '@/stores/novelIndexDBStore'

const NovelComponent = () => {
  const {
    novels,
    isLoading,
    addNovel,
    updateNovel,
    deleteNovel
  } = useNovelIndexDBStore()
  
  // 组件逻辑...
}
```

## 🔄 数据同步

### 本地存储优势
1. **离线可用**：无需网络连接即可使用
2. **数据安全**：数据存储在本地，隐私性好
3. **高性能**：本地读写速度快
4. **大容量**：支持大量数据存储

### 云端同步（可选）
通过Supabase实现云端同步：
1. **自动同步**：数据变更时自动同步到云端
2. **冲突解决**：智能处理同步冲突
3. **多设备访问**：支持多设备数据同步
4. **备份恢复**：云端备份，防止数据丢失

## ⚡ 性能优化

### 索引优化
```typescript
// 为常用查询字段创建索引
const novelStore = db.createObjectStore('novels', { keyPath: 'id' })
novelStore.createIndex('genre', 'genre', { unique: false })
novelStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
```

### 批量操作
```typescript
// 批量添加小说
await indexDBService.batchAddNovels(novels)

// 批量更新小说
await indexDBService.batchUpdateNovels(updates)
```

### 分页查询
```typescript
// 分页获取小说列表
const novels = await indexDBService.getNovelsPaginated({
  page: 1,
  pageSize: 20,
  sortBy: 'lastModified',
  sortOrder: 'desc'
})
```

## 🔒 数据安全

### 数据加密
- **传输加密**：HTTPS传输加密
- **存储加密**：敏感数据加密存储
- **访问控制**：同源策略访问控制

### 备份恢复
```typescript
// 导出数据
const data = await indexDBService.exportData()

// 导入数据
await indexDBService.importData(data)

// 重置数据
await indexDBService.resetData()
```

## 🐛 故障排除

### 常见问题

#### 初始化失败
```typescript
// 检查浏览器支持
if (!window.indexedDB) {
  console.error('浏览器不支持IndexDB')
}

// 清除数据库后重试
await indexDBService.deleteDB()
await indexDBService.initDB()
```

#### 数据丢失
```typescript
// 检查数据是否存在
const novel = await indexDBService.getNovelById(id)
if (!novel) {
  console.log('小说不存在')
}

// 从备份恢复
await indexDBService.importData(backupData)
```

#### 性能问题
```typescript
// 使用索引查询
const novels = await indexDBService.searchNovels({ genre: 'fantasy' })

// 分页查询大数据集
const { novels, totalCount } = await indexDBService.getNovelsPaginated({
  page: 1,
  pageSize: 50
})
```

## 📊 监控和调试

### 开发者工具
```typescript
// 启用调试模式
const indexDBService = new IndexDBService({ debug: true })

// 查看数据库状态
await indexDBService.getDBInfo()
```

### 性能监控
```typescript
// 监控操作性能
const startTime = performance.now()
await indexDBService.addNovel(novel)
const endTime = performance.now()
console.log(`添加小说耗时: ${endTime - startTime}ms`)
```

## 🎯 最佳实践

### 数据设计
1. **合理分表**：根据业务逻辑合理划分数据表
2. **索引优化**：为常用查询字段创建索引
3. **字段规范**：统一字段命名和类型规范

### 操作优化
1. **批量操作**：尽量使用批量操作提高性能
2. **事务管理**：相关操作使用事务保证一致性
3. **错误处理**：完善的错误处理机制

### 用户体验
1. **加载状态**：提供清晰的加载状态提示
2. **缓存机制**：合理使用缓存提高响应速度
3. **离线支持**：确保离线状态下基本功能可用

## 🔮 未来规划

### 功能增强
- [ ] 更智能的数据同步机制
- [ ] 数据版本控制和回滚
- [ ] 更丰富的查询和分析功能

### 性能优化
- [ ] 更高效的索引策略
- [ ] 更智能的缓存机制
- [ ] 更好的内存管理

### 用户体验
- [ ] 更直观的数据管理界面
- [ ] 更详细的统计数据展示
- [ ] 更完善的备份恢复功能