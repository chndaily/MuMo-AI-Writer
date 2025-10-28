// Vercel Serverless Function入口文件
const express = require('express');
const serverless = require('serverless-http');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();

// 添加body parser限制
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 添加CORS中间件
const cors = require('cors');
app.use(cors({
  origin: '*',
  credentials: true
}));

// MongoDB连接配置
let db;

// 添加环境变量用于配置真实MongoDB连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';

// 支付配置（从环境变量获取）
const PAYMENT_CONFIG = {
  // 微信支付配置
  wechat: {
    appid: process.env.WECHAT_APPID || 'your-wechat-appid',
    mchid: process.env.WECHAT_MCHID || 'your-wechat-mchid',
  },
  // 支付宝配置
  alipay: {
    appId: process.env.ALIPAY_APP_ID || 'your-alipay-app-id',
  }
};

// 模拟支付处理函数
const processPayment = (paymentMethod, amount, orderId) => {
  // 模拟支付处理，实际应用中这里会调用真实的支付SDK
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        orderId,
        // 根据支付方式返回相应的支付信息
        ...(paymentMethod === 'wechat' 
          ? { code_url: `weixin://dl/business/?ticket=${orderId}` }
          : { qr_code: `alipayqr://platformapi/startapp?saId=10000007&qrcode=https%3A%2F%2Fqr.alipay.com%2F${orderId}` }
        )
      });
    }, 1000);
  });
};

// 连接MongoDB
async function connectToDatabase() {
  try {
    // 直接连接真实的MongoDB数据库，不使用内存数据库回退机制
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(); // 使用连接字符串中指定的数据库
    console.log('Connected to real MongoDB database');
    
    // 创建必要的索引
    await createIndexes();
    
    // 初始化管理员账户
    await initializeAdminUser();
  } catch (error) {
    console.error('Failed to connect to real MongoDB database:', error);
    // 在Vercel环境中，我们不退出进程，而是继续运行
  }
}

