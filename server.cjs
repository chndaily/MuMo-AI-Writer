const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.server' });

const app = express();
const port = 3001;

// 添加body parser限制
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 添加CORS中间件
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3030', 'http://127.0.0.1:3030'],
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
    process.exit(1); // 如果无法连接到真实数据库，直接退出进程
  }
}

// 创建必要的数据库索引
async function createIndexes() {
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
  try {
    // 检查是否已存在管理员账户
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

// 添加定时任务检查过期会员
function startMembershipExpirationCheck() {
  // 每天检查一次过期会员
  setInterval(async () => {
    try {
      console.log('Checking for expired memberships...');
      
      // 获取当前时间
      const now = new Date();
      
      // 查找所有已过期但不是免费会员的用户
      const expiredUsers = await db.collection('users').find({
        'membershipInfo.expiryDate': { $lt: now },
        'membershipInfo.level': { $in: ['BASIC', 'PROFESSIONAL'] }
      }).toArray();
      
      // 为每个过期用户降级为免费会员
      for (const user of expiredUsers) {
        console.log(`Downgrading user ${user.username} from ${user.membershipInfo.level} to FREE`);
        
        // 更新用户会员信息为免费会员
        await db.collection('users').updateOne(
          { _id: user._id },
          { 
            $set: { 
              'membershipInfo.level': 'FREE',
              'membershipInfo.expiryDate': null,
              'membershipInfo.maxNovels': 3,
              'membershipInfo.aiGenerationLimit': 10,
              'membershipInfo.teamEnabled': false,
              'membershipInfo.maxTeamMembers': 0,
              'membershipInfo.features': [
                'novel_creation',
                'basic_editing',
                'basic_editing',
                'txt_export',
                'markdown_export'
              ]
            }
          }
        );
      }
      
      console.log(`Checked ${expiredUsers.length} expired memberships`);
    } catch (error) {
      console.error('Failed to check expired memberships:', error);
    }
  }, 24 * 60 * 60 * 1000); // 每24小时检查一次
}

// 添加定时任务每日重置AI生成使用次数
function startDailyAIUsageReset() {
  // 每天凌晨重置所有用户的AI生成使用次数
  setInterval(async () => {
    try {
      // 获取当前时间
      const now = new Date();
      
      // 只在凌晨0点到1点之间执行重置操作
      const hours = now.getHours();
      if (hours === 0) {
        console.log('Resetting daily AI usage for all users...');
        // 重置所有用户的AI生成使用次数
        const result = await db.collection('users').updateMany(
          {}, // 所有用户
          { 
            $set: { 
              'membershipInfo.aiGenerationUsed': 0
            }
          }
        );
        
        console.log(`Reset AI usage for ${result.modifiedCount} users`);
      }
    } catch (error) {
      console.error('Failed to reset daily AI usage:', error);
    }
  }, 60 * 60 * 1000); // 每小时检查一次
}

// 连接数据库
connectToDatabase().then(() => {
  // 数据库连接成功后启动定时任务
  startMembershipExpirationCheck();
  startDailyAIUsageReset();
});

// API路由

// JWT认证API
app.post('/api/auth/generate-token', (req, res) => {
  try {
    const { payload, secret, options } = req.body;
    
    // 动态导入jsonwebtoken
    import('jsonwebtoken').then(jwt => {
      const token = jwt.default.sign(payload, secret, options);
      res.json({ token });
    }).catch(error => {
      console.error('Failed to import jsonwebtoken:', error);
      res.status(500).json({ error: 'Failed to generate token' });
    });
  } catch (error) {
    console.error('Failed to generate token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

app.post('/api/auth/verify-token', (req, res) => {
  try {
    const { token, secret } = req.body;
    
    // 动态导入jsonwebtoken
    import('jsonwebtoken').then(jwt => {
      const payload = jwt.default.verify(token, secret);
      res.json({ payload });
    }).catch(error => {
      console.error('Failed to import jsonwebtoken:', error);
      res.status(500).json({ error: 'Failed to verify token' });
    });
  } catch (error) {
    console.error('Failed to verify token:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// 用户API路由
// 获取所有用户
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 根据ID获取用户
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ _id: req.params.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建用户
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    userData._id = userData.id || 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    userData.createdAt = new Date();
    userData.lastLoginAt = null;
    delete userData.id;
    
    const result = await db.collection('users').insertOne(userData);
    res.json({ ...userData, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新用户
app.put('/api/users/:id', async (req, res) => {
  try {
    const userData = req.body;
    delete userData.id;
    delete userData._id;
    
    // 特殊处理：确保管理员账户的权限不被修改
    if (req.params.id === 'admin') {
      // 保持管理员账户的特殊权限
      const existingUser = await db.collection('users').findOne({ _id: req.params.id });
      if (existingUser && existingUser.username === 'admin') {
        if (userData.membershipInfo) {
          userData.membershipInfo.level = 'PROFESSIONAL';
          userData.membershipInfo.isAdmin = true;
        }
      }
    }
    
    // 如果更新了用户名或邮箱，同步更新会员信息中的用户名和邮箱
    if (userData.username || userData.email) {
      const existingUser = await db.collection('users').findOne({ _id: req.params.id });
      if (existingUser && existingUser.membershipInfo) {
        if (userData.username) {
          userData['membershipInfo.username'] = userData.username;
          // 同时更新membershipInfo中的email字段（如果存在）
          if (existingUser.membershipInfo.email) {
            userData['membershipInfo.email'] = userData.email || existingUser.email || existingUser.membershipInfo.email;
          }
        }
        if (userData.email) {
          userData['membershipInfo.email'] = userData.email;
          // 同时更新membershipInfo中的username字段（如果存在）
          if (existingUser.membershipInfo.username) {
            userData['membershipInfo.username'] = userData.username || existingUser.username || existingUser.membershipInfo.username;
          }
        }
      }
    }
    
    await db.collection('users').updateOne(
      { _id: req.params.id },
      { $set: userData }
    );
    
    const updatedUser = await db.collection('users').findOne({ _id: req.params.id });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除用户
app.delete('/api/users/:id', async (req, res) => {
  try {
    // 防止删除管理员账户
    const user = await db.collection('users').findOne({ _id: req.params.id });
    if (user && user.username === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }
    
    await db.collection('users').deleteOne({ _id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    // 验证密码
    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.default.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '密码错误' 
      });
    }
    
    // 更新最后登录时间
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );
    
    // 生成 JWT token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: user._id, email: user.email, username: user.username },
      'taotao-writing-jwt-secret-key',
      { expiresIn: '24h' }
    );
    
    // 返回不包含密码哈希的用户信息
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      message: '登录成功',
      token
    });
  } catch (error) {
    console.error('Failed to login user:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    });
  }
});

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // 检查邮箱是否已存在
    const existingUserByEmail = await db.collection('users').findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ 
        success: false, 
        message: '该邮箱已被注册' 
      });
    }
    
    // 检查用户名是否已存在
    const existingUserByUsername = await db.collection('users').findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({ 
        success: false, 
        message: '该用户名已被使用' 
      });
    }
    
    // 使用bcrypt加密密码
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    const passwordHash = await bcrypt.default.hash(password, saltRounds);
    
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
    
    // 生成 JWT token
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: newUser._id, email: newUser.email, username: newUser.username },
      'taotao-writing-jwt-secret-key',
      { expiresIn: '24h' }
    );
    
    // 返回不包含密码哈希的用户信息
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      message: '注册成功',
      token
    });
  } catch (error) {
    console.error('Failed to register user:', error);
    res.status(500).json({ 
      success: false, 
      message: '注册失败，请稍后重试' 
    });
  }
});

