// 测试API端点
const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

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
let client;

// 添加环境变量用于配置真实MongoDB连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';

// 连接MongoDB
async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MONGODB_URI:', MONGODB_URI ? 'Provided' : 'Not provided');
    
    // 直接连接真实的MongoDB数据库
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(); // 使用连接字符串中指定的数据库
    console.log('Connected to real MongoDB database');
  } catch (error) {
    console.error('Failed to connect to real MongoDB database:', error);
  }
}

// 连接数据库
connectToDatabase();

// 健康检查端点
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: db ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// 测试数据库连接端点
app.get('/db-test', async (req, res) => {
  if (!db) {
    return res.status(500).json({ 
      status: 'error',
      message: 'Database not connected',
      mongodbUri: MONGODB_URI ? 'Provided' : 'Not provided'
    });
  }
  
  try {
    // 测试数据库连接
    const collections = await db.listCollections().toArray();
    res.json({ 
      status: 'success',
      message: 'Database connection successful',
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      mongodbUri: MONGODB_URI ? 'Provided' : 'Not provided'
    });
  }
});

// 获取所有集合
app.get('/collections', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  
  try {
    const collections = await db.listCollections().toArray();
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 测试认证端点
app.post('/auth-test', async (req, res) => {
  if (!db) {
    return res.status(500).json({ 
      status: 'error',
      message: 'Database not connected'
    });
  }
  
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        status: 'error',
        message: '用户不存在'
      });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        status: 'error',
        message: '密码错误'
      });
    }
    
    res.json({ 
      status: 'success',
      message: '认证成功',
      user: {
        id: user._id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message
    });
  }
});

module.exports = app;
