// 检查特定用户的小说情况
const { MongoClient } = require('mongodb');

// MongoDB连接配置
const MONGO_URI = "mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0";
const DB_NAME = "mumo-ai-writer";

async function checkUserNovels() {
  let client;
  
  try {
    console.log('正在连接到MongoDB...');
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ 成功连接到MongoDB!');
    
    const db = client.db(DB_NAME);
    
    // 找到用户"蜗牛丢了壳"
    const usersCollection = db.collection('users');
    const targetUser = await usersCollection.findOne({ email: "763337611@qq.com" });
    
    if (!targetUser) {
      console.log('❌ 未找到用户"蜗牛丢了壳"(763337611@qq.com)');
      return;
    }
    
    console.log(`找到用户: ${targetUser.username} (ID: ${targetUser._id})`);
    console.log(`会员等级: ${targetUser.membershipInfo?.level || 'N/A'}`);
    
    // 查找该用户的所有小说
    const novelsCollection = db.collection('novels');
    const userNovels = await novelsCollection.find({ 
      $or: [
        { author: targetUser._id },
        { userId: targetUser._id }
      ]
    }).toArray();
    
    console.log(`\n用户"${targetUser.username}"名下共有 ${userNovels.length} 本小说:`);
    
    userNovels.forEach((novel, index) => {
      console.log(`${index + 1}. ${novel.title || 'N/A'}`);
      console.log(`   ID: ${novel._id}`);
      console.log(`   作者字段: author=${novel.author || 'N/A'}, userId=${novel.userId || 'N/A'}`);
      console.log(`   字数: ${novel.wordCount || 0}`);
      console.log(`   状态: ${novel.status || 'N/A'}`);
      console.log(`   创建时间: ${novel.createdAt ? new Date(novel.createdAt).toLocaleString() : 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 处理过程中出现错误:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔒 数据库连接已关闭');
    }
  }
}

// 执行检查
checkUserNovels();