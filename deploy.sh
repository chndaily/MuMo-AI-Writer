#!/bin/bash

# 部署脚本 - Linux/macOS
set -e

echo "🚀 开始部署 AI 智能小说创作平台..."

# 1. 安装依赖
echo "📦 安装依赖..."
pnpm install

# 2. 构建packages
echo "🔨 构建 packages..."
pnpm run build:packages

# 3. 构建应用
echo "🏗️  构建应用..."
pnpm run build

# 4. 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！dist 目录已生成"
    echo "📊 构建统计："
    du -sh dist/*
else
    echo "❌ 构建失败！dist 目录不存在"
    exit 1
fi

echo "🎉 构建完成！可以部署 dist 目录到静态服务器"
echo ""
echo "📝 部署选项："
echo "1. 静态服务器: 将 dist 目录上传到服务器"
echo "2. Docker: docker build -t ai-novel-platform ."
echo "3. 本地预览: pnpm run preview"