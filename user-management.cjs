#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// MongoDB连接配置
const MONGO_URI = "mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0";
const DB_NAME = "mumo-ai-writer";
const SALT_ROUNDS = 10;

/**
 * 创建测试用户
 * @param {Array} users - 用户数组，每个用户包含email和name属性
 * @param {string} password - 所有用户的默认密码
 */
async function createTestUsers(users, password) {
  const client = new MongoClient(MONGO_URI);
  
  try {
    // 连接到MongoDB
    await client.connect();
    console.log("成功连接到MongoDB Atlas!");
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // 生成密码哈希
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // 创建用户数组
    const usersToInsert = users.map((user, index) => {
      // 确保用户有正确的会员信息结构
      const membershipInfo = user.membershipInfo || {
        level: 'FREE',
        expiryDate: null,
        maxNovels: 3,
        aiGenerationLimit: 10,
        aiGenerationUsed: 0,
        features: [
          'novel_creation',
          'basic_editing',
          'txt_export',
          'markdown_export'
        ],
        teamEnabled: false,
        maxTeamMembers: 0,
        isAdmin: false,
        // 确保用户名和邮箱字段正确设置
        username: user.name || user.username || user.email.split("@")[0],
        email: user.email
      };
      
      // 如果membershipInfo中缺少用户名或邮箱字段，则添加
      if (!membershipInfo.username) {
        membershipInfo.username = user.name || user.username || user.email.split("@")[0];
      }
      if (!membershipInfo.email) {
        membershipInfo.email = user.email;
      }
      
      return {
        _id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        username: user.name || user.username || user.email.split("@")[0],
        passwordHash: passwordHash,     // 正确的密码字段
        isEmailVerified: true,          // 正确的邮箱验证字段
        createdAt: new Date(),
        updatedAt: new Date(),
        membershipInfo: membershipInfo
      };
    });
    
    // 插入用户到数据库
    const result = await usersCollection.insertMany(usersToInsert);
    console.log(`\n✅ 成功创建 ${result.insertedCount} 个用户:`);
    
    usersToInsert.forEach(user => {
      console.log(`   • ${user.name} (${user.email})`);
      console.log(`     会员等级: ${user.membershipInfo.level}`);
      console.log(`     用户名: ${user.membershipInfo.username}`);
      console.log(`     邮箱: ${user.membershipInfo.email}`);
    });
    
    console.log(`\n🔐 所有用户都使用密码: ${password}`);
    console.log("✅ 所有用户都已设置为已验证邮箱状态\n");
    
    return result;
  } catch (error) {
    console.error("❌ 创建用户过程中发生错误:", error);
    throw error;
  } finally {
    await client.close();
    console.log("🔒 数据库连接已关闭");
  }
}

/**
 * 列出所有用户
 */
async function listUsers() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log("成功连接到MongoDB Atlas!");
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // 获取所有用户
    const users = await usersCollection.find({}).toArray();
    
    console.log(`\n📋 数据库中共有 ${users.length} 个用户:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || user.username || 'N/A'} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   会员等级: ${user.membershipInfo?.level || 'N/A'}`);
      console.log(`   用户名: ${user.membershipInfo?.username || 'N/A'}`);
      console.log(`   邮箱: ${user.membershipInfo?.email || 'N/A'}`);
      console.log(`   邮箱已验证: ${user.isEmailVerified ? '是' : '否'}`);
      console.log(`   创建时间: ${user.createdAt ? user.createdAt.toISOString() : 'N/A'}\n`);
    });
    
  } catch (error) {
    console.error("❌ 列出用户过程中发生错误:", error);
    throw error;
  } finally {
    await client.close();
    console.log("🔒 数据库连接已关闭");
  }
}

/**
 * 删除测试用户
 * @param {Array} emails - 要删除的用户邮箱数组
 */
async function deleteTestUsers(emails) {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log("成功连接到MongoDB Atlas!");
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // 删除指定邮箱的用户
    const result = await usersCollection.deleteMany({
      email: { $in: emails }
    });
    
    console.log(`\n🗑️  成功删除 ${result.deletedCount} 个用户`);
    
    if (result.deletedCount > 0) {
      emails.forEach(email => {
        console.log(`   • ${email}`);
      });
    }
    
  } catch (error) {
    console.error("❌ 删除用户过程中发生错误:", error);
    throw error;
  } finally {
    await client.close();
    console.log("🔒 数据库连接已关闭");
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'create-test':
        // 创建测试用户
        const testUsers = [
          {
            email: "763337611@qq.com",
            name: "蜗牛丢了壳"
          },
          {
            email: "test1@example.com",
            name: "测试员1"
          },
          {
            email: "test2@example.com",
            name: "测试员2"
          }
        ];
        await createTestUsers(testUsers, "mumo123");
        break;
        
      case 'create':
        // 从命令行参数创建用户
        if (args.length < 4) {
          console.log("用法: node user-management.cjs create <邮箱> <姓名> [密码]");
          console.log("示例: node user-management.cjs create user@example.com \"用户名\" mumo123");
          process.exit(1);
        }
        
        const email = args[1];
        const name = args[2];
        const password = args[3] || "mumo123";
        
        await createTestUsers([{ email, name }], password);
        break;
        
      case 'list':
        // 列出所有用户
        await listUsers();
        break;
        
      case 'delete-test':
        // 删除测试用户
        const testEmails = [
          "763337611@qq.com",
          "test1@example.com",
          "test2@example.com"
        ];
        await deleteTestUsers(testEmails);
        break;
        
      default:
        console.log("用户管理工具");
        console.log("========================");
        console.log("用法:");
        console.log("  node user-management.cjs create-test     - 创建默认测试用户");
        console.log("  node user-management.cjs create <邮箱> <姓名> [密码] - 创建单个用户");
        console.log("  node user-management.cjs list            - 列出所有用户");
        console.log("  node user-management.cjs delete-test     - 删除测试用户");
        console.log("");
        console.log("示例:");
        console.log("  node user-management.cjs create-test");
        console.log("  node user-management.cjs create newuser@example.com \"新用户\" mypassword");
        console.log("  node user-management.cjs list");
        break;
    }
  } catch (error) {
    console.error("程序执行出错:", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行main函数
if (require.main === module) {
  main();
}

// 导出函数供其他脚本使用
module.exports = {
  createTestUsers,
  listUsers,
  deleteTestUsers
};