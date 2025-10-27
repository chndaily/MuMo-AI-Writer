# 项目清理指南

## 概述
本指南列出了在项目稳定运行后可以安全删除的调试、测试和临时文件。这些文件主要用于开发和调试阶段，项目稳定后可以删除：

## 可以安全删除的文件分类

### 1. 调试脚本文件 (.js, .mjs, .cjs)
这些文件主要用于调试特定功能模块，项目稳定后可以删除：

- act-chapter-debug.js
- additional-key-points-analysis.mjs
- analyze-culture-interaction-parsing.js
- check-actual-content.js
- check-actual-data.js
- check-all-sync.js
- check-all-sync.mjs
- check-db-data.js
- check-indexeddb.js
- check-location-data-browser.js
- check-location-data-db.js
- check-location-data.js
- check-location-sync.mjs
- check-novels.js
- checkAIModels.cjs
- checkCultureInteraction.cjs
- checkModelPresets.cjs
- cleanup-ai-models.cjs
- clear-indexeddb.js
- clearDatabase.js
- clearLocalStorage.cjs
- comprehensive-debug.js
- create-test-data.js
- create-test-novel.js
- culture-interaction-fix-plan.cjs
- db-debug.js
- debug-character-storage.js
- debug-character-sync-detailed.cjs
- debug-character-sync.cjs
- debug-db.js
- debug-location-parsing-detailed.js
- debug-location-parsing.js
- debug-location-split.js
- debug-locations.js
- debug-outlines.js
- debug-sync-failure.cjs
- debugCultureSync.cjs
- debugCultureSyncWithRealData.cjs
- detailed-debug.js
- final-culture-interaction-fix.cjs
- final-culture-interaction-validation.js
- final-location-fix.mjs
- final-test-fix.js
- fix-culture-interaction-sync.cjs
- fix-location-fields.mjs
- fix-location-sync.js
- fix-location-sync.mjs
- fix-outline-sync.ts
- fixed-parseLocationContent.ts
- full-analysis.js
- full-debug.js
- hierarchy-debug.js
- indexeddb-inspect.js
- indexeddb-version-check.js
- localstorage-debug.js
- manageAIModels.cjs
- parent-debug.js
- precise-cleanup-ai-models.cjs
- prompt-optimization-summary.mjs
- simple-debug.cjs
- simple-test-description.js
- test-ai-models.cjs
- test-model-addition.cjs
- test-model-debug.html
- test-writing-records.mjs
- update-flow-debug.js
- verify-character-parser.cjs
- verify-culture-interaction-fix.cjs
- verify-current-implementation.js
- verify-current-implementation.mjs
- verify-fix.cjs
- verify-implementation.js
- verify-implementation.ts

### 2. scripts目录中的测试脚本
这些脚本主要用于测试AI模型功能：

- scripts/list-ai-models.cjs
- scripts/set-default-model.cjs
- scripts/setup.js
- scripts/test-ai-provider-factory.cjs
- scripts/test-api.cjs
- scripts/test-create-provider.cjs
- scripts/test-default-api.cjs
- scripts/test-full-flow.cjs
- scripts/test-generate-text.cjs
- scripts/test-get-provider.cjs

### 3. reference目录中的参考文件
这些是开发过程中的参考文件：

- reference/data.json
- reference/prompt.json
- reference/替换/重写-填加内心对话.json
- reference/替换/重写-填加内心对话.txt
- reference/chats/一般对话.json
- reference/chats/一般对话.txt
- reference/chats/嵌套写作.json
- reference/chats/生成内容.json
- reference/chats/生成内容.txt
- reference/chats/继续写作.json
- reference/chats/继续写作.txt

### 4. sql目录中的数据库脚本
- sql/db.sql

### 5. images目录中的图片文件
这些图片文件可能是调试或文档用途：

- images/ai 生成预设编辑.png
- images/image.png
- images/小说创建.png
- images/文本选中.png
- images/样式图片.png
- images/生成.png
- images/生成完成.png

