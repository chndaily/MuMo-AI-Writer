#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.server') });

// 使用本地MongoDB配置
const LOCAL_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';
const DB_NAME = process.env.MONGODB_DB_NAME || 'mumo-ai-writer';

console.log('🔧 修复管理员小说的作者字段');
console.log('========================');
console.log('URI:', LOCAL_MONGODB_URI);
console.log('数据库名:', DB_NAME);
console.log('');

async function fixAdminNovels() {
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
    
    // 查找所有需要修复的小说 (author或userId为'admin'的小说)
    console.log('\n🔍 查找需要修复的小说...');
    const novelsToFix = await db.collection('novels').find({
      $or: [
        { author: 'admin' },
        { userId: 'admin' }
      ]
    }).toArray();
    
    if (novelsToFix.length === 0) {
      console.log('✅ 没有发现需要修复的小说');
      return;
    }
    
    console.log(`\n🔧 发现 ${novelsToFix.length} 本需要修复的小说:`);
    novelsToFix.forEach((novel, index) => {
      console.log(`\n${index + 1}. 标题: ${novel.title}`);
      console.log(`   ID: ${novel._id}`);
      console.log(`   当前作者字段: author=${novel.author || 'N/A'}, userId=${novel.userId || 'N/A'}`);
      console.log(`   将修复为: author=${user._id}, userId=${user._id}`);
    });
    
    // 确认是否执行修复
    console.log('\n⚠️  确认修复这些小说的作者字段吗? (yes/no)');
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('请输入 (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('\n🔧 开始修复...');
        
        let fixedCount = 0;
        for (const novel of novelsToFix) {
          try {
            const result = await db.collection('novels').updateOne(
              { _id: novel._id },
              { 
                $set: { 
                  author: user._id,
                  userId: user._id
                }
              }
            );
            
            if (result.modifiedCount > 0) {
              console.log(`✅ 已修复小说: ${novel.title}`);
              fixedCount++;
            } else {
              console.log(`⚠️  小说未修改: ${novel.title}`);
            }
          } catch (error) {
            console.error(`❌ 修复小说 ${novel.title} 失败:`, error.message);
          }
        }
        
        console.log(`\n🎉 修复完成! 成功修复 ${fixedCount} 本小说。`);
      } else {
        console.log('❌ 取消修复操作');
      }
      
      await client.close();
      console.log('🔒 数据库连接已关闭');
      rl.close();
    });
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    if (client) {
      await client.close();
    }
  }
}

// 如果直接运行此脚本，则执行修复函数
if (require.main === module) {
  fixAdminNovels();
}

// 导出函数供其他脚本使用
module.exports = { fixAdminNovels };