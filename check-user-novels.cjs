#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.server') });

// 使用本地MongoDB配置
const LOCAL_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';
const DB_NAME = process.env.MONGODB_DB_NAME || 'mumo-ai-writer';

console.log('🔍 检查用户小说数据');
console.log('====================');
console.log('URI:', LOCAL_MONGODB_URI);
console.log('数据库名:', DB_NAME);
console.log('');

async function checkUserNovels() {
  console.log('🔍 正在连接到本地MongoDB数据库...');
  
  let client;
  try {
    client = new MongoClient(LOCAL_MONGODB_URI);
    await client.connect();
    console.log('✅ 成功连接到本地MongoDB数据库');
    
    const db = client.db(DB_NAME);
    
    // 查找chndaily@foxmail.com用户
    console.log('\n🔍 查找用户 chndaily@foxmail.com...');
    const users = await db.collection('users').find({ email: 'chndaily@foxmail.com' }).toArray();
    
    if (users.length === 0) {
      console.log('❌ 未找到用户 chndaily@foxmail.com');
      return;
    }
    
    const user = users[0];
    console.log(`✅ 找到用户: ${user.email} (ID: ${user._id})`);
    
    // 查找所有小说
    const novels = await db.collection('novels').find().toArray();
    console.log(`\n📚 数据库中共有 ${novels.length} 本小说`);
    
    // 查找该用户作为作者的小说
    console.log('\n🔍 查找该用户的小说...');
    const userNovels = novels.filter(novel => 
      novel.author === user._id || 
      novel.userId === user._id ||
      novel.author === 'admin' ||  // 兼容旧数据
      novel.userId === 'chndaily@foxmail.com'  // 兼容可能的邮箱作为userId的情况
    );
    
    console.log(`\n📖 用户 ${user.email} 共有 ${userNovels.length} 本小说:`);
    
    if (userNovels.length === 0) {
      console.log('  (空)');
    } else {
      userNovels.forEach((novel, index) => {
        console.log(`\n${index + 1}. 标题: ${novel.title || 'N/A'}`);
        console.log(`   ID: ${novel._id}`);
        console.log(`   作者字段: author=${novel.author || 'N/A'}, userId=${novel.userId || 'N/A'}`);
        console.log(`   字数: ${novel.wordCount || 0}`);
        console.log(`   状态: ${novel.status || 'N/A'}`);
        console.log(`   创建时间: ${novel.createdAt ? new Date(novel.createdAt).toLocaleString() : 'N/A'}`);
      });
    }
    
    // 检查是否有作者字段不正确的"admin的小说"
    console.log('\n🔍 检查可能需要修复的小说...');
    const adminNovels = novels.filter(novel => 
      (novel.author === 'admin' || novel.userId === 'admin') && 
      novel.title && novel.title.includes('admin的小说')
    );
    
    if (adminNovels.length > 0) {
      console.log(`\n🔧 发现 ${adminNovels.length} 本可能需要修复的小说:`);
      adminNovels.forEach((novel, index) => {
        console.log(`\n${index + 1}. 标题: ${novel.title}`);
        console.log(`   ID: ${novel._id}`);
        console.log(`   当前作者字段: author=${novel.author || 'N/A'}, userId=${novel.userId || 'N/A'}`);
        console.log(`   建议修复为: author=${user._id}`);
      });
      
      console.log('\n💡 修复建议:');
      console.log('   运行以下命令修复这些小说的作者字段:');
      console.log('   node fix-admin-novels.cjs');
    } else {
      console.log('\n✅ 没有发现需要修复的小说');
    }
    
    await client.close();
    console.log('\n✅ 检查完成');
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    if (client) {
      await client.close();
    }
  }
}

// 执行检查
checkUserNovels();