### 6. 部署和构建脚本
这些脚本在开发环境中使用，生产环境可能不需要：

- deploy.bat
- deploy.sh
- install-deps.bat
- reset-novels.ps1

### 7. 配置和补丁文件
- location-sync-fix.patch

### 8. 图片文件
- ai生成时的样子.png

### 9. HTML测试文件
- fix-duplicate-data.html

### 10. 空文件或未完成的文件
- query (空文件)

## 应该保留的文件

### 1. 核心配置文件
- package.json
- pnpm-lock.yaml
- tsconfig.json
- tsconfig.node.json
- vite.config.ts
- tailwind.config.js
- jest.config.js

### 2. 环境配置
- .env.example
- .env.production
- .env.server

### 3. Docker相关
- Dockerfile
- docker-compose.yml
- .dockerignore

### 4. 版本控制
- .gitignore

### 5. 代码格式化
- .prettierignore
- .prettierrc

### 6. 文档
- README.md
- PROJECT_COMPLETION_REPORT.md
- docs/ 目录下的文档

### 7. 源代码
- src/ 目录
- types/ 目录

### 8. 数据库
- mongodb-data/ 目录（如果需要保留本地数据）
- supabase-table-setup.sql

### 9. 其他重要文件
- server.cjs（服务器启动文件）
- index.html（入口HTML文件）
- nginx.conf（如果使用Nginx）

## 清理建议

1. **备份重要数据**：在删除任何文件之前，请确保已备份重要数据。

2. **分批删除**：建议按类别分批删除文件，每次删除后测试系统功能。

3. **版本控制**：确保所有更改都已提交到版本控制系统。

4. **测试验证**：删除每批文件后，运行测试确保系统功能正常。

5. **文档更新**：更新相关文档，反映清理后的项目结构。

## 清理命令示例

在Windows系统中，可以使用以下命令删除调试脚本文件：

```cmd
cd E:\NovelSystem\mumo-ai-writer
del *-debug.js
del *-debug.mjs
del *-debug.cjs
del check-*.js
del check-*.mjs
del check-*.cjs
del debug-*.js
del debug-*.mjs
del debug-*.cjs
del verify-*.js
del verify-*.mjs
del verify-*.cjs
del test-*.js
del test-*.mjs
del test-*.cjs
del fix-*.js
del fix-*.mjs
del fix-*.cjs
del create-test-*.js
del *-test-*.js

# 删除scripts目录中的测试文件
del scripts\*.cjs
del scripts\*.js

# 删除reference目录中的参考文件
rd /s /q reference

# 删除sql目录中的文件
del sql\*.sql

# 删除images目录中的图片文件
del images\*.png

# 删除空文件
del query

# 删除ai生成时的样子.png
del ai生成时的样子.png

# 删除HTML测试文件
del fix-duplicate-data.html
```

在Linux/Mac系统中，可以使用以下命令：

```bash
cd /path/to/mumo-ai-writer
rm *-debug.js *-debug.mjs *-debug.cjs
rm check-*.js check-*.mjs check-*.cjs
rm debug-*.js debug-*.mjs debug-*.cjs
rm verify-*.js verify-*.mjs verify-*.cjs
rm test-*.js test-*.mjs test-*.cjs
rm fix-*.js fix-*.mjs fix-*.cjs
rm create-test-*.js *-test-*.js
rm scripts/*.cjs scripts/*.js
rm -rf reference
rm sql/*.sql
rm images/*.png
rm query
rm "ai生成时的样子.png"
rm fix-duplicate-data.html
```

## 注意事项

1. 删除前请确认这些文件确实不再需要。
2. 如果项目仍在开发中，建议先将这些文件移至备份目录而不是直接删除。
3. 某些文件可能被其他脚本引用，删除前请检查依赖关系。
4. 清理后建议运行完整的测试套件确保系统功能正常。
5. 如果使用了reference目录中的文件作为系统提示词或示例，删除前请确认系统中已有相应的替代方案。
6. images目录中的图片如果用于应用程序界面，请确认是否有替代方案或是否需要保留。