// 获取所有小说
app.get('/api/novels', async (req, res) => {
  try {
    // 检查是否有authorId查询参数
    const authorId = req.query.authorId;
    
    let query = {};
    // 如果有authorId参数，按作者ID过滤
    if (authorId) {
      // 同时检查author和userId字段，确保兼容性
      query.$or = [
        { author: authorId },
        { userId: authorId }
      ];
    }
    
    const novels = await db.collection('novels').find(query).toArray();
    res.json(novels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取小说详情
app.get('/api/novels/:id', async (req, res) => {
  try {
    const novel = await db.collection('novels').findOne({ _id: req.params.id });
    res.json(novel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建小说
app.post('/api/novels', async (req, res) => {
  try {
    const novel = req.body;
    // 如果没有提供id，则生成一个唯一的id
    if (!novel.id) {
      novel._id = 'novel-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    } else {
      novel._id = novel.id;
    }
    delete novel.id;
    const result = await db.collection('novels').insertOne(novel);
    res.json({ ...req.body, _id: result.insertedId || novel._id });
  } catch (error) {
    console.error('Failed to create novel:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新小说
app.put('/api/novels/:id', async (req, res) => {
  try {
    const novel = req.body;
    delete novel.id;
    await db.collection('novels').updateOne(
      { _id: req.params.id },
      { $set: novel }
    );
    res.json({ ...novel, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除小说
app.delete('/api/novels/:id', async (req, res) => {
  try {
    await db.collection('novels').deleteOne({ _id: req.params.id });
    res.json({ message: 'Novel deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有角色
app.get('/api/characters', async (req, res) => {
  try {
    // 检查是否有novelId查询参数
    const novelId = req.query.novelId;
    
    let query = {};
    // 如果有novelId参数，按小说ID过滤
    if (novelId) {
      query.novelId = novelId;
    }
    
    const characters = await db.collection('characters').find(query).toArray();
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取角色详情
app.get('/api/characters/:id', async (req, res) => {
  try {
    const character = await db.collection('characters').findOne({ _id: req.params.id });
    res.json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建角色
app.post('/api/characters', async (req, res) => {
  try {
    const character = req.body;
    
    // 确保novelId字段存在
    if (!character.novelId) {
      return res.status(400).json({ error: '缺少novelId字段' });
    }
    
    // 总是生成统一格式的id，忽略前端提供的id
    const generatedId = 'character-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    character._id = generatedId;
    delete character.id;
    
    const result = await db.collection('characters').insertOne(character);
    // 确保返回实际保存到数据库中的完整角色对象，包括所有字段
    // 同时返回id和_id字段以确保前端兼容性
    const finalId = result.insertedId || character._id;
    const responseCharacter = { ...character, id: finalId, _id: finalId };
    res.json(responseCharacter);
  } catch (error) {
    console.error('Failed to create character:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新角色
app.put('/api/characters/:id', async (req, res) => {
  try {
    const character = req.body;
    delete character.id;
    // 确保所有字段都被正确更新
    await db.collection('characters').updateOne(
      { _id: req.params.id },
      { $set: character }
    );
    res.json({ ...character, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除角色
app.delete('/api/characters/:id', async (req, res) => {
  try {
    await db.collection('characters').deleteOne({ _id: req.params.id });
    res.json({ message: 'Character deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有地点
app.get('/api/locations', async (req, res) => {
  try {
    // 检查是否有novelId查询参数
    const novelId = req.query.novelId;
    
    let query = {};
    // 如果有novelId参数，按小说ID过滤
    if (novelId) {
      query.novelId = novelId;
    }
    
    const locations = await db.collection('locations').find(query).toArray();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取地点详情
app.get('/api/locations/:id', async (req, res) => {
  try {
    const location = await db.collection('locations').findOne({ _id: req.params.id });
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建地点
app.post('/api/locations', async (req, res) => {
  try {
    const location = req.body;
    // 如果没有提供id，则生成一个唯一的id
    if (!location.id) {
      location._id = 'location-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    } else {
      location._id = location.id;
    }
    delete location.id;
    await db.collection('locations').insertOne(location);
    // 确保返回完整的地点对象，包括所有字段
    res.json({ ...location, _id: location._id });
  } catch (error) {
    console.error('Failed to create location:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新地点
app.put('/api/locations/:id', async (req, res) => {
  try {
    const location = req.body;
    delete location.id;
    // 确保所有字段都被正确更新
    await db.collection('locations').updateOne(
      { _id: req.params.id },
      { $set: location }
    );
    res.json({ ...location, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除地点
app.delete('/api/locations/:id', async (req, res) => {
  try {
    await db.collection('locations').deleteOne({ _id: req.params.id });
    res.json({ message: 'Location deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有章节
app.get('/api/chapters', async (req, res) => {
  try {
    const chapters = await db.collection('chapters').find({}).toArray();
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取章节详情
app.get('/api/chapters/:id', async (req, res) => {
  try {
    const chapter = await db.collection('chapters').findOne({ _id: req.params.id });
    res.json(chapter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建章节
app.post('/api/chapters', async (req, res) => {
  try {
    const chapter = req.body;
    // 如果没有提供id，则生成一个唯一的id
    if (!chapter.id) {
      chapter._id = 'chapter-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    } else {
      chapter._id = chapter.id;
    }
    delete chapter.id;
    const result = await db.collection('chapters').insertOne(chapter);
    res.json({ ...req.body, _id: result.insertedId || chapter._id });
  } catch (error) {
    console.error('Failed to create chapter:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新章节
app.put('/api/chapters/:id', async (req, res) => {
  try {
    const chapter = req.body;
    delete chapter.id;
    await db.collection('chapters').updateOne(
      { _id: req.params.id },
      { $set: chapter }
    );
    res.json({ ...chapter, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除章节
app.delete('/api/chapters/:id', async (req, res) => {
  try {
    await db.collection('chapters').deleteOne({ _id: req.params.id });
    res.json({ message: 'Chapter deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 支付API路由

// 创建支付订单
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const paymentData = req.body;
    
    // 参数验证
    if (!paymentData.paymentMethod || !paymentData.amount) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：paymentMethod 和 amount'
      });
    }
    
    // 验证支付方式
    if (!['wechat', 'alipay'].includes(paymentData.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: '不支持的支付方式'
      });
    }
    
    // 验证金额
    if (typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: '金额必须是大于0的数字'
      });
    }
    
    // 生成订单ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 保存订单到数据库
    const order = {
      _id: orderId,
      ...paymentData,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('payment_orders').insertOne(order);
    
    // 处理支付
    const result = await processPayment(paymentData.paymentMethod, paymentData.amount, orderId);
    
    if (!result.success) {
      throw new Error('支付处理失败');
    }
    
    res.json({
      success: true,
      orderId: result.orderId,
      ...(paymentData.paymentMethod === 'wechat' 
        ? { code_url: result.code_url }
        : { qr_code: result.qr_code }
      ),
      message: '支付订单创建成功'
    });
  } catch (error) {
    console.error('Failed to create payment order:', error);
    res.status(500).json({
      success: false,
      message: '创建支付订单失败: ' + error.message
    });
  }
});

// 微信支付回调
app.post('/api/payment/wechat-callback', async (req, res) => {
  try {
    const notification = req.body;
    
    // 参数验证
    if (!notification.out_trade_no) {
      return res.status(400).json({ code: 'FAIL', message: '缺少订单号' });
    }
    
    // 更新订单状态
    const orderId = notification.out_trade_no;
    await db.collection('payment_orders').updateOne(
      { _id: orderId },
      { 
        $set: { 
          status: 'SUCCESS',
          transactionId: notification.transaction_id,
          updatedAt: new Date()
        }
      }
    );
    
    // 返回成功响应
    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('Failed to handle WeChat payment callback:', error);
    res.status(500).json({ code: 'FAIL', message: '处理失败' });
  }
});

// 支付宝回调
app.post('/api/payment/alipay-callback', async (req, res) => {
  try {
    // 参数验证
    if (!req.body.out_trade_no) {
      return res.status(400).send('fail');
    }
    
    // 更新订单状态
    const orderId = req.body.out_trade_no;
    await db.collection('payment_orders').updateOne(
      { _id: orderId },
      { 
        $set: { 
          status: req.body.trade_status === 'TRADE_SUCCESS' ? 'SUCCESS' : 'FAILED',
          transactionId: req.body.trade_no,
          updatedAt: new Date()
        }
      }
    );
    
    res.send('success');
  } catch (error) {
    console.error('Failed to handle Alipay callback:', error);
    res.status(500).send('fail');
  }
});

// 验证支付结果
app.post('/api/payment/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 参数验证
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单ID'
      });
    }
    
    // 查询订单信息
    const order = await db.collection('payment_orders').findOne({ _id: orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    res.json({
      success: true,
      status: order.status,
      message: '支付验证成功'
    });
  } catch (error) {
    console.error('Failed to verify payment:', error);
    res.status(500).json({
      success: false,
      message: '支付验证失败'
    });
  }
});

// 验证用户密码（用于修改密码时验证旧密码）
app.post('/api/auth/verify-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    // 验证密码
    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.default.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '密码错误' 
      });
    }
    
    res.json({
      success: true,
      message: '密码验证成功'
    });
  } catch (error) {
    console.error('Failed to verify password:', error);
    res.status(500).json({ 
      success: false, 
      message: '密码验证失败' 
    });
  }
});

// 修改用户密码
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    
    // 查找用户
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    // 验证旧密码
    const bcrypt = await import('bcrypt');
    const isOldPasswordValid = await bcrypt.default.compare(oldPassword, user.passwordHash);
    
    if (!isOldPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '旧密码错误' 
      });
    }
    
    // 使用bcrypt加密新密码
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.default.hash(newPassword, saltRounds);
    
    // 更新用户密码
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { passwordHash: newPasswordHash } }
    );
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Failed to change password:', error);
    res.status(500).json({ 
      success: false, 
      message: '密码修改失败' 
    });
  }
});

// 管理员修改用户密码（无需验证旧密码）
app.post('/api/auth/admin-change-password', async (req, res) => {
  try {
    const { adminEmail, targetEmail, newPassword } = req.body;
    
    // 验证管理员身份
    const adminUser = await db.collection('users').findOne({ email: adminEmail });
    
    if (!adminUser) {
      return res.status(401).json({ 
        success: false, 
        message: '管理员不存在' 
      });
    }
    
    // 检查是否为管理员账户
    if (!adminUser.membershipInfo || !adminUser.membershipInfo.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足，只有管理员可以执行此操作' 
      });
    }
    
    // 查找目标用户
    const targetUser = await db.collection('users').findOne({ email: targetEmail });
    
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: '目标用户不存在' 
      });
    }
    
    // 防止管理员修改自己的密码通过此接口（应该使用标准修改密码流程）
    if (adminUser.email === targetUser.email) {
      return res.status(400).json({ 
        success: false, 
        message: '请使用标准密码修改流程修改自己的密码' 
      });
    }
    
    // 使用bcrypt加密新密码
    const bcrypt = await import('bcrypt');
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.default.hash(newPassword, saltRounds);
    
    // 更新目标用户密码
    await db.collection('users').updateOne(
      { _id: targetUser._id },
      { $set: { passwordHash: newPasswordHash } }
    );
    
    res.json({
      success: true,
      message: '用户密码修改成功'
    });
  } catch (error) {
    console.error('Failed to change password by admin:', error);
    res.status(500).json({ 
      success: false, 
      message: '密码修改失败' 
    });
  }
});

// 处理支付回调
app.post('/api/payment/callback', async (req, res) => {
  try {
    const callbackData = req.body;
    
    // 参数验证
    if (!callbackData.orderId || !callbackData.status) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：orderId 和 status'
      });
    }
    
    // 更新订单状态
    await db.collection('payment_orders').updateOne(
      { _id: callbackData.orderId },
      { 
        $set: { 
          status: callbackData.status,
          transactionId: callbackData.transactionId,
          updatedAt: new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: '支付回调处理成功'
    });
  } catch (error) {
    console.error('Failed to handle payment callback:', error);
    res.status(500).json({
      success: false,
      message: '处理支付回调失败'
    });
  }
});

// 退款处理
app.post('/api/payment/refund/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const refundData = req.body;
    
    // 参数验证
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单ID'
      });
    }
    
    if (!refundData.amount) {
      return res.status(400).json({
        success: false,
        message: '缺少退款金额'
      });
    }
    
    // 查询订单信息
    const order = await db.collection('payment_orders').findOne({ _id: orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 更新订单状态
    await db.collection('payment_orders').updateOne(
      { _id: orderId },
      { 
        $set: { 
          status: 'REFUNDED',
          refundAmount: refundData.amount,
          updatedAt: new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: '退款处理成功'
    });
  } catch (error) {
    console.error('Failed to process refund:', error);
    res.status(500).json({
      success: false,
      message: '退款处理失败: ' + error.message
    });
  }
});

// 查询订单状态
app.get('/api/payment/query/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 参数验证
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '缺少订单ID'
      });
    }
    
    // 查询订单信息
    const order = await db.collection('payment_orders').findOne({ _id: orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    res.json({
      success: true,
      status: order.status,
      message: '订单状态查询成功'
    });
  } catch (error) {
    console.error('Failed to query order status:', error);
    res.status(500).json({
      success: false,
      message: '订单状态查询失败'
    });
  }
});

// 获取所有AI模型
app.get('/api/ai-models', async (req, res) => {
  try {
    // 检查是否查询默认模型
    const isDefault = req.query.isDefault === 'true';
    
    let models;
    if (isDefault) {
      // 获取默认AI模型
      models = await db.collection('aiModels').find({ isDefault: true }).toArray();
    } else {
      // 获取所有AI模型
      models = await db.collection('aiModels').find({}).toArray();
    }
    
    res.json(models);
  } catch (error) {
    console.error('Failed to get AI models:', error);
    res.status(500).json({ error: error.message });
  }
});

// 根据ID获取AI模型
app.get('/api/ai-models/:id', async (req, res) => {
  try {
    const model = await db.collection('aiModels').findOne({ _id: req.params.id });
    if (!model) {
      return res.status(404).json({ error: 'AI model not found' });
    }
    res.json(model);
  } catch (error) {
    console.error('Failed to get AI model:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建AI模型
app.post('/api/ai-models', async (req, res) => {
  try {
    const modelData = req.body;
    modelData._id = modelData.id || 'ai-model-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    modelData.createdAt = new Date().toISOString();
    modelData.updatedAt = new Date().toISOString();
    delete modelData.id;
    
    const result = await db.collection('aiModels').insertOne(modelData);
    res.json({ ...modelData, _id: result.insertedId });
  } catch (error) {
    console.error('Failed to create AI model:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新AI模型
app.put('/api/ai-models/:id', async (req, res) => {
  try {
    const modelData = req.body;
    delete modelData.id;
    delete modelData._id;
    
    await db.collection('aiModels').updateOne(
      { _id: req.params.id },
      { $set: { ...modelData, updatedAt: new Date().toISOString() } }
    );
    
    const updatedModel = await db.collection('aiModels').findOne({ _id: req.params.id });
    res.json(updatedModel);
  } catch (error) {
    console.error('Failed to update AI model:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除AI模型
app.delete('/api/ai-models/:id', async (req, res) => {
  try {
    console.log('Received request to delete AI model with ID:', req.params.id);
    
    // 先检查模型是否存在（尝试字符串ID）
    console.log('Searching for model with _id as string:', req.params.id);
    let model = await db.collection('aiModels').findOne({ _id: req.params.id });
    console.log('String ID search result:', model);
    
    // 如果没找到，尝试ObjectId
    if (!model) {
      console.log('Trying ObjectId search...');
      const { ObjectId } = require('mongodb');
      try {
        model = await db.collection('aiModels').findOne({ _id: new ObjectId(req.params.id) });
        console.log('ObjectId search result:', model);
        
        // 如果找到了，使用ObjectId进行删除
        if (model) {
          const result = await db.collection('aiModels').deleteOne({ _id: new ObjectId(req.params.id) });
          console.log('Delete operation result:', result);
          
          if (result.deletedCount === 0) {
            console.log('No AI model was actually deleted with ID:', req.params.id);
            return res.status(404).json({ error: 'AI model not found or already deleted' });
          }
          
          console.log('AI model deleted successfully with ID:', req.params.id);
          return res.json({ message: 'AI model deleted successfully', id: req.params.id });
        }
      } catch (objectIdError) {
        console.log('ObjectId conversion failed:', objectIdError.message);
      }
    }
    
    if (!model) {
      console.log('No AI model found with ID:', req.params.id);
      // 再尝试一次模糊搜索
      const allModels = await db.collection('aiModels').find({}).toArray();
      console.log('All models in database:', allModels.map(m => ({_id: m._id, name: m.name})));
      return res.status(404).json({ error: 'AI model not found' });
    }
    
    console.log('Found AI model to delete:', model.name, model._id);
    
    // 如果是默认模型，记录警告但继续删除
    if (model.isDefault) {
      console.warn('Warning: Deleting default AI model:', model.name);
    }
    
    const result = await db.collection('aiModels').deleteOne({ _id: req.params.id });
    console.log('Delete operation result:', result);
    
    if (result.deletedCount === 0) {
      console.log('No AI model was actually deleted with ID:', req.params.id);
      return res.status(404).json({ error: 'AI model not found or already deleted' });
    }
    
    console.log('AI model deleted successfully with ID:', req.params.id);
    res.json({ message: 'AI model deleted successfully', id: req.params.id });
  } catch (error) {
    console.error('Failed to delete AI model:', error);
    res.status(500).json({ error: error.message });
  }
});

// 设置AI模型为默认模型
app.post('/api/ai-models/:id/set-default', async (req, res) => {
  try {
    console.log('Setting AI model as default, ID:', req.params.id);
    
    // 首先将所有模型的isDefault设置为false
    await db.collection('aiModels').updateMany({}, { $set: { isDefault: false } });
    
    // 然后将指定模型的isDefault设置为true
    const result = await db.collection('aiModels').updateOne(
      { _id: req.params.id },
      { $set: { isDefault: true, updatedAt: new Date().toISOString() } }
    );
    
    if (result.matchedCount === 0) {
      // 如果没找到，尝试ObjectId
      const { ObjectId } = require('mongodb');
      try {
        await db.collection('aiModels').updateMany({}, { $set: { isDefault: false } });
        const objectIdResult = await db.collection('aiModels').updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { isDefault: true, updatedAt: new Date().toISOString() } }
        );
        
        if (objectIdResult.matchedCount === 0) {
          return res.status(404).json({ error: 'AI model not found' });
        }
      } catch (objectIdError) {
        console.log('ObjectId conversion failed:', objectIdError.message);
        return res.status(404).json({ error: 'AI model not found' });
      }
    }
    
    // 获取更新后的模型
    const updatedModel = await db.collection('aiModels').findOne({ _id: req.params.id });
    if (!updatedModel) {
      const { ObjectId } = require('mongodb');
      const updatedModel = await db.collection('aiModels').findOne({ _id: new ObjectId(req.params.id) });
    }
    
    console.log('AI model set as default successfully:', updatedModel.name);
    res.json(updatedModel);
  } catch (error) {
    console.error('Failed to set AI model as default:', error);
    res.status(500).json({ error: error.message });
  }
});

// 取消AI模型的默认设置
app.post('/api/ai-models/:id/unset-default', async (req, res) => {
  try {
    console.log('Unsetting AI model as default, ID:', req.params.id);
    
    // 将指定模型的isDefault设置为false
    const result = await db.collection('aiModels').updateOne(
      { _id: req.params.id },
      { $set: { isDefault: false, updatedAt: new Date().toISOString() } }
    );
    
    if (result.matchedCount === 0) {
      // 如果没找到，尝试ObjectId
      const { ObjectId } = require('mongodb');
      try {
        const objectIdResult = await db.collection('aiModels').updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { isDefault: false, updatedAt: new Date().toISOString() } }
        );
        
        if (objectIdResult.matchedCount === 0) {
          return res.status(404).json({ error: 'AI model not found' });
        }
      } catch (objectIdError) {
        console.log('ObjectId conversion failed:', objectIdError.message);
        return res.status(404).json({ error: 'AI model not found' });
      }
    }
    
    // 获取更新后的模型
    const updatedModel = await db.collection('aiModels').findOne({ _id: req.params.id });
    if (!updatedModel) {
      const { ObjectId } = require('mongodb');
      const updatedModel = await db.collection('aiModels').findOne({ _id: new ObjectId(req.params.id) });
    }
    
    console.log('AI model unset as default successfully:', updatedModel.name);
    res.json(updatedModel);
  } catch (error) {
    console.error('Failed to unset AI model as default:', error);
    res.status(500).json({ error: error.message });
  }
});

// 大纲API路由
// 获取所有大纲
app.get('/api/outlines', async (req, res) => {
  try {
    // 检查是否有novelId查询参数
    const novelId = req.query.novelId;
    
    let query = {};
    // 如果有novelId参数，按小说ID过滤
    if (novelId) {
      query.novelId = novelId;
    }
    
    const outlines = await db.collection('outlines').find(query).toArray();
    res.json(outlines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取大纲详情
app.get('/api/outlines/:id', async (req, res) => {
  try {
    const outline = await db.collection('outlines').findOne({ _id: req.params.id });
    res.json(outline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建大纲
app.post('/api/outlines', async (req, res) => {
  try {
    const outline = req.body;
    // 如果没有提供id，则生成一个唯一的id
    if (!outline.id) {
      outline._id = 'outline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    } else {
      outline._id = outline.id;
    }
    delete outline.id;
    const result = await db.collection('outlines').insertOne(outline);
    res.json({ ...req.body, _id: result.insertedId || outline._id });
  } catch (error) {
    console.error('Failed to create outline:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新大纲
app.put('/api/outlines/:id', async (req, res) => {
  try {
    const outline = req.body;
    delete outline.id;
    await db.collection('outlines').updateOne(
      { _id: req.params.id },
      { $set: outline }
    );
    res.json({ ...outline, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除大纲
app.delete('/api/outlines/:id', async (req, res) => {
  try {
    await db.collection('outlines').deleteOne({ _id: req.params.id });
    res.json({ message: 'Outline deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 世界观设定API路由
// 获取所有世界观设定
app.get('/api/world-settings', async (req, res) => {
  try {
    // 检查是否有novelId和type查询参数
    const novelId = req.query.novelId;
    const type = req.query.type;
    
    let query = {};
    // 如果有novelId参数，按小说ID过滤
    if (novelId) {
      query.novelId = novelId;
    }
    // 如果有type参数，按类型过滤
    if (type) {
      query.type = type;
    }
    
    const worldSettings = await db.collection('worldSettings').find(query).toArray();
    res.json(worldSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取世界观设定详情
app.get('/api/world-settings/:id', async (req, res) => {
  try {
    const worldSetting = await db.collection('worldSettings').findOne({ _id: req.params.id });
    res.json(worldSetting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建世界观设定
app.post('/api/world-settings', async (req, res) => {
  try {
    const worldSetting = req.body;
    // 如果没有提供id，则生成一个唯一的id
    if (!worldSetting.id) {
      worldSetting._id = 'world-setting-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    } else {
      worldSetting._id = worldSetting.id;
    }
    delete worldSetting.id;
    const result = await db.collection('worldSettings').insertOne(worldSetting);
    res.json({ ...req.body, _id: result.insertedId || worldSetting._id });
  } catch (error) {
    console.error('Failed to create world setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新世界观设定
app.put('/api/world-settings/:id', async (req, res) => {
  try {
    const worldSetting = req.body;
    delete worldSetting.id;
    await db.collection('worldSettings').updateOne(
      { _id: req.params.id },
      { $set: worldSetting }
    );
    res.json({ ...worldSetting, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除世界观设定
app.delete('/api/world-settings/:id', async (req, res) => {
  try {
    await db.collection('worldSettings').deleteOne({ _id: req.params.id });
    res.json({ message: 'World setting deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 写作记录API路由
// 获取所有写作记录
app.get('/api/writing-records', async (req, res) => {
  try {
    // 检查是否有novelId查询参数
    const novelId = req.query.novelId;
    
    let query = {};
    // 如果有novelId参数，按小说ID过滤
    if (novelId) {
      query.novelId = novelId;
    }
    
    const writingRecords = await db.collection('writingRecords').find(query).toArray();
    res.json(writingRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取写作记录详情
app.get('/api/writing-records/:id', async (req, res) => {
  try {
    const writingRecord = await db.collection('writingRecords').findOne({ _id: req.params.id });
    res.json(writingRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建写作记录
app.post('/api/writing-records', async (req, res) => {
  try {
    const writingRecord = req.body;
    // 如果没有提供id，则生成一个唯一的id
    if (!writingRecord.id) {
      writingRecord._id = 'writing-record-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    } else {
      writingRecord._id = writingRecord.id;
    }
    delete writingRecord.id;
    const result = await db.collection('writingRecords').insertOne(writingRecord);
    res.json({ ...req.body, _id: result.insertedId || writingRecord._id });
  } catch (error) {
    console.error('Failed to create writing record:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新写作记录
app.put('/api/writing-records/:id', async (req, res) => {
  try {
    const writingRecord = req.body;
    delete writingRecord.id;
    await db.collection('writingRecords').updateOne(
      { _id: req.params.id },
      { $set: writingRecord }
    );
    res.json({ ...writingRecord, _id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除写作记录
app.delete('/api/writing-records/:id', async (req, res) => {
  try {
    await db.collection('writingRecords').deleteOne({ _id: req.params.id });
    res.json({ message: 'Writing record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 章节版本API路由
// 获取章节的所有版本
app.get('/api/chapter-versions', async (req, res) => {
  try {
    // 检查是否有chapterId查询参数
    const chapterId = req.query.chapterId;
    
    let query = {};
    // 如果有chapterId参数，按章节ID过滤
    if (chapterId) {
      query.chapterId = chapterId;
    }
    
    const versions = await db.collection('chapterVersions').find(query).toArray();
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 根据ID获取章节版本
app.get('/api/chapter-versions/:id', async (req, res) => {
  try {
    const version = await db.collection('chapterVersions').findOne({ _id: req.params.id });
    res.json(version);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建章节版本
app.post('/api/chapter-versions', async (req, res) => {
  try {
    const version = req.body;
    // 如果没有提供id，则生成一个唯一的id
    if (!version.id) {
      version._id = 'chapter-version-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    } else {
      version._id = version.id;
    }
    delete version.id;
    const result = await db.collection('chapterVersions').insertOne(version);
    res.json({ ...req.body, _id: result.insertedId || version._id });
  } catch (error) {
    console.error('Failed to create chapter version:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除章节版本
app.delete('/api/chapter-versions/:id', async (req, res) => {
  try {
    await db.collection('chapterVersions').deleteOne({ _id: req.params.id });
    res.json({ message: 'Chapter version deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 聊天历史API路由
// 更新聊天历史
app.put('/api/chat-history/:novelId', async (req, res) => {
  try {
    const { novelId } = req.params;
    const { messages } = req.body;
    
    // 创建或更新聊天历史记录
    const chatHistory = {
      _id: `chat-history-${novelId}`,
      novelId,
      messages: messages || [],
      lastModified: new Date().toISOString()
    };
    
    await db.collection('chatHistory').replaceOne(
      { _id: chatHistory._id },
      chatHistory,
      { upsert: true }
    );
    
    res.json({ success: true, message: 'Chat history updated' });
  } catch (error) {
    console.error('Failed to update chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取聊天历史
app.get('/api/chat-history/:novelId', async (req, res) => {
  try {
    const { novelId } = req.params;
    const chatHistory = await db.collection('chatHistory').findOne({ 
      _id: `chat-history-${novelId}` 
    });
    
    if (!chatHistory) {
      return res.json({ 
        novelId,
        messages: [],
        lastModified: new Date().toISOString()
      });
    }
    
    res.json(chatHistory);
  } catch (error) {
    console.error('Failed to get chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

// 清空聊天历史
app.delete('/api/chat-history/:novelId', async (req, res) => {
  try {
    const { novelId } = req.params;
    
    await db.collection('chatHistory').deleteOne({ 
      _id: `chat-history-${novelId}` 
    });
    
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Failed to clear chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

// 提示词库API路由
// 获取所有提示词库集合
app.get('/api/prompt-library', async (req, res) => {
  try {
    const collections = await db.collection('promptLibrary').find({}).toArray();
    // 确保返回的数据有id字段（映射自_id）
    const result = collections.map(collection => {
      const { _id, ...rest } = collection;
      return { ...rest, id: _id };
    });
    res.json(result);
  } catch (error) {
    console.error('Failed to get prompt library collections:', error);
    res.status(500).json({ error: error.message });
  }
});

// 根据ID获取提示词库集合
app.get('/api/prompt-library/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await db.collection('promptLibrary').findOne({ _id: id });
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    // 确保返回的数据有id字段（映射自_id）
    const { _id, ...rest } = collection;
    const result = { ...rest, id: _id };
    res.json(result);
  } catch (error) {
    console.error('Failed to get prompt library collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 创建提示词库集合
app.post('/api/prompt-library', async (req, res) => {
  try {
    const collectionData = req.body;
    // 确保有_id字段
    if (!collectionData._id) {
      collectionData._id = `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // 添加创建时间
    collectionData.createdAt = collectionData.createdAt || new Date().toISOString();
    collectionData.updatedAt = new Date().toISOString();
    
    await db.collection('promptLibrary').insertOne(collectionData);
    
    // 确保返回的数据有id字段（映射自_id）
    const result = { ...collectionData, id: collectionData._id };
    delete result._id;
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to create prompt library collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新提示词库集合
app.put('/api/prompt-library/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    // 更新时间戳
    updateData.updatedAt = new Date().toISOString();
    
    const result = await db.collection('promptLibrary').updateOne(
      { _id: id },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    // 获取更新后的数据
    const updatedCollection = await db.collection('promptLibrary').findOne({ _id: id });
    
    // 确保返回的数据有id字段（映射自_id）
    if (updatedCollection) {
      const result = { ...updatedCollection, id: updatedCollection._id };
      delete result._id;
      res.json(result);
    } else {
      res.json({ success: true, message: 'Collection updated' });
    }
  } catch (error) {
    console.error('Failed to update prompt library collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 删除提示词库集合
app.delete('/api/prompt-library/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.collection('promptLibrary').deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    res.json({ success: true, message: 'Collection deleted', id });
  } catch (error) {
    console.error('Failed to delete prompt library collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});