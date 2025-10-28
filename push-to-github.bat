@echo off
echo 正在推送代码到GitHub仓库...
echo.

echo 正在检查当前Git状态...
git status
echo.

echo 正在推送所有更改到GitHub...
git push origin main

if %errorlevel% == 0 (
    echo.
    echo 代码已成功推送到GitHub仓库！
    echo 仓库地址：https://github.com/chndaily/MuMo-AI-Writer
) else (
    echo.
    echo 推送失败，请检查网络连接或GitHub访问权限。
    echo 错误代码：%errorlevel%
)

echo.
echo 按任意键退出...
pause >nul