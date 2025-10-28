# Vercel部署调试检查清单

## 1. 部署状态检查

### GitHub仓库状态
- [x] 代码已推送到GitHub
- [x] 最新提交包含Vercel配置修复
- [ ] Vercel是否已检测到新的提交

### Vercel项目配置
- [ ] 项目是否正确链接到GitHub仓库
- [ ] 是否启用了自动部署
- [ ] 构建设置是否正确配置

## 2. 配置文件检查

### vercel.json 配置
```json
{
  "version": 2,
  "routes": [
    // 特定API路由在前
    {
      "src": "/api/health",
      "dest": "/api/health.js"
    },
    {
      "src": "/api/test",
      "dest": "/api/test.js"
    },
    // 具体API路由
    {
      "src": "/api/auth/login",
      "dest": "/api/index.js"
    },
    // ... 其他具体路由
    // 通配符路由在后
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    // 静态资源
    {
      "src": "/assets/.*\\.js$",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "application/javascript"
      }
    },
    {
      "src": "/assets/.*\\.css$",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "text/css"
      }
    },
    // 默认路由
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "buildCommand": "pnpm build:vercel",
  "installCommand": "pnpm install",
  "outputDirectory": "dist",
  "functions": {
    "api/*.js": {
      "runtime": "@vercel/node@3.0.7"
    }
  }
}
```

### 环境变量检查
- [ ] MONGODB_URI是否已正确配置
- [ ] VITE_API_BASE_URL是否已正确配置
- [ ] 数据库连接字符串格式是否正确
- [ ] API基础URL是否包含协议前缀

## 3. 代码检查

### API路由实现
- [x] /api/auth/login POST路由已实现
- [x] /api/auth/register POST路由已实现
- [x] /api/auth/verify-token POST路由已实现
- [x] 所有GET路由已实现

### 数据库连接
- [x] MongoDB连接逻辑已实现
- [x] 管理员用户初始化逻辑已实现
- [x] 数据库查询方法已修复

## 4. 常见问题排查

### 405错误可能原因
1. **路由顺序问题** - 已修复，具体路由在通配符路由之前
2. **HTTP方法不匹配** - 确认前端发送POST请求，后端实现POST处理器
3. **CORS配置问题** - 已在API中配置CORS中间件
4. **函数运行时问题** - 已配置正确的Node.js运行时版本

### 部署失败可能原因
1. **构建错误** - 检查Vercel构建日志
2. **依赖安装问题** - 确认pnpm-lock.yaml文件正确
3. **环境变量缺失** - 确认所有必需的环境变量已配置
4. **自定义域名问题** - 确认域名解析和SSL证书配置

## 5. 下一步行动

### 立即行动
1. 登录Vercel控制台检查部署状态
2. 查看最近的部署日志
3. 确认环境变量已正确配置
4. 检查自定义域名配置

### 如果部署成功但仍无法访问
1. 检查Vercel函数日志
2. 确认API端点是否正常工作
3. 检查网络连接和防火墙设置
4. 联系Vercel支持团队

## 6. 测试命令

### 手动触发部署
```bash
# 推送一个空提交来触发部署
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

### 本地测试API
```bash
# 测试健康检查端点
curl -X GET https://mumoai.vercel.app/api/health

# 测试登录端点
curl -X POST https://mumoai.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```