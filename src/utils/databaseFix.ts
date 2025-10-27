// 数据库修复工具

/**
 * 修复IndexedDB中的问题
 */
export async function fixIndexedDBIssues(): Promise<void> {
  const dbName = 'TaotaoWritingDB';
  const version = 10; // 确保使用最新的数据库版本
  
  return new Promise((resolve, reject) => {
    try {
      console.log(`=== 开始修复IndexedDB问题 ===`);
      console.log(`尝试打开数据库 ${dbName} 版本 ${version}`);
      
      // 打开数据库
      const request = indexedDB.open(dbName, version);
      
      request.onerror = function(event) {
        console.error('数据库打开失败:', request.error);
        reject(new Error(`数据库打开失败: ${request.error}`));
      };
      
      request.onsuccess = async function(event) {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('数据库打开成功');
        console.log('数据库版本:', db.version);
        console.log('对象存储列表:', Array.from(db.objectStoreNames));
        
        // 检查novels存储
        if (db.objectStoreNames.contains('novels')) {
          console.log('开始修复novels存储中的数据...');
          
          try {
            await fixNovelsData(db);
            console.log('=== IndexedDB修复完成 ===');
            resolve();
          } catch (error) {
            console.error('修复novels数据时出错:', error);
            reject(error);
          }
        } else {
          console.log('novels对象存储不存在');
          resolve();
        }
        
        db.close();
        console.log('数据库连接已关闭');
      };
      
      request.onupgradeneeded = function(event) {
        console.log('数据库需要升级');
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 确保novels存储存在并且有userId索引
        if (db.objectStoreNames.contains('novels')) {
          const transaction = (event.target as IDBOpenDBRequest).transaction;
          if (transaction) {
            const novelStore = transaction.objectStore('novels');
            if (!novelStore.indexNames.contains('userId')) {
              novelStore.createIndex('userId', 'userId', { unique: false });
              console.log('为novels对象存储添加userId索引');
            }
          }
        }
      };
    } catch (error) {
      console.error('执行修复时出错:', error);
      reject(error);
    }
  });
}

/**
 * 修复novels数据
 */
async function fixNovelsData(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['novels'], 'readwrite');
      const store = transaction.objectStore('novels');
      
      // 获取所有小说数据
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const novels = getAllRequest.result;
        console.log(`找到 ${novels.length} 本小说`);
        
        // 修复没有userId字段的小说
        let fixedCount = 0;
        novels.forEach(novel => {
          if (!novel.hasOwnProperty('userId') || novel.userId === undefined || novel.userId === null) {
            // 为没有userId的小说添加默认userId
            novel.userId = 'anonymous';
            const updateRequest = store.put(novel);
            updateRequest.onsuccess = function() {
              console.log(`修复小说 "${novel.title}" 的userId字段`);
              fixedCount++;
            };
            updateRequest.onerror = function(event) {
              console.error(`更新小说 "${novel.title}" 失败:`, (event.target as IDBRequest).error);
            };
          }
        });
        
        console.log(`共修复 ${fixedCount} 本小说的userId字段`);
      };
      
      getAllRequest.onerror = function(event) {
        console.error('获取小说数据失败:', (event.target as IDBRequest).error);
        reject(new Error(`获取小说数据失败: ${(event.target as IDBRequest).error}`));
      };
      
      transaction.oncomplete = function() {
        console.log('事务完成');
        resolve();
      };
      
      transaction.onerror = function(event) {
        console.error('事务失败:', (event.target as IDBTransaction).error);
        reject(new Error(`事务失败: ${(event.target as IDBTransaction).error}`));
      };
    } catch (error) {
      console.error('修复数据时出错:', error);
      reject(error);
    }
  });
}