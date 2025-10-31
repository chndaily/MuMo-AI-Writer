#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.server') });

// 使用本地MongoDB配置
const LOCAL_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';
const DB_NAME = process.env.MONGODB_DB_NAME || 'mumo-ai-writer';

console.log('🔧 检查本地MongoDB数据库');
console.log('========================');
console.log('URI:', LOCAL_MONGODB_URI);
console.log('数据库名:', DB_NAME);
console.log('');

async function checkLocalDatabase() {
  console.log('🔍 正在连接到本地MongoDB数据库...');
  
  let client;
  try {
    client = new MongoClient(LOCAL_MONGODB_URI);
    await client.connect();
    console.log('✅ 成功连接到本地MongoDB数据库');
    
    const db = client.db(DB_NAME);
    
    // 检查数据库中的所有集合
    const collections = await db.listCollections().toArray();
    console.log('\n📚 数据库中的集合:');
    if (collections.length === 0) {
      console.log('  (空)');
    } else {
      collections.forEach(collection => {
        console.log(`  - ${collection.name}`);
      });
    }
    
    // 检查用户集合
    if (collections.some(c => c.name === 'users')) {
      const users = await db.collection('users').find().toArray();
      console.log(`\n👥 用户集合中有 ${users.length} 个用户:`);
      if (users.length === 0) {
        console.log('  (空)');
      } else {
        users.forEach(user => {
          console.log(`  - ID: ${user._id}, 邮箱: ${user.email}, 名称: ${user.name || 'N/A'}`);
        });
      }
    } else {
      console.log('\n❓ 未找到用户集合');
    }
    
    // 检查小说集合
    if (collections.some(c => c.name === 'novels')) {
      const novels = await db.collection('novels').find().toArray();
      console.log(`\n📖 小说集合中有 ${novels.length} 本小说:`);
      if (novels.length === 0) {
        console.log('  (空)');
      } else {
        novels.forEach(novel => {
          console.log(`  - ID: ${novel._id}, 标题: ${novel.title}, 作者: ${novel.author || novel.userId || 'N/A'}`);
        });
      }
    } else {
      console.log('\n❓ 未找到小说集合');
    }
    
    // 检查角色集合
    if (collections.some(c => c.name === 'characters')) {
      const characters = await db.collection('characters').find().toArray();
      console.log(`\n🎭 角色集合中有 ${characters.length} 个角色:`);
      if (characters.length === 0) {
        console.log('  (空)');
      } else {
        characters.forEach(character => {
          console.log(`  - ID: ${character._id}, 名称: ${character.name}, 小说ID: ${character.novelId || 'N/A'}`);
        });
      }
    } else {
      console.log('\n❓ 未找到角色集合');
    }
    
    await client.close();
    console.log('\n✅ 数据库检查完成');
  } catch (error) {
    console.error('❌ 连接本地MongoDB数据库失败:', error.message);
    if (client) {
      await client.close();
    }
  }
}

// 执行检查
checkLocalDatabase();