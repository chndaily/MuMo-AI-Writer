@echo off
setlocal enabledelayedexpansion

echo ================================
echo 木墨文坊 部署脚本
echo ================================

echo 请选择部署方式：
echo 1. Gitee Pages 部署（需要 Gitee Pages 服务）
echo 2. GitHub Pages 部署（推荐的替代方案）
echo 3. 本地构建（构建完成后手动上传到其他平台）
echo 4. 查看部署说明文档
echo.
choice /c 1234 /m "请选择部署方式"

if %errorlevel% equ 4 (
    echo 正在打开部署说明文档...
    start DEPLOYMENT.md
    pause
    exit /b
)

if %errorlevel% equ 3 (
    echo 正在构建项目...
    pnpm build
    if %errorlevel% neq 0 (
        echo 错误：构建失败，请检查错误信息
        pause
        exit /b %errorlevel%
    )
    echo.
    echo 构建完成！文件位于 dist 目录中
    echo 您可以将这些文件上传到任何支持静态文件托管的服务
    echo 请查看 DEPLOYMENT.md 获取更多部署选项
    pause
    exit /b
)

if %errorlevel% equ 2 (
    echo 正在检查 Git 状态...
    git status --porcelain >nul 2>&1
    if %errorlevel% neq 0 (
        echo 错误：当前目录不是 Git 仓库
        pause
        exit /b 1
    )

    echo 正在拉取最新代码...
    git pull origin main
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

    echo 正在推送到 GitHub...
    git push origin main
    if %errorlevel% neq 0 (
        echo 错误：推送失败，请检查错误信息
        pause
        exit /b %errorlevel%
    )

    echo ================================
    echo 部署完成！
    echo.
    echo 请访问 GitHub 仓库页面，在 Settings > Pages 中启用和配置 GitHub Pages
    echo 如果尚未创建 GitHub Actions 工作流，请查看 DEPLOYMENT.md 获取详细说明
    echo ================================
    pause
    exit /b
)

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
echo.
echo 请访问 Gitee 仓库页面，检查是否有 Pages 服务
echo 如果找不到 Pages 服务，请查看 DEPLOYMENT.md 获取其他部署选项
echo 常见原因：
echo   1. 您的 Gitee 账户等级不支持 Pages 服务
echo   2. Pages 服务仅对部分用户开放
echo   3. 仓库设置问题
echo ================================
pause