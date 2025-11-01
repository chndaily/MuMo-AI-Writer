// 简单的数据库连接检查脚本
const { MongoClient } = require('mongodb');

// 使用用户管理脚本中的MongoDB连接配置
const MONGO_URI = "mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0";
const DB_NAME = "mumo-ai-writer";

async function checkDB() {
  let client;
  
  try {
    console.log('正在连接到MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ 成功连接到MongoDB!');
    
    const db = client.db(DB_NAME);
    
    // 检查数据库中的集合
    console.log('\n数据库中的集合:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // 检查用户数量
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`\n用户总数: ${userCount}`);
    
    // 检查小说数量
    const novelsCollection = db.collection('novels');
    const novelCount = await novelsCollection.countDocuments();
    console.log(`小说总数: ${novelCount}`);
    
    // 显示前几个用户
    if (userCount > 0) {
      console.log('\n前3个用户:');
      const users = await usersCollection.find({}).limit(3).toArray();
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username || user.name || 'N/A'} (${user.email})`);
        console.log(`   ID: ${user._id}`);
        console.log(`   会员等级: ${user.membershipInfo?.level || 'N/A'}`);
      });
    }
    
    // 显示前几本小说
    if (novelCount > 0) {
      console.log('\n前3本小说:');
      const novels = await novelsCollection.find({}).sort({ createdAt: -1 }).limit(3).toArray();
      novels.forEach((novel, index) => {
        console.log(`${index + 1}. ${novel.title || 'N/A'} (作者: ${novel.userId || novel.author || 'N/A'})`);
        console.log(`   ID: ${novel._id}`);
        console.log(`   字数: ${novel.wordCount || 0}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 连接数据库时出错:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔒 数据库连接已关闭');
    }
  }
}

checkDB();