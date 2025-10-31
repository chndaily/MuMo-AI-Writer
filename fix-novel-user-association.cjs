#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.server') });

// 使用本地MongoDB配置
const LOCAL_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';
const DB_NAME = process.env.MONGODB_DB_NAME || 'mumo-ai-writer';

console.log('🔧 修复小说用户关联');
console.log('==================');
console.log('URI:', LOCAL_MONGODB_URI);
console.log('数据库名:', DB_NAME);
console.log('');

async function fixNovelUserAssociation() {
  console.log('🔍 正在连接到本地MongoDB数据库...');
  
  let client;
  try {
    client = new MongoClient(LOCAL_MONGODB_URI);
    await client.connect();
    console.log('✅ 成功连接到本地MongoDB数据库');
    
    const db = client.db(DB_NAME);
    
    // 获取所有用户
    console.log('\n🔍 获取所有用户...');
    const users = await db.collection('users').find().toArray();
    console.log(`✅ 找到 ${users.length} 个用户`);
    
    // 创建邮箱到用户ID的映射
    const emailToUserId = {};
    users.forEach(user => {
      if (user.email) {
        emailToUserId[user.email] = user._id;
      }
    });
    
    // 获取所有小说
    console.log('\n🔍 获取所有小说...');
    const novels = await db.collection('novels').find().toArray();
    console.log(`✅ 找到 ${novels.length} 本小说`);
    
    // 修复小说的用户关联
    console.log('\n🔧 修复小说用户关联...');
    let fixedCount = 0;
    
    for (const novel of novels) {
      let needsUpdate = false;
      const updateFields = {};
      
      // 确保userId字段正确设置
      if (!novel.userId) {
        // 如果没有userId字段，尝试从author字段推断
        if (novel.author && emailToUserId[novel.author]) {
          updateFields.userId = emailToUserId[novel.author];
          needsUpdate = true;
          console.log(`  为小说 "${novel.title}" 添加userId: ${updateFields.userId}`);
        } else if (novel.author === 'admin' || novel.author === '木墨') {
          // 特殊处理admin用户的小说
          const adminUser = users.find(u => u.email === 'chndaily@foxmail.com');
          if (adminUser) {
            updateFields.userId = adminUser._id;
            needsUpdate = true;
            console.log(`  为小说 "${novel.title}" 添加userId: ${updateFields.userId} (admin用户)`);
          }
        }
      }
      
      // 确保author字段存在
      if (!novel.author) {
        // 如果没有author字段，尝试从userId推断用户名
        if (novel.userId) {
          const user = users.find(u => u._id === novel.userId);
          if (user) {
            updateFields.author = user.username || user.email;
            needsUpdate = true;
            console.log(`  为小说 "${novel.title}" 添加author: ${updateFields.author}`);
          }
        }
      }
      
      // 如果需要更新，执行更新操作
      if (needsUpdate) {
        try {
          await db.collection('novels').updateOne(
            { _id: novel._id },
            { $set: updateFields }
          );
          fixedCount++;
        } catch (error) {
          console.error(`  ❌ 更新小说 "${novel.title}" 失败:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 修复完成! 成功修复 ${fixedCount} 本小说的用户关联。`);
    
    // 验证修复结果
    console.log('\n🔍 验证修复结果...');
    const novelsAfterFix = await db.collection('novels').find().toArray();
    let validCount = 0;
    let invalidCount = 0;
    
    novelsAfterFix.forEach(novel => {
      if (novel.userId) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`  ❌ 小说 "${novel.title}" 仍缺少userId字段`);
      }
    });
    
    console.log(`  ✅ 有效关联: ${validCount} 本小说`);
    console.log(`  ❌ 无效关联: ${invalidCount} 本小说`);
    
    await client.close();
    console.log('\n🔒 数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    if (client) {
      await client.close();
    }
  }
}

// 执行修复
fixNovelUserAssociation();