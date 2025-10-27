import { Novel, Chapter, NovelGenre, NovelTag, NovelOutline, Character, WritingStats } from '#/novel'

/**
 * 基础存储模块
 * 提供通用的CRUD操作方法
 */
export abstract class BaseStore<T> {
  protected db: IDBDatabase | null = null
  protected storeName: string

  constructor(db: IDBDatabase | null, storeName: string) {
    this.db = db
    this.storeName = storeName
  }

  /**
   * 设置数据库连接
   */
  setDatabase(db: IDBDatabase): void {
    this.db = db
  }

  /**
   * 添加数据
   */
  protected async add(data: T): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    return new Promise((resolve, reject) => {
      try {
        console.log(`尝试在存储 ${this.storeName} 中添加数据`);
        const transaction = this.db!.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.add(data)

        request.onsuccess = () => {
          console.log(`成功在存储 ${this.storeName} 中添加数据`);
          resolve()
        }
        request.onerror = () => {
          const errorMsg = `在存储 ${this.storeName} 中添加数据失败: ${request.error?.message || '未知错误'}`;
          console.error(errorMsg);
          reject(new Error(errorMsg))
        }
      } catch (error) {
        const errorMsg = `在存储 ${this.storeName} 中添加数据时发生异常: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        reject(new Error(errorMsg))
      }
    })
  }

  /**
   * 更新数据
   */
  protected async update(data: T): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    return new Promise((resolve, reject) => {
      try {
        console.log(`尝试在存储 ${this.storeName} 中更新数据`);
        const transaction = this.db!.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.put(data)

        request.onsuccess = () => {
          console.log(`成功在存储 ${this.storeName} 中更新数据`);
          resolve()
        }
        request.onerror = () => {
          const errorMsg = `在存储 ${this.storeName} 中更新数据失败: ${request.error?.message || '未知错误'}`;
          console.error(errorMsg);
          reject(new Error(errorMsg))
        }
      } catch (error) {
        const errorMsg = `在存储 ${this.storeName} 中更新数据时发生异常: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        reject(new Error(errorMsg))
      }
    })
  }

  /**
   * 删除数据
   */
  protected async delete(id: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    return new Promise((resolve, reject) => {
      try {
        console.log(`尝试在存储 ${this.storeName} 中删除数据，ID: ${id}`);
        const transaction = this.db!.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.delete(id)

        request.onsuccess = () => {
          console.log(`成功在存储 ${this.storeName} 中删除数据`);
          resolve()
        }
        request.onerror = () => {
          const errorMsg = `在存储 ${this.storeName} 中删除数据失败: ${request.error?.message || '未知错误'}`;
          console.error(errorMsg);
          reject(new Error(errorMsg))
        }
      } catch (error) {
        const errorMsg = `在存储 ${this.storeName} 中删除数据时发生异常: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        reject(new Error(errorMsg))
      }
    })
  }

  /**
   * 根据ID获取数据
   */
  protected async get(id: string): Promise<T | undefined> {
    if (!this.db) throw new Error('数据库未初始化')

    return new Promise((resolve, reject) => {
      try {
        console.log(`尝试在存储 ${this.storeName} 中获取数据，ID: ${id}`);
        const transaction = this.db!.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.get(id)

        request.onsuccess = () => {
          console.log(`成功在存储 ${this.storeName} 中获取数据`);
          resolve(request.result)
        }
        request.onerror = () => {
          const errorMsg = `在存储 ${this.storeName} 中获取数据失败: ${request.error?.message || '未知错误'}`;
          console.error(errorMsg);
          reject(new Error(errorMsg))
        }
      } catch (error) {
        const errorMsg = `在存储 ${this.storeName} 中获取数据时发生异常: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        reject(new Error(errorMsg))
      }
    })
  }

  /**
   * 获取所有数据
   */
  protected async getAll(): Promise<T[]> {
    if (!this.db) throw new Error('数据库未初始化')

    return new Promise((resolve, reject) => {
      try {
        console.log(`尝试在存储 ${this.storeName} 中获取所有数据`);
        const transaction = this.db!.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.getAll()

        request.onsuccess = () => {
          console.log(`成功在存储 ${this.storeName} 中获取 ${request.result.length} 条数据`);
          resolve(request.result)
        }
        request.onerror = () => {
          const errorMsg = `在存储 ${this.storeName} 中获取所有数据失败: ${request.error?.message || '未知错误'}`;
          console.error(errorMsg);
          reject(new Error(errorMsg))
        }
      } catch (error) {
        const errorMsg = `在存储 ${this.storeName} 中获取所有数据时发生异常: ${error instanceof Error ? error.message : '未知错误'}`;
        console.error(errorMsg);
        reject(new Error(errorMsg))
      }
    })
  }

  /**
   * 根据索引获取数据
   */
  protected async getByIndex(indexName: string, value: any): Promise<T[]> {
    if (!this.db) {
      const error = new Error('数据库未初始化');
      console.error(error.message);
      throw error;
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`尝试在存储 ${this.storeName} 中通过索引 ${indexName} 获取数据，值: ${value}`);
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        // 检查索引是否存在
        if (!store.indexNames.contains(indexName)) {
          const error = new Error(`索引 ${indexName} 不存在于存储 ${this.storeName} 中`);
          console.error(error.message);
          reject(error);
          return;
        }
        
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => {
          console.log(`从 ${this.storeName} 的 ${indexName} 索引获取到 ${request.result.length} 条数据`);
          resolve(request.result);
        };
        request.onerror = () => {
          const error = new Error(`从 ${this.storeName} 获取数据失败: ${request.error?.message || '未知错误'}`);
          console.error(error.message);
          reject(error);
        };
      } catch (error) {
        console.error(`在 getByIndex 过程中发生错误:`, error);
        reject(error);
      }
    });
  }

  /**
   * 清空存储
   */
  protected async clear(): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 公共方法，供外部访问
  /**
   * 获取所有数据（公共方法）
   */
  async getAllData(): Promise<T[]> {
    return this.getAll()
  }

  /**
   * 清空存储（公共方法）
   */
  async clearData(): Promise<void> {
    return this.clear()
  }
} 