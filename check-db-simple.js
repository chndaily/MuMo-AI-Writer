// 简化版数据库检查脚本
const { MongoClient } = require('mongodb');

// MongoDB连接配置
const MONGODB_URI = "mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0";

async function checkDatabase() {
  let client;
  
  try {
    console.log('正在连接到MongoDB数据库...');
    
    // 连接到MongoDB
    client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
    
    // 设置超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('连接超时')), 10000);
    });
    
    const connectionPromise = client.connect();
    await Promise.race([connectionPromise, timeoutPromise]);
    
    console.log('✅ 成功连接到MongoDB数据库');
    
    const db = client.db();
    
    // 检查用户集合
    try {
      console.log('\n--- 用户信息 ---');
      const usersCollection = db.collection('users');
      const userCount = await usersCollection.estimatedDocumentCount();
      console.log(`总用户数: ${userCount}`);
      
      if (userCount > 0) {
        const users = await usersCollection.find({}).limit(5).toArray();
        console.log('前5个用户:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.username} (${user.email})`);
        });
      }
    } catch (error) {
      console.log('获取用户信息时出错:', error.message);
    }
    
    // 检查小说集合
    try {
      console.log('\n--- 小说信息 ---');
      const novelsCollection = db.collection('novels');
      const novelCount = await novelsCollection.estimatedDocumentCount();
      console.log(`总小说数: ${novelCount}`);
      
      if (novelCount > 0) {
        const novels = await novelsCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
        console.log('最新5部小说:');
        novels.forEach((novel, index) => {
          console.log(`${index + 1}. ${novel.title} (作者: ${novel.userId || novel.author || '未知'})`);
        });
      }
    } catch (error) {
      console.log('获取小说信息时出错:', error.message);
    }
    
  } catch (error) {
    console.error('❌ 数据库检查过程中出现错误:', error.message);
  } finally {
    if (client) {
      try {
        await client.close();
        console.log('\n已断开数据库连接');
      } catch (closeError) {
        console.log('关闭数据库连接时出错:', closeError.message);
      }
    }
  }
}

// 设置未捕获异常处理器
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 执行检查
checkDatabase().then(() => {
  console.log('数据库检查完成');
}).catch((error) => {
  console.error('执行过程中出现错误:', error);
});