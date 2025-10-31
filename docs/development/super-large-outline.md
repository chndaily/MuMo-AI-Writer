# 超长大纲处理开发文档

## 概述

本文档详细说明了系统中处理超长大纲（超过30000字）的实现机制和相关组件。

## 设计理念

当小说大纲超过30000字时，系统需要采用特殊处理机制以确保性能和用户体验：
1. 自动识别超长大纲
2. 分层管理和摘要显示
3. AI交互时使用摘要而非完整内容
4. 提供分页浏览完整内容功能

## 核心组件

### 1. SuperLargeOutlineHandler 工具类

位置：`src/utils/superLargeOutlineHandler.ts`

主要功能：
- `isSuperLargeOutline`: 判断是否为超长大纲
- `getSuperLargeOutlineStructureSummary`: 生成超长大纲结构摘要
- `getSuperLargeOutlineByPage`: 分页获取超长大纲内容
- `getSuperLargeActDetails`: 获取指定卷的详细信息
- `getSuperLargeChapterDetails`: 获取指定章节的详细信息
- `generateSuperLargeOutlineHierarchySummary`: 生成超长大纲层级摘要

### 2. LargeOutlineManager 组件

位置：`src/components/novel/LargeOutlineManager.tsx`

功能：
- 检测大纲类型（普通/长大纲/超长大纲）
- 显示相应的大纲管理界面
- 提供分页浏览功能
- 显示结构摘要

### 3. AI服务增强

位置：`src/services/aiService.ts`

增强功能：
- 在大纲生成时识别超长大纲并调整maxLength参数
- 为超长大纲提供特殊的处理提示

### 4. AI大纲服务增强

位置：`src/services/aiOutlineService.ts`

增强功能：
- 在大纲生成和优化时识别超长大纲
- 调整优化策略和摘要生成算法

### 5. 导出服务增强

位置：`src/services/exportService.ts`

增强功能：
- 在导出时识别超长大纲
- 采用特殊的摘要导出格式

### 6. AI工作区增强

位置：`src/pages/AINovelWorkspace/AINovelWorkspace.tsx`

增强功能：
- 在构建AI上下文时识别超长大纲
- 使用超长大纲摘要而非完整内容

## 判断逻辑

### 超长大纲判断标准

```typescript
export function isSuperLargeOutline(wordCount: number): boolean {
  return wordCount > 30000; // 超过30000字认为是超长大纲
}
```

### 处理流程

1. 系统检测大纲字数
2. 超过30000字时启用超长大纲模式
3. 自动生成层级摘要
4. AI交互时使用摘要而非完整内容
5. 提供分页浏览完整内容功能

## API接口

### 工具函数接口

```typescript
// 检查是否为超长大纲
isSuperLargeOutline(wordCount: number): boolean

// 获取超长大纲结构摘要
getSuperLargeOutlineStructureSummary(novelId: string): Promise<string>

// 分页获取超长大纲内容
getSuperLargeOutlineByPage(novelId: string, page: number, pageSize?: number): Promise<{
  content: string;
  totalPages: number;
  currentPage: number;
  totalItems: number;
}>

// 获取指定卷的详细信息
getSuperLargeActDetails(novelId: string, actId: string): Promise<string>

// 获取指定章节的详细信息
getSuperLargeChapterDetails(novelId: string, chapterId: string): Promise<string>

// 生成超长大纲层级摘要
generateSuperLargeOutlineHierarchySummary(novelId: string): Promise<string>
```

## 性能优化

### 内存管理
- 分页加载大纲内容，避免一次性加载全部数据
- 使用摘要代替完整内容进行AI交互

### 响应速度
- 预计算大纲字数和结构信息
- 缓存常用摘要信息

## 测试要点

### 功能测试
1. 超长大纲自动识别功能
2. 摘要生成准确性
3. 分页浏览功能
4. AI交互时的上下文处理

### 性能测试
1. 大纲加载速度
2. 摘要生成时间
3. AI响应时间

## 相关文档

- [用户使用指南](../SYSTEM_USAGE_GUIDE.md)
- [超长大纲处理指南](../superLargeOutlineHandling.md)