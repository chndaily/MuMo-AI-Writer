#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.server') });

// 使用本地MongoDB配置
const LOCAL_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mumo-ai-writer';
const DB_NAME = process.env.MONGODB_DB_NAME || 'mumo-ai-writer';

console.log('🔧 修复所有小说的作者字段');
console.log('========================');
console.log('URI:', LOCAL_MONGODB_URI);
console.log('数据库名:', DB_NAME);
console.log('');

async function fixAllNovelsAuthors() {
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
    
    // 分析小说的作者字段
    console.log('\n📊 分析小说作者字段...');
    let novelsToFix = [];
    let correctlyLinkedNovels = 0;
    
    novels.forEach(novel => {
      // 检查author字段是否为有效的用户ID
      const isAuthorValidUserId = users.some(user => user._id === novel.author);
      const isUserIdValid = users.some(user => user._id === novel.userId);
      
      if (isAuthorValidUserId && isUserIdValid) {
        // 作者字段和userId字段都是有效的用户ID
        correctlyLinkedNovels++;
      } else {
        // 需要修复的小说
        novelsToFix.push(novel);
      }
    });
    
    console.log(`✅ 正确关联的小说: ${correctlyLinkedNovels} 本`);
    console.log(`🔧 需要修复的小说: ${novelsToFix.length} 本`);
    
    if (novelsToFix.length > 0) {
      console.log('\n🔧 需要修复的小说列表:');
      novelsToFix.forEach((novel, index) => {
        console.log(`\n${index + 1}. 标题: ${novel.title || 'N/A'}`);
        console.log(`   ID: ${novel._id}`);
        console.log(`   当前作者字段: author=${novel.author || 'N/A'}, userId=${novel.userId || 'N/A'}`);
        
        // 尝试根据现有信息找到正确的用户ID
        let correctUserId = null;
        
        // 如果author字段是邮箱，尝试映射到用户ID
        if (novel.author && emailToUserId[novel.author]) {
          correctUserId = emailToUserId[novel.author];
          console.log(`   🔍 根据author邮箱找到用户ID: ${correctUserId}`);
        }
        // 如果userId字段是邮箱，尝试映射到用户ID
        else if (novel.userId && emailToUserId[novel.userId]) {
          correctUserId = emailToUserId[novel.userId];
          console.log(`   🔍 根据userId邮箱找到用户ID: ${correctUserId}`);
        }
        // 如果author字段是"admin"或"木墨"，尝试关联到chndaily@foxmail.com用户
        else if (novel.author === 'admin' || novel.author === '木墨' || novel.userId === 'admin' || novel.userId === '木墨') {
          correctUserId = emailToUserId['chndaily@foxmail.com'];
          console.log(`   🔍 根据特殊作者名找到用户ID: ${correctUserId}`);
        }
        
        if (correctUserId) {
          console.log(`   💡 建议修复为: author=${correctUserId}, userId=${correctUserId}`);
        } else {
          console.log(`   ❓ 无法确定正确的用户ID`);
        }
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
              // 尝试根据现有信息找到正确的用户ID
              let correctUserId = null;
              
              // 如果author字段是邮箱，尝试映射到用户ID
              if (novel.author && emailToUserId[novel.author]) {
                correctUserId = emailToUserId[novel.author];
              }
              // 如果userId字段是邮箱，尝试映射到用户ID
              else if (novel.userId && emailToUserId[novel.userId]) {
                correctUserId = emailToUserId[novel.userId];
              }
              // 如果author字段是"admin"或"木墨"，关联到chndaily@foxmail.com用户
              else if (novel.author === 'admin' || novel.author === '木墨') {
                correctUserId = emailToUserId['chndaily@foxmail.com'];
              }
              // 如果userId字段是"admin"或"木墨"，关联到chndaily@foxmail.com用户
              else if (novel.userId === 'admin' || novel.userId === '木墨') {
                correctUserId = emailToUserId['chndaily@foxmail.com'];
              }
              
              if (correctUserId) {
                const result = await db.collection('novels').updateOne(
                  { _id: novel._id },
                  { 
                    $set: { 
                      author: correctUserId,
                      userId: correctUserId
                    }
                  }
                );
                
                if (result.modifiedCount > 0) {
                  console.log(`✅ 已修复小说: ${novel.title || novel._id}`);
                  fixedCount++;
                } else {
                  console.log(`⚠️  小说未修改: ${novel.title || novel._id}`);
                }
              } else {
                console.log(`❓ 无法修复小说: ${novel.title || novel._id} (未找到匹配的用户)`);
              }
            } catch (error) {
              console.error(`❌ 修复小说 ${novel.title || novel._id} 失败:`, error.message);
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
    } else {
      console.log('\n✅ 所有小说的作者字段都已正确设置');
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

// 如果直接运行此脚本，则执行修复函数
if (require.main === module) {
  fixAllNovelsAuthors();
}

// 导出函数供其他脚本使用
module.exports = { fixAllNovelsAuthors };