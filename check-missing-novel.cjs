#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.server') });

// 使用本地MongoDB配置
const LOCAL_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';
const DB_NAME = process.env.MONGODB_DB_NAME || 'mumo-ai-writer';

console.log('🔍 检查缺失的小说');
console.log('==================');
console.log('URI:', LOCAL_MONGODB_URI);
console.log('数据库名:', DB_NAME);
console.log('');

async function checkMissingNovel() {
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
    
    // 查找特定小说"天命大秦：我的AI是始皇导师"
    console.log('\n🔍 查找小说 "天命大秦：我的AI是始皇导师"...');
    const novel = await db.collection('novels').findOne({ 
      title: '天命大秦：我的AI是始皇导师' 
    });
    
    if (!novel) {
      console.log('❌ 未找到小说 "天命大秦：我的AI是始皇导师"');
      return;
    }
    
    console.log(`✅ 找到小说: ${novel.title}`);
    console.log(`   ID: ${novel._id}`);
    console.log(`   当前作者字段: author=${novel.author || 'N/A'}, userId=${novel.userId || 'N/A'}`);
    console.log(`   用户ID: ${user._id}`);
    
    // 检查作者字段是否正确
    if (novel.author === '木墨') {
      console.log('\n🔧 发现问题: 小说作者字段为"木墨"而不是用户ID');
      console.log('💡 建议修复: 将作者字段更新为用户ID');
      
      // 确认是否执行修复
      console.log('\n⚠️  确认修复这本小说的作者字段吗? (yes/no)');
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('请输入 (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
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
              console.log('✅ 已成功修复小说的作者字段');
            } else {
              console.log('⚠️  小说未修改');
            }
          } catch (error) {
            console.error('❌ 修复小说失败:', error.message);
          }
        } else {
          console.log('❌ 取消修复操作');
        }
        
        await client.close();
        console.log('🔒 数据库连接已关闭');
        rl.close();
      });
    } else if (novel.author === user._id || novel.userId === user._id) {
      console.log('\n✅ 小说的作者字段已经是正确的');
      await client.close();
      console.log('🔒 数据库连接已关闭');
    } else {
      console.log('\n⚠️  小说的作者字段既不是"木墨"也不是用户ID，需要进一步检查');
      await client.close();
      console.log('🔒 数据库连接已关闭');
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    if (client) {
      await client.close();
    }
  }
}

// 如果直接运行此脚本，则执行检查函数
if (require.main === module) {
  checkMissingNovel();
}

// 导出函数供其他脚本使用
module.exports = { checkMissingNovel };