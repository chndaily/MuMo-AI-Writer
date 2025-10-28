// 健康检查API端点
const express = require('express');
const serverless = require('serverless-http');

const app = express();

// 添加CORS中间件
const cors = require('cors');
app.use(cors({
  origin: '*',
  credentials: true
}));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'API service is running normally'
  });
});

// 登录端点（测试405错误）
app.post('/api/auth/login', (req, res) => {
  res.json({ 
    success: true,
    message: 'Login endpoint is working'
  });
});

// 导出为Vercel Serverless Function
module.exports = app;
module.exports.handler = serverless(app);