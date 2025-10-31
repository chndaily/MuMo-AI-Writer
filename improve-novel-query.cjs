#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.server') });

// 使用本地MongoDB配置
const LOCAL_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';
const DB_NAME = process.env.MONGODB_DB_NAME || 'mumo-ai-writer';

console.log('🔧 改进小说查询逻辑验证');
console.log('====================');
console.log('URI:', LOCAL_MONGODB_URI);
console.log('数据库名:', DB_NAME);
console.log('');

async function improveNovelQuery() {
  console.log('🔍 正在连接到本地MongoDB数据库...');
  
  let client;
  try {
    client = new MongoClient(LOCAL_MONGODB_URI);
    await client.connect();
    console.log('✅ 成功连接到本地MongoDB数据库');
    
    const db = client.db(DB_NAME);
    
    // 获取chndaily@foxmail.com用户
    console.log('\n🔍 查找用户 chndaily@foxmail.com...');
    const user = await db.collection('users').findOne({ email: 'chndaily@foxmail.com' });
    
    if (!user) {
      console.log('❌ 未找到用户 chndaily@foxmail.com');
      return;
    }
    
    console.log(`✅ 找到用户: ${user.email} (ID: ${user._id})`);
    
    // 使用现有的查询方式（author字段）
    console.log('\n🔍 使用现有查询方式 (author字段)...');
    const novelsByAuthor = await db.collection('novels').find({ 
      $or: [
        { author: user._id },
        { userId: user._id },
        { author: 'admin' }  // 兼容旧数据
      ]
    }).toArray();
    
    console.log(`  找到 ${novelsByAuthor.length} 本小说:`);
    novelsByAuthor.forEach((novel, index) => {
      console.log(`    ${index + 1}. ${novel.title}`);
      console.log(`       author: ${novel.author}, userId: ${novel.userId}`);
    });
    
    // 使用改进的查询方式（优先使用userId字段）
    console.log('\n🔍 使用改进查询方式 (优先使用userId字段)...');
    const novelsByUserId = await db.collection('novels').find({ 
      userId: user._id
    }).toArray();
    
    console.log(`  找到 ${novelsByUserId.length} 本小说:`);
    novelsByUserId.forEach((novel, index) => {
      console.log(`    ${index + 1}. ${novel.title}`);
      console.log(`       author: ${novel.author}, userId: ${novel.userId}`);
    });
    
    // 比较两种查询方式的结果
    console.log('\n📊 查询结果比较:');
    console.log(`  现有方式找到: ${novelsByAuthor.length} 本小说`);
    console.log(`  改进方式找到: ${novelsByUserId.length} 本小说`);
    
    if (novelsByAuthor.length === novelsByUserId.length) {
      console.log('  ✅ 两种查询方式结果一致');
    } else {
      console.log('  ⚠️  两种查询方式结果不一致');
    }
    
    await client.close();
    console.log('\n🔒 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    if (client) {
      await client.close();
    }
  }
}

// 执行验证
improveNovelQuery();