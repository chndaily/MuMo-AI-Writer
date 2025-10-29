import { databaseManager } from '@/services';
import { hybridStorageService } from '@/services/hybridStorageService';
import { apiService } from '@/services/apiService';
import { eventBus } from '@/utils/eventBus';
import { useMembershipStore } from '@/stores/membershipStore';
import { Novel, Character, Location, NovelOutline, WorldSetting } from '#/novel';
import { ErrorHandler, createSyncError, createNetworkError } from '@/utils/errorHandler';

/**
 * 优化的数据同步服务
 * 提供更高效的批量操作、智能缓存机制和完善的错误处理
 */
class OptimizedDataSyncService {
  // 请求缓存
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存时间

  // 批次大小配置
  private batchSize = 50;
  private maxRetries = 3;

  // 同步状态
  private isSyncing = false;
  private lastSyncTime: number | null = null;

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      online: navigator.onLine
    };
  }

  /**
   * 动态调整批次大小
   */
  setBatchSize(size: number): void {
    this.batchSize = Math.max(10, Math.min(200, size)); // 限制在10-200之间
  }

  /**
   * 带缓存的API请求
   */
  private async cachedApiRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const cached = this.requestCache.get(key);
    const now = Date.now();

    // 检查缓存是否有效
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    // 执行请求并缓存结果
    try {
      const data = await requestFn();
      this.requestCache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // 如果请求失败但有缓存数据，返回缓存数据
      if (cached) {
        console.warn(`API请求失败，使用缓存数据: ${key}`, error);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * 带重试机制的API调用
   */
  private async retryableApiCall<T>(call: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (retries > 0) {
        console.warn(`API调用失败，${retries}次重试机会`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (this.maxRetries - retries + 1))); // 递增延迟
        return this.retryableApiCall(call, retries - 1);
      }
      throw error;
    }
  }

  /**
   * 触发同步
   */
  triggerSync() {
    // 触发同步事件
    eventBus.emit('syncTriggered');
  }

  /**
   * 同步所有数据
   */
  async syncAllData(): Promise<{ success: boolean; message: string }> {
    console.log('Starting data sync, current auth state:', {
      isAuthenticated: useMembershipStore.getState().isAuthenticated,
      authToken: useMembershipStore.getState().authToken
    });
    
    if (this.isSyncing) {
      return { success: false, message: '同步正在进行中' };
    }

    this.isSyncing = true;
    eventBus.emit('syncStarted');

    try {
      // 同步小说数据
      await this.syncNovels();
      
      // 检查同步过程中的认证状态
      console.log('After novels sync, auth state:', {
        isAuthenticated: useMembershipStore.getState().isAuthenticated,
        authToken: useMembershipStore.getState().authToken
      });
      
      // 同步角色数据
      await this.syncCharacters();
      
      // 检查同步过程中的认证状态
      console.log('After characters sync, auth state:', {
        isAuthenticated: useMembershipStore.getState().isAuthenticated,
        authToken: useMembershipStore.getState().authToken
      });
      
      // 同步地点数据
      await this.syncLocations();
      
      // 同步大纲数据
      await this.syncOutlines();
      
      // 同步世界观设定数据
      await this.syncWorldSettings();
      
      // 更新最后同步时间
      this.lastSyncTime = Date.now();
      
      eventBus.emit('syncCompleted', { success: true });
      
      console.log('Data sync completed, final auth state:', {
        isAuthenticated: useMembershipStore.getState().isAuthenticated,
        authToken: useMembershipStore.getState().authToken
      });
      
      return { success: true, message: '数据同步完成' };
    } catch (error) {
      const syncError = createSyncError(error, '全部数据');
      ErrorHandler.logError(syncError, '数据同步失败');
      eventBus.emit('syncCompleted', { success: false, error: syncError.message });
      return { 
        success: false, 
        message: `数据同步失败: ${ErrorHandler.formatError(syncError)}` 
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 同步小说数据
   */
  private async syncNovels() {
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';
      
      // 获取本地当前用户的小说
      const localNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
      
      // 获取远程当前用户的小说（带缓存和重试机制）
      const remoteNovels = await this.retryableApiCall(() => 
        this.cachedApiRequest(`novels_${currentUserId}`, () => 
          apiService.novels.getCurrentUserNovels(currentUserId)
        )
      );
      
      // 合并数据 - 本地优先策略
      const novelsToCreate: Novel[] = [];
      const novelsToUpdate: Novel[] = [];
      
      // 检查远程有但本地没有的小说，添加到本地
      for (const remoteNovel of remoteNovels) {
        const localNovel = localNovels.find(n => n.id === remoteNovel.id);
        
        if (!localNovel) {
          // 远程有但本地没有，添加到本地
          novelsToCreate.push(remoteNovel);
        } else if (new Date(remoteNovel.lastModified) > new Date(localNovel.lastModified)) {
          // 远程版本更新，更新本地
          novelsToUpdate.push(remoteNovel);
        }
      }
      
      // 检查本地有但远程没有的小说，上传到远程
      for (const localNovel of localNovels) {
        const remoteNovel = remoteNovels.find(n => n.id === localNovel.id);
        
        if (!remoteNovel) {
          // 本地有但远程没有，上传到远程（带重试机制）
          try {
            await this.retryableApiCall(() => 
              apiService.novels.createNovel(localNovel)
            );
          } catch (error) {
            const syncError = createSyncError(error, '上传小说');
            ErrorHandler.logError(syncError, `上传小说失败: ${localNovel.title}`);
            throw syncError;
          }
        } else if (new Date(localNovel.lastModified) > new Date(remoteNovel.lastModified)) {
          // 本地版本更新，更新远程（带重试机制）
          try {
            await this.retryableApiCall(() => 
              apiService.novels.updateNovel(localNovel.id, localNovel)
            );
          } catch (error) {
            const syncError = createSyncError(error, '更新小说');
            ErrorHandler.logError(syncError, `更新小说失败: ${localNovel.title}`);
            throw syncError;
          }
        }
      }
      
      // 批量保存新小说到本地
      if (novelsToCreate.length > 0) {
        await this.batchSaveNovels(novelsToCreate);
      }
      
      // 批量更新本地小说
      if (novelsToUpdate.length > 0) {
        await this.batchUpdateNovels(novelsToUpdate);
      }
      
      console.log(`小说数据同步完成: ${localNovels.length} 本本地小说, ${remoteNovels.length} 本远程小说`);
    } catch (error) {
      const syncError = createSyncError(error, '小说数据');
      ErrorHandler.logError(syncError, '同步小说数据失败');
      throw syncError;
    }
  }

  /**
   * 批量保存小说
   */
  private async batchSaveNovels(novels: Novel[]): Promise<void> {
    // 分批处理
    for (let i = 0; i < novels.length; i += this.batchSize) {
      const batch = novels.slice(i, i + this.batchSize);
      
      // 并行保存到本地
      const localSavePromises = batch.map(novel => 
        databaseManager.novels.addNovel(novel)
      );
      
      try {
        await Promise.all(localSavePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, '保存小说');
        ErrorHandler.logError(dbError, '本地保存小说批次失败');
        throw dbError;
      }
    }
  }

  /**
   * 批量更新小说
   */
  private async batchUpdateNovels(novels: Novel[]): Promise<void> {
    // 分批处理
    for (let i = 0; i < novels.length; i += this.batchSize) {
      const batch = novels.slice(i, i + this.batchSize);
      
      // 并行更新到本地
      const localUpdatePromises = batch.map(novel => 
        databaseManager.novels.updateNovel(novel)
      );
      
      try {
        await Promise.all(localUpdatePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, '更新小说');
        ErrorHandler.logError(dbError, '本地更新小说批次失败');
        throw dbError;
      }
    }
  }

  /**
   * 同步角色数据
   */
  private async syncCharacters() {
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';
      
      // 获取本地所有小说
      const localNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
      
      // 遍历每本小说同步角色
      for (const novel of localNovels) {
        // 获取本地角色
        const localCharacters = await databaseManager.characters.getCharactersByNovelId(novel.id);
        
        // 获取远程角色（带缓存和重试机制）
        const remoteCharacters = await this.retryableApiCall(() => 
          this.cachedApiRequest(`characters_${novel.id}`, () => 
            apiService.characters.getCharactersByNovelId(novel.id)
          )
        );
        
        // 合并数据 - 本地优先策略
        const charactersToCreate: Character[] = [];
        const charactersToUpdate: Character[] = [];
        
        // 检查远程有但本地没有的角色，添加到本地
        for (const remoteCharacter of remoteCharacters) {
          const localCharacter = localCharacters.find(c => c.id === remoteCharacter.id);
          
          if (!localCharacter) {
            // 远程有但本地没有，添加到本地
            charactersToCreate.push(remoteCharacter);
          } else if (new Date(remoteCharacter.lastModified) > new Date(localCharacter.lastModified)) {
            // 远程版本更新，更新本地
            charactersToUpdate.push(remoteCharacter);
          }
        }
        
        // 检查本地有但远程没有的角色，上传到远程
        for (const localCharacter of localCharacters) {
          const remoteCharacter = remoteCharacters.find(c => c.id === localCharacter.id);
          
          if (!remoteCharacter) {
            // 本地有但远程没有，上传到远程（带重试机制）
            try {
              await this.retryableApiCall(() => 
                apiService.characters.createCharacter(localCharacter)
              );
            } catch (error) {
              const syncError = createSyncError(error, '上传角色');
              ErrorHandler.logError(syncError, `上传角色失败: ${localCharacter.name}`);
              throw syncError;
            }
          } else if (new Date(localCharacter.lastModified) > new Date(remoteCharacter.lastModified)) {
            // 本地版本更新，更新远程（带重试机制）
            try {
              await this.retryableApiCall(() => 
                apiService.characters.updateCharacter(localCharacter.id, localCharacter)
              );
            } catch (error) {
              const syncError = createSyncError(error, '更新角色');
              ErrorHandler.logError(syncError, `更新角色失败: ${localCharacter.name}`);
              throw syncError;
            }
          }
        }
        
        // 批量保存新角色到本地
        if (charactersToCreate.length > 0) {
          await this.batchSaveCharacters(charactersToCreate);
        }
        
        // 批量更新本地角色
        if (charactersToUpdate.length > 0) {
          await this.batchUpdateCharacters(charactersToUpdate);
        }
      }
      
      console.log('角色数据同步完成');
    } catch (error) {
      const syncError = createSyncError(error, '角色数据');
      ErrorHandler.logError(syncError, '同步角色数据失败');
      throw syncError;
    }
  }

  /**
   * 批量保存角色
   */
  private async batchSaveCharacters(characters: Character[]): Promise<void> {
    // 分批处理
    for (let i = 0; i < characters.length; i += this.batchSize) {
      const batch = characters.slice(i, i + this.batchSize);
      
      // 并行保存到本地
      const localSavePromises = batch.map(character => 
        databaseManager.characters.addCharacter(character)
      );
      
      try {
        await Promise.all(localSavePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, '保存角色');
        ErrorHandler.logError(dbError, '本地保存角色批次失败');
        throw dbError;
      }
    }
  }

  /**
   * 批量更新角色
   */
  private async batchUpdateCharacters(characters: Character[]): Promise<void> {
    // 分批处理
    for (let i = 0; i < characters.length; i += this.batchSize) {
      const batch = characters.slice(i, i + this.batchSize);
      
      // 并行更新到本地
      const localUpdatePromises = batch.map(character => 
        databaseManager.characters.updateCharacter(character)
      );
      
      try {
        await Promise.all(localUpdatePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, '更新角色');
        ErrorHandler.logError(dbError, '本地更新角色批次失败');
        throw dbError;
      }
    }
  }

  /**
   * 同步地点数据
   */
  private async syncLocations() {
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';
      
      // 获取本地所有小说
      const localNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
      
      // 遍历每本小说同步地点
      for (const novel of localNovels) {
        // 获取本地地点
        const localLocations = await databaseManager.locations.getLocationsByNovelId(novel.id);
        
        // 获取远程地点（带缓存和重试机制）
        const remoteLocations = await this.retryableApiCall(() => 
          this.cachedApiRequest(`locations_${novel.id}`, () => 
            apiService.locations.getLocationsByNovelId(novel.id)
          )
        );
        
        // 合并数据 - 本地优先策略
        const locationsToCreate: Location[] = [];
        const locationsToUpdate: Location[] = [];
        
        // 检查远程有但本地没有的地点，添加到本地
        for (const remoteLocation of remoteLocations) {
          const localLocation = localLocations.find(l => l.id === remoteLocation.id);
          
          if (!localLocation) {
            // 远程有但本地没有，添加到本地
            locationsToCreate.push(remoteLocation);
          } else if (new Date(remoteLocation.lastModified) > new Date(localLocation.lastModified)) {
            // 远程版本更新，更新本地
            locationsToUpdate.push(remoteLocation);
          }
        }
        
        // 检查本地有但远程没有的地点，上传到远程
        for (const localLocation of localLocations) {
          const remoteLocation = remoteLocations.find(l => l.id === localLocation.id);
          
          if (!remoteLocation) {
            // 本地有但远程没有，上传到远程（带重试机制）
            try {
              await this.retryableApiCall(() => 
                apiService.locations.createLocation(localLocation)
              );
            } catch (error) {
              const syncError = createSyncError(error, '上传地点');
              ErrorHandler.logError(syncError, `上传地点失败: ${localLocation.name}`);
              throw syncError;
            }
          } else if (new Date(localLocation.lastModified) > new Date(remoteLocation.lastModified)) {
            // 本地版本更新，更新远程（带重试机制）
            try {
              await this.retryableApiCall(() => 
                apiService.locations.updateLocation(localLocation.id, localLocation)
              );
            } catch (error) {
              const syncError = createSyncError(error, '更新地点');
              ErrorHandler.logError(syncError, `更新地点失败: ${localLocation.name}`);
              throw syncError;
            }
          }
        }
        
        // 批量保存新地点到本地
        if (locationsToCreate.length > 0) {
          await this.batchSaveLocations(locationsToCreate);
        }
        
        // 批量更新本地地点
        if (locationsToUpdate.length > 0) {
          await this.batchUpdateLocations(locationsToUpdate);
        }
      }
      
      console.log('地点数据同步完成');
    } catch (error) {
      const syncError = createSyncError(error, '地点数据');
      ErrorHandler.logError(syncError, '同步地点数据失败');
      throw syncError;
    }
  }

  /**
   * 批量保存地点
   */
  private async batchSaveLocations(locations: Location[]): Promise<void> {
    // 分批处理
    for (let i = 0; i < locations.length; i += this.batchSize) {
      const batch = locations.slice(i, i + this.batchSize);
      
      // 并行保存到本地
      const localSavePromises = batch.map(location => 
        databaseManager.locations.addLocation(location)
      );
      
      try {
        await Promise.all(localSavePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, '保存地点');
        ErrorHandler.logError(dbError, '本地保存地点批次失败');
        throw dbError;
      }
    }
  }

  /**
   * 批量更新地点
   */
  private async batchUpdateLocations(locations: Location[]): Promise<void> {
    // 分批处理
    for (let i = 0; i < locations.length; i += this.batchSize) {
      const batch = locations.slice(i, i + this.batchSize);
      
      // 并行更新到本地
      const localUpdatePromises = batch.map(location => 
        databaseManager.locations.updateLocation(location)
      );
      
      try {
        await Promise.all(localUpdatePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, '更新地点');
        ErrorHandler.logError(dbError, '本地更新地点批次失败');
        throw dbError;
      }
    }
  }

  /**
   * 同步大纲数据
   */
  private async syncOutlines() {
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';
      
      // 获取本地所有小说
      const localNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
      
      // 遍历每本小说同步大纲
      for (const novel of localNovels) {
        // 获取本地大纲
        const localOutlines = await databaseManager.outlines.getOutlinesByNovelId(novel.id);
        
        // 获取远程大纲（带缓存和重试机制）
        const remoteOutlines = await this.retryableApiCall(() => 
          this.cachedApiRequest(`outlines_${novel.id}`, () => 
            apiService.outlines.getOutlinesByNovelId(novel.id)
          )
        );
        
        // 合并数据 - 本地优先策略
        const outlinesToCreate: NovelOutline[] = [];
        const outlinesToUpdate: NovelOutline[] = [];
        
        // 检查远程有但本地没有的大纲，添加到本地
        for (const remoteOutline of remoteOutlines) {
          const localOutline = localOutlines.find(o => o.id === remoteOutline.id);
          
          if (!localOutline) {
            // 远程有但本地没有，添加到本地
            outlinesToCreate.push(remoteOutline);
          } else if (new Date(remoteOutline.lastModified) > new Date(localOutline.lastModified)) {
            // 远程版本更新，更新本地
            outlinesToUpdate.push(remoteOutline);
          }
        }
        
        // 检查本地有但远程没有的大纲，上传到远程
        for (const localOutline of localOutlines) {
          const remoteOutline = remoteOutlines.find(o => o.id === localOutline.id);
          
          if (!remoteOutline) {
            // 本地有但远程没有，上传到远程（带重试机制）
            try {
              await this.retryableApiCall(() => 
                apiService.outlines.createOutline(localOutline)
              );
            } catch (error) {
              const syncError = createSyncError(error, '上传大纲');
              ErrorHandler.logError(syncError, `上传大纲失败: ${localOutline.title}`);
              throw syncError;
            }
          } else if (new Date(localOutline.lastModified) > new Date(remoteOutline.lastModified)) {
            // 本地版本更新，更新远程（带重试机制）
            try {
              await this.retryableApiCall(() => 
                apiService.outlines.updateOutline(localOutline.id, localOutline)
              );
            } catch (error) {
              const syncError = createSyncError(error, '更新大纲');
              ErrorHandler.logError(syncError, `更新大纲失败: ${localOutline.title}`);
              throw syncError;
            }
          }
        }
        
        // 批量保存新大纲到本地
        if (outlinesToCreate.length > 0) {
          await this.batchSaveOutlines(outlinesToCreate);
        }
        
        // 批量更新本地大纲
        if (outlinesToUpdate.length > 0) {
          await this.batchUpdateOutlines(outlinesToUpdate);
        }
      }
      
      console.log('大纲数据同步完成');
    } catch (error) {
      const syncError = createSyncError(error, '大纲数据');
      ErrorHandler.logError(syncError, '同步大纲数据失败');
      throw syncError;
    }
  }

  /**
   * 批量保存大纲
   */
  private async batchSaveOutlines(outlines: NovelOutline[]): Promise<void> {
    // 分批处理
    for (let i = 0; i < outlines.length; i += this.batchSize) {
      const batch = outlines.slice(i, i + this.batchSize);
      
      // 并行保存到本地
      const localSavePromises = batch.map(outline => 
        databaseManager.outlines.addOutline(outline)
      );
      
      try {
        await Promise.all(localSavePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, '保存大纲');
        ErrorHandler.logError(dbError, '本地保存大纲批次失败');
        throw dbError;
      }
    }
  }

  /**
   * 批量更新大纲
   */
  private async batchUpdateOutlines(outlines: NovelOutline[]): Promise<void> {
    // 分批处理
    for (let i = 0; i < outlines.length; i += this.batchSize) {
      const batch = outlines.slice(i, i + this.batchSize);
      
      // 并行更新到本地
      const localUpdatePromises = batch.map(outline => 
        databaseManager.outlines.updateOutline(outline)
      );
      
      try {
        await Promise.all(localUpdatePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, '更新大纲');
        ErrorHandler.logError(dbError, '本地更新大纲批次失败');
        throw dbError;
      }
    }
  }

  /**
   * 同步世界观设定数据
   */
  private async syncWorldSettings() {
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';
      
      // 获取本地所有小说
      const localNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
      
      // 定义世界观设定类型
      const settingTypes = ['culture', 'technology', 'magic', 'history'];
      
      // 遍历每本小说和每种设定类型同步数据
      for (const novel of localNovels) {
        for (const type of settingTypes) {
          // 获取本地世界观设定
          const localSettings = await databaseManager.worldSettings.getWorldSettingsByNovelId(novel.id, type as any);
          
          // 获取远程世界观设定（带缓存和重试机制）
          const remoteSettings = await this.retryableApiCall(() => 
            this.cachedApiRequest(`worldSettings_${novel.id}_${type}`, () => 
              apiService.worldSettings.getWorldSettingsByNovelId(novel.id, type)
            )
          );
          
          // 合并数据 - 本地优先策略
          const settingsToCreate: WorldSetting[] = [];
          const settingsToUpdate: WorldSetting[] = [];
          
          // 检查远程有但本地没有的设定，添加到本地
          for (const remoteSetting of remoteSettings) {
            const localSetting = localSettings.find(s => s.id === remoteSetting.id);
            
            if (!localSetting) {
              // 远程有但本地没有，添加到本地
              settingsToCreate.push(remoteSetting);
            } else if (new Date(remoteSetting.lastModified) > new Date(localSetting.lastModified)) {
              // 远程版本更新，更新本地
              settingsToUpdate.push(remoteSetting);
            }
          }
          
          // 检查本地有但远程没有的设定，上传到远程
          for (const localSetting of localSettings) {
            const remoteSetting = remoteSettings.find(s => s.id === localSetting.id);
            
            if (!remoteSetting) {
              // 本地有但远程没有，上传到远程（带重试机制）
              try {
                await this.retryableApiCall(() => 
                  apiService.worldSettings.createWorldSetting(localSetting)
                );
              } catch (error) {
                const syncError = createSyncError(error, `上传${type}设定`);
                ErrorHandler.logError(syncError, `上传${type}设定失败: ${localSetting.name}`);
                throw syncError;
              }
            } else if (new Date(localSetting.lastModified) > new Date(remoteSetting.lastModified)) {
              // 本地版本更新，更新远程（带重试机制）
              try {
                await this.retryableApiCall(() => 
                  apiService.worldSettings.updateWorldSetting(localSetting.id, localSetting)
                );
              } catch (error) {
                const syncError = createSyncError(error, `更新${type}设定`);
                ErrorHandler.logError(syncError, `更新${type}设定失败: ${localSetting.name}`);
                throw syncError;
              }
            }
          }
          
          // 批量保存新设定到本地
          if (settingsToCreate.length > 0) {
            await this.batchSaveWorldSettings(settingsToCreate, type as any);
          }
          
          // 批量更新本地设定
          if (settingsToUpdate.length > 0) {
            await this.batchUpdateWorldSettings(settingsToUpdate, type as any);
          }
        }
      }
      
      console.log('世界观设定数据同步完成');
    } catch (error) {
      const syncError = createSyncError(error, '世界观设定数据');
      ErrorHandler.logError(syncError, '同步世界观设定数据失败');
      throw syncError;
    }
  }

  /**
   * 批量保存世界观设定
   */
  private async batchSaveWorldSettings(settings: WorldSetting[], type: 'culture' | 'technology' | 'magic' | 'history'): Promise<void> {
    // 分批处理
    for (let i = 0; i < settings.length; i += this.batchSize) {
      const batch = settings.slice(i, i + this.batchSize);
      
      // 并行保存到本地
      const localSavePromises = batch.map(setting => 
        databaseManager.worldSettings.addWorldSetting(setting, type)
      );
      
      try {
        await Promise.all(localSavePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, `保存${type}设定`);
        ErrorHandler.logError(dbError, `本地保存${type}设定批次失败`);
        throw dbError;
      }
    }
  }

  /**
   * 批量更新世界观设定
   */
  private async batchUpdateWorldSettings(settings: WorldSetting[], type: 'culture' | 'technology' | 'magic' | 'history'): Promise<void> {
    // 分批处理
    for (let i = 0; i < settings.length; i += this.batchSize) {
      const batch = settings.slice(i, i + this.batchSize);
      
      // 并行更新到本地
      const localUpdatePromises = batch.map(setting => 
        databaseManager.worldSettings.updateWorldSetting(setting, type)
      );
      
      try {
        await Promise.all(localUpdatePromises);
      } catch (error) {
        const dbError = ErrorHandler.createDatabaseError(error, `更新${type}设定`);
        ErrorHandler.logError(dbError, `本地更新${type}设定批次失败`);
        throw dbError;
      }
    }
  }

  /**
   * 清理过期缓存
   */
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.requestCache.entries()) {
      if ((now - value.timestamp) >= this.CACHE_TTL) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.requestCache.clear();
  }
}

// 创建优化的数据同步服务实例
export const optimizedDataSyncService = new OptimizedDataSyncService();