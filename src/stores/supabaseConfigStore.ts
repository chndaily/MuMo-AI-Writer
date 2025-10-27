import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { databaseManager } from '@/services/index';
import { Novel, Character, NovelOutline } from '#/novel';
import { useMembershipStore } from '@/stores/membershipStore';

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
}

interface SupabaseConfigState {
  config: SupabaseConfig | null;
  isEnabled: boolean;
  connectionValid: boolean;
  lastSyncTime: string | null;
  syncInProgress: boolean;
  client: SupabaseClient | null;
  // 使用 number 类型替代 NodeJS.Timeout
  autoSyncTimer: number | null;
}

interface SupabaseConfigActions {
  // 配置管理
  updateConfig: (config: SupabaseConfig) => Promise<void>;
  testConnection: (config: SupabaseConfig) => Promise<{ success: boolean; error?: string }>;
  
  // 服务控制
  enableSupabase: () => Promise<void>;
  disableSupabase: () => Promise<void>;
  
  // 数据同步
  syncData: () => Promise<void>;
  syncNovels: () => Promise<void>;
  syncCharacters: () => Promise<void>;
  syncOutlines: () => Promise<void>;
  startAutoSync: () => void;
  stopAutoSync: () => void;
  
  // 数据统计
  getLocalDataCount: () => Promise<{ novels: number; characters: number; outlines: number }>;
  getCloudDataCount: () => Promise<{ novels: number; characters: number; outlines: number }>;
  
  // 初始化
  initializeSupabase: () => Promise<void>;
}