// 创建必要的数据库索引
async function createIndexes() {
  if (!db) return;
  
  try {
    // 为角色集合创建索引
    await db.collection('characters').createIndex({ novelId: 1 });
    
    // 为地点集合创建索引
    await db.collection('locations').createIndex({ novelId: 1 });
    
    // 为大纲集合创建索引
    await db.collection('outlines').createIndex({ novelId: 1 });
    
    // 为小说集合创建索引
    await db.collection('novels').createIndex({ author: 1 });
    await db.collection('novels').createIndex({ userId: 1 });
    
    // 为用户集合创建索引
    await db.collection('users').createIndex({ email: 1 });
    await db.collection('users').createIndex({ username: 1 });
    
    // 为章节集合创建索引
    await db.collection('chapters').createIndex({ novelId: 1 });
    
    // 为世界观设定集合创建索引
    await db.collection('worldSettings').createIndex({ novelId: 1 });
    await db.collection('worldSettings').createIndex({ type: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Failed to create database indexes:', error);
  }
}

// 初始化管理员账户
async function initializeAdminUser() {
  if (!db) return;
  
  try {
    // 检查是否已存在管理员账户
    // 修复：正确使用MongoDB查询方法
    const adminUser = await db.collection('users').findOne({ username: 'admin' });
    
    if (!adminUser) {
      // 动态导入bcrypt来加密密码
      const bcrypt = await import('bcrypt');
      const saltRounds = 10;
      const passwordHash = await bcrypt.default.hash('admin123', saltRounds);
      
      // 创建默认管理员账户
      const adminUserData = {
        _id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        email: 'admin@example.com',
        username: 'admin',
        passwordHash: passwordHash,
        createdAt: new Date(),
        lastLoginAt: null,
        membershipInfo: {
          level: 'PROFESSIONAL',
          expiryDate: null,
          maxNovels: Infinity,
          aiGenerationLimit: Infinity,
          aiGenerationUsed: 0,
          features: [
            'novel_creation',
            'basic_editing',
            'txt_export',
            'markdown_export',
            'unlimited_novels',
            'unlimited_ai_generation',
            'visualization_tools',
            'advanced_export',
            'full_cloud_sync',
            'priority_support',
            'early_access',
            'team_collaboration'
          ],
          teamEnabled: true,
          maxTeamMembers: 10,
          isAdmin: true,
          username: 'admin',
          email: 'admin@example.com'
        }
      };
      
      await db.collection('users').insertOne(adminUserData);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
  }
}

// 连接数据库
connectToDatabase();

// 导入bcrypt用于密码验证
let bcrypt;
import('bcrypt').then(bcryptModule => {
  bcrypt = bcryptModule.default;
}).catch(error => {
  console.error('Failed to import bcrypt:', error);
});

// 用户认证路由
// 用户登录
app.post('/api/auth/login', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not connected' });
  }
  
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    // 验证密码
    if (!bcrypt) {
      return res.status(500).json({ success: false, message: 'Bcrypt not available' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }
    
    // 更新最后登录时间
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );
    
    // 返回用户信息（不包含密码哈希）
    const { passwordHash, ...userWithoutPassword } = user;
    
    // 生成简单token（实际应用中应使用JWT）
    const token = btoa(`${user._id}:${Date.now()}`);
    
    res.json({
      success: true,
      user: userWithoutPassword,
      message: '登录成功',
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not connected' });
  }
  
  try {
    const { email, username, password } = req.body;
    
    // 检查邮箱是否已存在
    const existingUser = await db.collection('users').findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: '该邮箱已被注册' });
    }
    
    // 导入bcrypt
    if (!bcrypt) {
      return res.status(500).json({ success: false, message: 'Bcrypt not available' });
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建新用户（默认为免费会员）
    const newUser = {
      _id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      email,
      username,
      passwordHash,
      createdAt: new Date(),
      lastLoginAt: null,
      membershipInfo: {
        level: 'FREE',
        expiryDate: null,
        maxNovels: 3,
        aiGenerationLimit: 10,
        aiGenerationUsed: 0,
        features: [
          'novel_creation',
          'basic_editing',
          'txt_export',
          'markdown_export'
        ],
        teamEnabled: false,
        maxTeamMembers: 0,
        isAdmin: false,
        username: username,
        email: email
      }
    };
    
    await db.collection('users').insertOne(newUser);
    
    // 返回用户信息（不包含密码哈希）
    const { passwordHash: removedPasswordHash, ...userWithoutPassword } = newUser;
    
    // 生成简单token
    const token = btoa(`${newUser._id}:${Date.now()}`);
    
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      message: '注册成功',
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

// 验证用户token
app.post('/api/auth/verify-token', async (req, res) => {
  if (!db) {
    return res.status(500).json({ success: false, message: 'Database not connected' });
  }
  
  try {
    const { token } = req.body;
    
    // 解析token
    const decoded = atob(token);
    const [userId] = decoded.split(':');
    
    // 查找用户
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return res.status(401).json({ success: false, message: '认证失败' });
    }
    
    // 返回用户信息（不包含密码哈希）
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      message: '认证成功'
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ success: false, message: '认证失败' });
  }
});

// 用户API路由
app.get('/api/users', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  
  try {
    // 修复：正确使用MongoDB查询方法
    const usersCursor = await db.collection('users').find({});
    const users = await usersCursor.toArray();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  
  try {
    const user = await db.collection('users').findOne({ _id: req.params.id });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 小说API路由
app.get('/api/novels', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  
  try {
    // 修复：正确使用MongoDB查询方法
    const novelsCursor = await db.collection('novels').find({});
    const novels = await novelsCursor.toArray();
    res.json(novels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/novels/:id', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  
  try {
    const novel = await db.collection('novels').findOne({ _id: req.params.id });
    if (novel) {
      res.json(novel);
    } else {
      res.status(404).json({ error: 'Novel not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: db ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// 导出为Vercel Serverless Function
module.exports = app;
module.exports.handler = serverless(app);