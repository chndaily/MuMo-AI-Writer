export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatHistory {
  novelId: string;
  messages: Message[];
  lastModified: string;
}

export class ChatStore {
  private db: IDBDatabase | null = null;

  constructor(db: IDBDatabase | null) {
    this.db = db;
  }

  setDatabase(db: IDBDatabase) {
    this.db = db;
  }

  /**
   * 保存聊天记录
   */
  async saveChatHistory(novelId: string, messages: Message[]): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const transaction = this.db.transaction(['chatHistory'], 'readwrite');
    const store = transaction.objectStore('chatHistory');
    
    const chatHistory: ChatHistory = {
      novelId,
      messages,
      lastModified: new Date().toISOString()
    };

    await store.put(chatHistory);
  }

  /**
   * 获取聊天记录
   */
  async getChatHistory(novelId: string): Promise<ChatHistory | null> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const transaction = this.db.transaction(['chatHistory'], 'readonly');
    const store = transaction.objectStore('chatHistory');
    
    const request = store.get(novelId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 清空聊天记录
   */
  async clearChatHistory(novelId: string): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const transaction = this.db.transaction(['chatHistory'], 'readwrite');
    const store = transaction.objectStore('chatHistory');
    
    await store.delete(novelId);
  }

  /**
   * 清空所有聊天记录
   */
  async clearAllChatHistory(): Promise<void> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }

    const transaction = this.db.transaction(['chatHistory'], 'readwrite');
    const store = transaction.objectStore('chatHistory');
    
    await store.clear();
  }
}