export const useSupabaseConfigStore = create<SupabaseConfigState & SupabaseConfigActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      config: null,
      isEnabled: false,
      connectionValid: false,
      lastSyncTime: null,
      syncInProgress: false,
      client: null,
      autoSyncTimer: null,

      // 更新配置
      updateConfig: async (config: SupabaseConfig) => {
        try {
          set({ config });
          
          // 如果启用了Supabase，创建客户端
          if (config.enabled) {
            const client = createClient(config.url, config.anonKey);
            set({ client, isEnabled: true });
            
            // 验证连接
            const { success } = await get().testConnection(config);
            set({ connectionValid: success });
            
            if (success) {
              // 初始化数据库表
              await get().initializeSupabase();
              
              // 开始自动同步
              if (config.autoSync) {
                get().startAutoSync();
              }
            }
          } else {
            set({ client: null, isEnabled: false, connectionValid: false });
            get().stopAutoSync();
          }
        } catch (error) {
          console.error('更新Supabase配置失败:', error);
          throw error;
        }
      },

      // 测试连接
      testConnection: async (config: SupabaseConfig) => {
        try {
          const testClient = createClient(config.url, config.anonKey);
          
          // 测试基本连接
          const { data, error } = await testClient
            .from('novels')
            .select('count')
            .limit(1);
          
          if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (acceptable)
            return { success: false, error: error.message };
          }
          
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : '连接测试失败' 
          };
        }
      },

      // 启用Supabase
      enableSupabase: async () => {
        const { config } = get();
        if (!config) throw new Error('Supabase配置不存在');
        
        const client = createClient(config.url, config.anonKey);
        set({ client, isEnabled: true });
        
        await get().initializeSupabase();
        await get().syncData();
        
        if (config.autoSync) {
          get().startAutoSync();
        }
      },

      // 禁用Supabase
      disableSupabase: async () => {
        set({ client: null, isEnabled: false, connectionValid: false });
        get().stopAutoSync();
      },

      // 初始化Supabase数据库
      initializeSupabase: async () => {
        const { client } = get();
        if (!client) return;

        try {
          // 注意：表创建已通过SQL脚本完成，这里不再调用不存在的RPC函数
          // 请确保已在Supabase SQL编辑器中执行了supabase-table-setup.sql脚本
          console.log('Supabase数据库表应已通过SQL脚本创建完成');
        } catch (error) {
          console.warn('数据库初始化检查:', error);
        }
      },

      // 数据同步
      syncData: async () => {
        const { client, isEnabled } = get();
        if (!client || !isEnabled) return;

        set({ syncInProgress: true });
        
        try {
          // 1. 同步小说数据
          await get().syncNovels();
          
          // 2. 同步角色数据
          await get().syncCharacters();
          
          // 3. 同步大纲数据
          await get().syncOutlines();
          
          set({ lastSyncTime: new Date().toISOString() });
          console.log('数据同步完成');
          
        } catch (error) {
          console.error('数据同步失败:', error);
          throw error;
        } finally {
          set({ syncInProgress: false });
        }
      },

      // 同步小说数据
      syncNovels: async () => {
        const { client } = get();
        if (!client) return;

        // 获取当前用户信息
        const { membershipInfo } = useMembershipStore.getState();
        const currentUserId = membershipInfo.email || 'anonymous';

        // 获取本地当前用户的小说
        const localNovels = await databaseManager.novels.getNovelsByUserId(currentUserId);
        
        // 获取云端当前用户的小说
        const { data: cloudNovels } = await client
          .from('novels')
          .select('*')
          .eq('author', currentUserId);

        // 上传本地新增/修改的数据
        for (const novel of localNovels) {
          const cloudNovel = cloudNovels?.find(c => c.id === novel.id);
          const localModified = new Date(novel.lastModified);
          const cloudModified = cloudNovel ? new Date(cloudNovel.last_modified) : new Date(0);
          
          if (!cloudNovel || localModified > cloudModified) {
            await client
              .from('novels')
              .upsert({
                id: novel.id,
                title: novel.title,
                content: novel.content,
                genre: novel.genre,
                word_count: novel.wordCount,
                progress: novel.progress,
                status: novel.status,
                description: novel.description,
                tags: novel.tags,
                cover_image: novel.coverImage,
                author: novel.author,
                target_word_count: novel.targetWordCount,
                is_public: novel.isPublic,
                created_at: novel.createdAt,
                last_modified: novel.lastModified
              });
          }
        }

        // 下载云端新增/修改的数据
        if (cloudNovels) {
          for (const cloudNovel of cloudNovels) {
            const localNovel = localNovels.find(l => l.id === cloudNovel.id);
            const cloudModified = new Date(cloudNovel.last_modified);
            const localModified = localNovel ? new Date(localNovel.lastModified) : new Date(0);
            
            if (!localNovel || cloudModified > localModified) {
              const novelData: Novel = {
                id: cloudNovel.id,
                title: cloudNovel.title,
                content: cloudNovel.content,
                genre: cloudNovel.genre,
                wordCount: cloudNovel.word_count,
                progress: cloudNovel.progress,
                status: cloudNovel.status,
                description: cloudNovel.description,
                tags: cloudNovel.tags,
                coverImage: cloudNovel.cover_image,
                author: cloudNovel.author,
                targetWordCount: cloudNovel.target_word_count,
                isPublic: cloudNovel.is_public,
                createdAt: cloudNovel.created_at,
                lastModified: cloudNovel.last_modified
              };
              
              if (localNovel) {
                await databaseManager.novels.updateNovel(novelData);
              } else {
                await databaseManager.novels.addNovel(novelData);
              }
            }
          }
        }
      },

      // 同步角色数据（增量同步）
      syncCharacters: async () => {
        const { client } = get();
        if (!client) return;

        // 获取当前用户信息
        const { membershipInfo } = useMembershipStore.getState();
        const currentUserId = membershipInfo.email || 'anonymous';

        // 获取本地数据和最后同步时间
        // 获取所有角色数据
        const allNovels = await databaseManager.novels.getAllNovels();
        const localCharacters: Character[] = [];
        for (const novel of allNovels) {
          const novelCharacters = await databaseManager.characters.getCharactersByNovelId(novel.id);
          localCharacters.push(...novelCharacters);
        }
        
        const { lastSyncTime } = get();
        const lastSyncDate = lastSyncTime ? new Date(lastSyncTime) : new Date(0);

        let cloudQuery = client.from('characters').select('*');
        
        // 如果有最后同步时间，只获取之后修改的数据
        if (lastSyncDate > new Date(0)) {
          cloudQuery = cloudQuery.gte('last_modified', lastSyncDate.toISOString());
        }
        
        const { data: cloudCharacters, error: cloudError } = await cloudQuery;

        if (cloudError) {
          console.error('获取云端角色数据失败:', cloudError);
          throw cloudError;
        }

        // 上传本地新增/修改的数据（只上传最后同步时间之后修改的数据）
        const localCharactersToSync = localCharacters.filter(character => {
          const characterModified = new Date(character.lastModified || character.createdAt);
          return characterModified > lastSyncDate;
        });

        // 批量上传本地数据
        const batchSize = 50;
        for (let i = 0; i < localCharactersToSync.length; i += batchSize) {
          const batch = localCharactersToSync.slice(i, i + batchSize);
          const upsertPromises = batch.map(character => {
            const cloudCharacter = cloudCharacters?.find(c => c.id === character.id);
            const localModified = new Date(character.lastModified || character.createdAt);
            const cloudModified = cloudCharacter ? new Date(cloudCharacter.last_modified) : new Date(0);
            
            if (!cloudCharacter || localModified >= cloudModified) {
              return client
                .from('characters')
                .upsert({
                  id: character.id,
                  novel_id: character.novelId,
                  name: character.name,
                  description: character.description,
                  role: character.role,
                  appearance: character.appearance,
                  personality: character.personality,
                  background: character.background,
                  relationships: character.relationships,
                  created_at: character.createdAt,
                  last_modified: character.lastModified || character.createdAt
                });
            }
            return Promise.resolve();
          });
          
          await Promise.all(upsertPromises);
        }

        // 下载云端新增/修改的数据
        if (cloudCharacters) {
          for (const cloudCharacter of cloudCharacters) {
            const localCharacter = localCharacters.find(l => l.id === cloudCharacter.id);
            const cloudModified = new Date(cloudCharacter.last_modified);
            const localModified = localCharacter ? new Date(localCharacter.lastModified || localCharacter.createdAt) : new Date(0);
            
            if (!localCharacter || cloudModified > localModified) {
              const characterData: Character = {
                id: cloudCharacter.id,
                novelId: cloudCharacter.novel_id,
                name: cloudCharacter.name,
                description: cloudCharacter.description,
                role: cloudCharacter.role,
                appearance: cloudCharacter.appearance,
                personality: cloudCharacter.personality,
                background: cloudCharacter.background,
                relationships: cloudCharacter.relationships,
                createdAt: cloudCharacter.created_at,
                lastModified: cloudCharacter.last_modified
              };
              
              if (localCharacter) {
                await databaseManager.characters.updateCharacter(characterData);
              } else {
                await databaseManager.characters.addCharacter(characterData);
              }
            }
          }
        }
      },

      // 同步大纲数据（增量同步）
      syncOutlines: async () => {
        const { client } = get();
        if (!client) return;

        // 获取当前用户信息
        const { membershipInfo } = useMembershipStore.getState();
        const currentUserId = membershipInfo.email || 'anonymous';

        // 获取本地数据和最后同步时间
        // 获取所有大纲数据
        const allNovels = await databaseManager.novels.getAllNovels();
        const localOutlines: NovelOutline[] = [];
        for (const novel of allNovels) {
          const novelOutlines = await databaseManager.outlines.getOutlinesByNovelId(novel.id);
          localOutlines.push(...novelOutlines);
        }
        
        const { lastSyncTime } = get();
        const lastSyncDate = lastSyncTime ? new Date(lastSyncTime) : new Date(0);

        let cloudQuery = client.from('outlines').select('*');
        
        // 如果有最后同步时间，只获取之后修改的数据
        if (lastSyncDate > new Date(0)) {
          cloudQuery = cloudQuery.gte('last_modified', lastSyncDate.toISOString());
        }
        
        const { data: cloudOutlines } = await cloudQuery;

        // 上传本地新增/修改的数据（只上传最后同步时间之后修改的数据）
        const localOutlinesToSync = localOutlines.filter(outline => {
          const outlineModified = new Date(outline.lastModified);
          return outlineModified > lastSyncDate;
        });

        // 批量上传本地数据
        const batchSize = 50;
        for (let i = 0; i < localOutlinesToSync.length; i += batchSize) {
          const batch = localOutlinesToSync.slice(i, i + batchSize);
          const upsertPromises = batch.map(outline => {
            const cloudOutline = cloudOutlines?.find(c => c.id === outline.id);
            const localModified = new Date(outline.lastModified);
            const cloudModified = cloudOutline ? new Date(cloudOutline.last_modified) : new Date(0);
            
            if (!cloudOutline || localModified >= cloudModified) {
              return client
                .from('outlines')
                .upsert({
                  id: outline.id,
                  novel_id: outline.novelId,
                  title: outline.title,
                  content: outline.content,
                  type: outline.type,
                  order: outline.order,
                  parent_id: outline.parentId,
                  created_at: outline.createdAt,
                  last_modified: outline.lastModified
                });
            }
            return Promise.resolve();
          });
          
          await Promise.all(upsertPromises);
        }

        // 下载云端新增/修改的数据
        if (cloudOutlines) {
          for (const cloudOutline of cloudOutlines) {
            const localOutline = localOutlines.find(l => l.id === cloudOutline.id);
            const cloudModified = new Date(cloudOutline.last_modified);
            const localModified = localOutline ? new Date(localOutline.lastModified) : new Date(0);
            
            if (!localOutline || cloudModified > localModified) {
              const outlineData: NovelOutline = {
                id: cloudOutline.id,
                novelId: cloudOutline.novel_id,
                title: cloudOutline.title,
                content: cloudOutline.content,
                type: cloudOutline.type,
                order: cloudOutline.order,
                parentId: cloudOutline.parent_id,
                createdAt: cloudOutline.created_at,
                lastModified: cloudOutline.last_modified
              };
              
              if (localOutline) {
                await databaseManager.outlines.updateOutline(outlineData);
              } else {
                await databaseManager.outlines.addOutline(outlineData);
              }
            }
          }
        }
      },

      // 开始自动同步
      startAutoSync: () => {
        const { config, autoSyncTimer } = get();
        if (!config || autoSyncTimer) return;

        const timer = window.setInterval(async () => {
          try {
            await get().syncData();
          } catch (error) {
            console.error('自动同步失败:', error);
          }
        }, (config.syncInterval || 30) * 60 * 1000); // 转换为毫秒

        set({ autoSyncTimer: timer });
      },

      // 停止自动同步
      stopAutoSync: () => {
        const { autoSyncTimer } = get();
        if (autoSyncTimer) {
          window.clearInterval(autoSyncTimer);
          set({ autoSyncTimer: null });
        }
      },

      // 获取本地数据统计
      getLocalDataCount: async () => {
        try {
          // 获取当前用户信息
          const { membershipInfo } = useMembershipStore.getState();
          const currentUserId = membershipInfo.email || 'anonymous';
          
          const novels = await databaseManager.novels.getNovelsByUserId(currentUserId);
          
          // 获取所有角色数据
          const allNovels = await databaseManager.novels.getAllNovels();
          const characters: Character[] = [];
          for (const novel of allNovels) {
            const novelCharacters = await databaseManager.characters.getCharactersByNovelId(novel.id);
            characters.push(...novelCharacters);
          }
          
          // 获取所有大纲数据
          const outlines: NovelOutline[] = [];
          for (const novel of allNovels) {
            const novelOutlines = await databaseManager.outlines.getOutlinesByNovelId(novel.id);
            outlines.push(...novelOutlines);
          }
          
          return {
            novels: novels.length,
            characters: characters.length,
            outlines: outlines.length
          };
        } catch (error) {
          console.error('获取本地数据统计失败:', error);
          return { novels: 0, characters: 0, outlines: 0 };
        }
      },

      // 获取云端数据统计
      getCloudDataCount: async () => {
        const { client } = get();
        if (!client) return { novels: 0, characters: 0, outlines: 0 };

        try {
          const [novelsResult, charactersResult, outlinesResult] = await Promise.all([
            client.from('novels').select('id', { count: 'exact' }),
            client.from('characters').select('id', { count: 'exact' }),
            client.from('outlines').select('id', { count: 'exact' })
          ]);

          return {
            novels: novelsResult.count || 0,
            characters: charactersResult.count || 0,
            outlines: outlinesResult.count || 0
          };
        } catch (error) {
          console.error('获取云端数据统计失败:', error);
          return { novels: 0, characters: 0, outlines: 0 };
        }
      }
    }),
    {
      name: 'supabase-config',
      partialize: (state) => ({
        config: state.config,
        isEnabled: state.isEnabled,
        lastSyncTime: state.lastSyncTime
      })
    }
  )
);

// 导出类型
export type { SupabaseConfig };