@echo off
setlocal enabledelayedexpansion

echo ================================
echo 木墨文坊 Gitee 部署脚本
echo ================================

echo 正在检查 Git 状态...
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：当前目录不是 Git 仓库
    pause
    exit /b 1
)

echo 正在拉取最新代码...
git pull gitee main
if %errorlevel% neq 0 (
    echo 警告：无法拉取最新代码，将继续部署过程
)

echo 正在构建项目...
pnpm build
if %errorlevel% neq 0 (
    echo 错误：构建失败，请检查错误信息
    pause
    exit /b %errorlevel%
)

echo 正在添加文件到 Git...
git add .

echo 正在检查是否有更改需要提交...
git diff-index --quiet HEAD --
if %errorlevel% neq 0 (
    echo 正在提交更改...
    git commit -m "Auto deploy: %date% %time%"
) else (
    echo 没有更改需要提交
)

echo 正在推送到 Gitee...
git push gitee main
if %errorlevel% neq 0 (
    echo 错误：推送失败，请检查错误信息
    pause
    exit /b %errorlevel%
)

echo ================================
echo 部署完成！
echo 请访问 Gitee 仓库页面，在 Pages 服务中点击"重新部署"按钮
echo ================================
pause