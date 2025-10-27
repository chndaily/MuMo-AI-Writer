// 直接测试MongoDB连接
// 注意：这个脚本只能在Node.js环境中运行，不能在浏览器中运行

import { MongoClient } from 'mongodb';

// 从环境变量获取MongoDB连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';

async function testMongoDBDirect() {
  console.log('=== 直接测试MongoDB连接 ===');
  console.log(`MongoDB URI: ${MONGODB_URI}`);
  
  let client: MongoClient | null = null;
  
  try {
    // 尝试连接到MongoDB
    console.log('正在连接到MongoDB...');
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5秒超时
      connectTimeoutMS: 5000
    });
    
    await client.connect();
    console.log('✓ MongoDB连接成功');
    
    // 获取数据库信息
    const db = client.db();
    console.log(`数据库名称: ${db.databaseName}`);
    
    // 列出所有集合
    console.log('正在获取集合列表...');
    const collections = await db.listCollections().toArray();
    console.log('数据库中的集合:');
    collections.forEach((collection, index) => {
      console.log(`  ${index + 1}. ${collection.name}`);
    });
    
    // 检查特定集合
    const targetCollections = ['users', 'novels', 'aiModels', 'chapters', 'characters'];
    for (const collectionName of targetCollections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.estimatedDocumentCount();
        console.log(`集合 ${collectionName}: ${count} 个文档`);
      } catch (error) {
        console.log(`集合 ${collectionName}: 无法访问 (${error instanceof Error ? error.message : '未知错误'})`);
      }
    }
    
    // 检查管理员用户
    try {
      const usersCollection = db.collection('users');
      const adminUser = await usersCollection.findOne({ username: 'admin' });
      if (adminUser) {
        console.log('✓ 找到管理员用户');
        console.log(`  用户ID: ${adminUser._id}`);
        console.log(`  用户名: ${adminUser.username}`);
        console.log(`  邮箱: ${adminUser.email}`);
        console.log(`  管理员权限: ${adminUser.membershipInfo?.isAdmin ? '是' : '否'}`);
      } else {
        console.log('⚠ 未找到管理员用户');
      }
    } catch (error) {
      console.log(`检查管理员用户失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    
    // 检查AI模型
    try {
      const aiModelsCollection = db.collection('aiModels');
      const aiModels = await aiModelsCollection.find({}).toArray();
      console.log(`AI模型集合: ${aiModels.length} 个模型`);
      if (aiModels.length > 0) {
        console.log('AI模型详情:');
        aiModels.forEach((model, index) => {
          console.log(`  ${index + 1}. ${model.name} (${model.provider}) - ${model.isDefault ? '默认' : '非默认'}`);
        });
      }
    } catch (error) {
      console.log(`检查AI模型失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    
    console.log('=== MongoDB连接测试完成 ===');
    return true;
  } catch (error) {
    console.error('✗ MongoDB连接失败:', error);
    console.log('可能的原因:');
    console.log('  1. MongoDB服务未启动');
    console.log('  2. MongoDB连接字符串配置错误');
    console.log('  3. 网络连接问题');
    console.log('  4. 防火墙阻止连接');
    console.log('  5. MongoDB认证失败');
    return false;
  } finally {
    // 关闭连接
    if (client) {
      try {
        await client.close();
        console.log('MongoDB连接已关闭');
      } catch (error) {
        console.error('关闭MongoDB连接时出错:', error);
      }
    }
  }
}

// 如果直接运行此脚本
if (typeof require !== 'undefined' && require.main === module) {
  testMongoDBDirect()
    .then(success => {
      console.log(`\n测试结果: ${success ? '成功' : '失败'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('执行过程中出错:', error);
      process.exit(1);
    });
}

export default testMongoDBDirect;