@echo off
REM 部署脚本 - Windows
setlocal enabledelayedexpansion

echo 🚀 开始部署 AI 智能小说创作平台...

REM 1. 安装依赖
echo 📦 安装依赖...
call pnpm install
if !errorlevel! neq 0 (
    echo ❌ 依赖安装失败！
    exit /b 1
)

REM 2. 构建packages
echo 🔨 构建 packages...
call pnpm run build:packages
if !errorlevel! neq 0 (
    echo ❌ packages 构建失败！
    exit /b 1
)

REM 3. 构建应用
echo 🏗️  构建应用...
call pnpm vite build
if !errorlevel! neq 0 (
    echo ❌ 应用构建失败！
    exit /b 1
)

REM 4. 检查构建结果
if exist dist (
    echo ✅ 构建成功！dist 目录已生成
    dir dist
) else (
    echo ❌ 构建失败！dist 目录不存在
    exit /b 1
)

echo 🎉 构建完成！可以部署 dist 目录到静态服务器
echo.
echo 📝 部署选项：
echo 1. 静态服务器: 将 dist 目录上传到服务器
echo 2. Docker: docker build -t ai-novel-platform .
echo 3. 本地预览: pnpm run preview

pause