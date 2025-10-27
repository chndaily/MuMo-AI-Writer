/**
 * IndexedDB 存储工具，用于存储大型附件内容
 */
class IndexedDBStorage {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null;

  constructor(dbName: string = 'TaotaoWriting', storeName: string = 'attachments') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * 保存附件内容
   * @param id 附件ID
   * @param content 附件内容
   */
  async saveAttachment(id: string, content: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ id, content });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save attachment to IndexedDB'));
      };
    });
  }

  /**
   * 获取附件内容
   * @param id 附件ID
   */
  async getAttachment(id: string): Promise<string | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.content : null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get attachment from IndexedDB'));
      };
    });
  }

  /**
   * 删除附件内容
   * @param id 附件ID
   */
  async deleteAttachment(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete attachment from IndexedDB'));
      };
    });
  }

  /**
   * 清空所有附件内容
   */
  async clearAttachments(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear attachments from IndexedDB'));
      };
    });
  }
}

// 创建单例实例
export const indexedDBStorage = new IndexedDBStorage();