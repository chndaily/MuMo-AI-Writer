#!/usr/bin/env node

const { MongoClient } = require('mongodb');

// 远程MongoDB连接配置（从user-management.cjs中获取）
const REMOTE_MONGO_URI = "mongodb+srv://mumo_db_user:QEbsvb7lBJm51kOG@cluster0.lq7412x.mongodb.net/mumo-ai-writer?appName=Cluster0";
const DB_NAME = "mumo-ai-writer";

/**
 * 检查远程数据库中的小说和大纲信息
 */
async function checkRemoteDatabase() {
  const client = new MongoClient(REMOTE_MONGO_URI);
  
  try {
    // 连接到远程MongoDB
    await client.connect();
    console.log("成功连接到远程MongoDB Atlas!");
    
    const db = client.db(DB_NAME);
    
    // 获取所有小说
    const novelsCollection = db.collection('novels');
    const novels = await novelsCollection.find({}).toArray();
    
    console.log(`\n📚 远程数据库中共有 ${novels.length} 本小说:\n`);
    
    // 查找"天命大秦"小说
    const tianmingNovel = novels.find(novel => novel.title === '天命大秦');
    
    if (tianmingNovel) {
      console.log(`找到了"天命大秦"小说:`);
      console.log(`   ID: ${tianmingNovel._id}`);
      console.log(`   作者ID: ${tianmingNovel.author || tianmingNovel.userId || 'N/A'}`);
      console.log(`   字数: ${tianmingNovel.wordCount || 0}`);
      console.log(`   状态: ${tianmingNovel.status || 'N/A'}`);
      console.log(`   创建时间: ${tianmingNovel.createdAt ? tianmingNovel.createdAt : 'N/A'}\n`);
      
      // 检查该小说的大纲
      const outlinesCollection = db.collection('outlines');
      const outlines = await outlinesCollection.find({ novelId: tianmingNovel._id }).toArray();
      
      console.log(`"天命大秦"小说的大纲内容:`);
      console.log(`   共有 ${outlines.length} 个大纲项\n`);
      
      if (outlines.length > 0) {
        // 按顺序排序
        outlines.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        outlines.forEach((outline, index) => {
          console.log(`${index + 1}. [${outline.type || 'N/A'}] ${outline.title || 'N/A'}`);
          console.log(`   ID: ${outline._id}`);
          console.log(`   父级ID: ${outline.parentId || 'N/A'}`);
          console.log(`   顺序: ${outline.order || 0}`);
          if (outline.content) {
            console.log(`   内容长度: ${outline.content.length} 字符`);
            if (outline.content.length > 200) {
              console.log(`   内容预览: ${outline.content.substring(0, 200)}...`);
            } else {
              console.log(`   内容: ${outline.content}`);
            }
          }
          if (outline.summary) {
            console.log(`   摘要: ${outline.summary}`);
          }
          console.log(`   创建时间: ${outline.createdAt ? outline.createdAt : 'N/A'}`);
          console.log(`   最后修改: ${outline.lastModified ? outline.lastModified : 'N/A'}\n`);
        });
      } else {
        console.log("该小说没有大纲内容。");
      }
      
      // 检查是否有章节类型的大纲
      const chapterOutlines = outlines.filter(outline => outline.type === 'chapter');
      if (chapterOutlines.length > 0) {
        console.log(`章节类型大纲数量: ${chapterOutlines.length}`);
        // 显示前几个章节的标题
        chapterOutlines.slice(0, 5).forEach((chapter, index) => {
          console.log(`   ${index + 1}. ${chapter.title || 'N/A'}`);
        });
        if (chapterOutlines.length > 5) {
          console.log(`   ... 还有 ${chapterOutlines.length - 5} 个章节`);
        }
      } else {
        console.log("没有找到章节类型的大纲。");
      }
      
      // 检查该小说的其他相关内容
      console.log("\n检查相关数据:");
      
      // 检查角色
      try {
        const charactersCollection = db.collection('characters');
        const characters = await charactersCollection.find({ novelId: tianmingNovel._id }).toArray();
        console.log(`   角色数量: ${characters.length}`);
        if (characters.length > 0) {
          console.log(`   前10个角色:`);
          characters.slice(0, 10).forEach((character, index) => {
            console.log(`     ${index + 1}. ${character.name || 'N/A'}`);
          });
          if (characters.length > 10) {
            console.log(`     ... 还有 ${characters.length - 10} 个角色`);
          }
        }
      } catch (error) {
        console.log("   角色数据检查失败:", error.message);
      }
      
      // 检查地点
      try {
        const locationsCollection = db.collection('locations');
        const locations = await locationsCollection.find({ novelId: tianmingNovel._id }).toArray();
        console.log(`   地点数量: ${locations.length}`);
        if (locations.length > 0) {
          console.log(`   前10个地点:`);
          locations.slice(0, 10).forEach((location, index) => {
            console.log(`     ${index + 1}. ${location.name || 'N/A'}`);
          });
          if (locations.length > 10) {
            console.log(`     ... 还有 ${locations.length - 10} 个地点`);
          }
        }
      } catch (error) {
        console.log("   地点数据检查失败:", error.message);
      }
      
      // 检查世界观设定
      try {
        const worldSettingsCollection = db.collection('worldSettings');
        const worldSettings = await worldSettingsCollection.find({ novelId: tianmingNovel._id }).toArray();
        console.log(`   世界观设定数量: ${worldSettings.length}`);
        // 按类型统计
        const typeCount = {};
        worldSettings.forEach(setting => {
          const type = setting.type || 'unknown';
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
        console.log(`   世界观设定类型统计:`);
        Object.keys(typeCount).forEach(type => {
          console.log(`     ${type}: ${typeCount[type]} 个`);
        });
        
        // 显示前几个文化设定
        const cultureSettings = worldSettings.filter(setting => setting.type === 'culture');
        if (cultureSettings.length > 0) {
          console.log(`   前5个文化设定:`);
          cultureSettings.slice(0, 5).forEach((setting, index) => {
            console.log(`     ${index + 1}. ${setting.name || 'N/A'}`);
          });
        }
      } catch (error) {
        console.log("   世界观设定数据检查失败:", error.message);
      }
    } else {
      console.log("未找到标题为'天命大秦'的小说。");
      
      // 列出所有小说标题供参考
      novels.forEach((novel, index) => {
        console.log(`${index + 1}. ${novel.title || 'N/A'} (${novel._id})`);
      });
    }
    
  } catch (error) {
    console.error("❌ 检查远程数据库过程中发生错误:", error);
    throw error;
  } finally {
    await client.close();
    console.log("🔒 数据库连接已关闭");
  }
}

// 命令行接口
async function main() {
  try {
    await checkRemoteDatabase();
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
  checkRemoteDatabase
};