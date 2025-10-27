# 数据库服务模块

这个模块提供了完整的IndexedDB数据库管理功能，包括小说、章节、类型、标签、大纲、角色和统计信息的存储管理。

## 主要功能

### DatabaseManager 数据库管理器

数据库管理器是整个系统的核心，负责：
- 数据库的初始化和连接管理
- 所有存储模块的统一管理
- 数据的导入导出
- 数据库状态监控

#### 基本使用

```typescript
import { databaseManager, initializeDatabase } from '@/services'

// 完整初始化数据库（包括默认数据）
await initializeDatabase()

// 或者分步初始化
await databaseManager.initializeDatabase()
await databaseManager.initializeDefaultData()

// 检查数据库状态
const status = await databaseManager.getDatabaseStatus()
console.log('数据库状态:', status)

// 获取小说列表
const novels = await databaseManager.novels.getAllNovels()

// 添加新小说
await databaseManager.novels.addNovel({
  title: '我的新小说',
  content: '小说内容...',
  genre: 'fantasy',
  wordCount: 0,
  progress: 0,
  lastModified: new Date().toISOString(),
  status: 'draft',
  createdAt: new Date().toISOString()
})
```

#### 数据库管理方法

```typescript
// 检查数据库是否存在
const exists = await databaseManager.checkDatabaseExists()

// 获取数据库版本
const version = await databaseManager.getDatabaseVersion()

// 重置数据库（删除所有数据并重新初始化）
await databaseManager.resetDatabase()

// 关闭数据库连接
databaseManager.closeDatabase()
```

### 存储模块

#### NovelStore 小说存储
```typescript
// 获取所有小说
const novels = await databaseManager.novels.getAllNovels()

// 根据ID获取小说
const novel = await databaseManager.novels.getNovelById('novel-1')

// 添加小说
await databaseManager.novels.addNovel(novelData)

// 更新小说
await databaseManager.novels.updateNovel('novel-1', updates)

// 删除小说
await databaseManager.novels.deleteNovel('novel-1')
```

#### ChapterStore 章节存储
```typescript
// 获取小说的所有章节
const chapters = await databaseManager.chapters.getChaptersByNovelId('novel-1')

// 添加章节
await databaseManager.chapters.addChapter(chapterData)

// 更新章节
await databaseManager.chapters.updateChapter('chapter-1', updates)
```

#### GenreStore 类型存储
```typescript
// 获取所有类型
const genres = await databaseManager.genres.getAllGenres()

// 添加类型
await databaseManager.genres.addGenre({
  name: 'new-genre',
  displayName: '新类型',
  description: '类型描述',
  color: '#FF0000',
  icon: 'star',
  isActive: true
})
```

#### TagStore 标签存储
```typescript
// 获取所有标签
const tags = await databaseManager.tags.getAllTags()

// 添加标签
await databaseManager.tags.addTag({
  name: '新标签',
  color: '#00FF00',
  usageCount: 0
})
```

## 默认数据

系统会自动初始化以下默认数据：

### 默认类型
- 玄幻 (fantasy)
- 都市 (urban)
- 历史 (historical)
- 科幻 (scifi)
- 武侠 (martial)
- 言情 (romance)

### 默认标签
- 热血、搞笑、悬疑、温馨、励志、治愈

### 示例小说
- 包含一个示例小说、章节、大纲和角色

## 数据导入导出

```typescript
// 导出所有数据
const data = await databaseManager.exportData()

// 导入数据
await databaseManager.importData(data)
```

## 错误处理

所有方法都包含适当的错误处理，建议使用try-catch包装：

```typescript
try {
  await databaseManager.fullInitialize()
  console.log('数据库初始化成功')
} catch (error) {
  console.error('数据库初始化失败:', error)
  // 处理错误
}
```

## 注意事项

1. 在使用任何存储方法之前，确保数据库已经初始化
2. 数据库操作是异步的，需要使用await或Promise处理
3. 在应用关闭时，建议调用`closeDatabase()`关闭连接
4. 默认数据只在数据库为空时初始化，不会重复添加 