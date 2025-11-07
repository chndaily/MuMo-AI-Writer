#!/usr/bin/env node

const { MongoClient } = require('mongodb');

// 本地MongoDB连接配置
const LOCAL_MONGO_URI = "mongodb://localhost:27017/mumo-ai-writer";
const DB_NAME = "mumo-ai-writer";

/**
 * 详细检查指定小说的大纲内容
 */
async function checkOutlineDetails(novelTitle = '天命大秦') {
  const client = new MongoClient(LOCAL_MONGO_URI);
  
  try {
    // 连接到本地MongoDB
    await client.connect();
    console.log("成功连接到本地MongoDB!");
    
    const db = client.db(DB_NAME);
    
    // 获取所有小说
    const novelsCollection = db.collection('novels');
    const novels = await novelsCollection.find({}).toArray();
    
    console.log(`\n📚 本地数据库中共有 ${novels.length} 本小说`);
    
    // 查找指定小说
    const targetNovel = novels.find(novel => novel.title === novelTitle);
    
    if (!targetNovel) {
      console.log(`\n❌ 未找到标题为"${novelTitle}"的小说。`);
      console.log("\n可用的小说列表:");
      novels.forEach((novel, index) => {
        console.log(`  ${index + 1}. ${novel.title || 'N/A'} (${novel._id})`);
      });
      return;
    }
    
    console.log(`\n✅ 找到了"${novelTitle}"小说:`);
    console.log(`   ID: ${targetNovel._id}`);
    console.log(`   作者ID: ${targetNovel.author || targetNovel.userId || 'N/A'}`);
    console.log(`   字数: ${targetNovel.wordCount || 0}`);
    console.log(`   状态: ${targetNovel.status || 'N/A'}\n`);
    
    // 检查该小说的大纲
    const outlinesCollection = db.collection('outlines');
    const outlines = await outlinesCollection.find({ novelId: targetNovel._id }).toArray();
    
    console.log(`"${novelTitle}"小说的大纲内容:`);
    console.log(`   共有 ${outlines.length} 个大纲项\n`);
    
    if (outlines.length === 0) {
      console.log("该小说没有大纲内容。");
      return;
    }
    
    // 显示所有大纲项的完整信息
    console.log("所有大纲项的详细信息:");
    outlines.forEach((outline, index) => {
      console.log(`\n${index + 1}. [${outline.type || 'N/A'}] ${outline.title || 'N/A'}`);
      console.log(`   ID: ${outline._id}`);
      console.log(`   小说ID: ${outline.novelId}`);
      console.log(`   父级ID: ${outline.parentId || 'N/A'}`);
      console.log(`   顺序: ${outline.order || 0}`);
      console.log(`   摘要: ${outline.summary || 'N/A'}`);
      console.log(`   创建时间: ${outline.createdAt ? outline.createdAt : 'N/A'}`);
      console.log(`   最后修改: ${outline.lastModified ? outline.lastModified : 'N/A'}`);
      
      // 显示所有字段
      Object.keys(outline).forEach(key => {
        if (!['type', 'title', '_id', 'novelId', 'parentId', 'order', 'summary', 'createdAt', 'lastModified'].includes(key)) {
          console.log(`   ${key}: ${typeof outline[key] === 'object' ? JSON.stringify(outline[key]) : outline[key]}`);
        }
      });
      
      // 特别显示内容字段
      if (outline.content) {
        console.log(`   内容 (${outline.content.length} 字符):`);
        if (outline.content.length > 500) {
          console.log(`   ${outline.content.substring(0, 500)}...`);
          console.log(`   ... (内容过长，已截断)`);
        } else {
          console.log(`   ${outline.content}`);
        }
      }
    });
    
  } catch (error) {
    console.error("❌ 检查大纲内容过程中发生错误:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\n🔒 数据库连接已关闭");
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const novelTitle = args[0] || '天命大秦';
  
  try {
    await checkOutlineDetails(novelTitle);
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
  checkOutlineDetails
};