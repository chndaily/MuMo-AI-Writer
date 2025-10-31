import { create } from 'zustand'
import { databaseManager } from '@/services'
import { Novel, Chapter, NovelGenre, NovelTag, NovelOutline, Character, WritingStats, Location, WorldSetting, WritingRecord } from '#/novel'
import { useMembershipStore } from '@/stores/membershipStore'

interface NovelIndexDBState {
  // 数据状态
  novels: Novel[]
  chapters: Chapter[]
  genres: NovelGenre[]
  tags: NovelTag[]
  outlines: NovelOutline[]
  characters: Character[]
  locations: Location[]
  cultures: WorldSetting[]
  technologies: WorldSetting[]
  magics: WorldSetting[]
  histories: WorldSetting[]
  writingRecords: WritingRecord[]
  stats: WritingStats | null

  // 加载状态
  isLoading: boolean
  error: string | null

  // 当前选中的小说
  currentNovel: Novel | null
  currentChapter: Chapter | null
}

interface NovelIndexDBActions {
  // 初始化数据
  initializeData: () => Promise<void>

  // 小说管理
  addNovel: (novel: Omit<Novel, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>
  updateNovel: (id: string, updates: Partial<Novel>) => Promise<void>
  deleteNovel: (id: string) => Promise<void>
  getNovel: (id: string) => Promise<Novel | undefined>
  setCurrentNovel: (novel: Novel | null) => void

  // 章节管理
  addChapter: (chapter: Omit<Chapter, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>
  updateChapter: (id: string, updates: Partial<Chapter>) => Promise<void>
  deleteChapter: (id: string) => Promise<void>
  setCurrentChapter: (chapter: Chapter | null) => void

  // 类型管理
  addGenre: (genre: Omit<NovelGenre, 'id' | 'createdAt'>) => Promise<void>
  updateGenre: (id: string, updates: Partial<NovelGenre>) => Promise<void>
  deleteGenre: (id: string) => Promise<void>

  // 标签管理
  addTag: (tag: Omit<NovelTag, 'id' | 'createdAt'>) => Promise<void>
  updateTag: (id: string, updates: Partial<NovelTag>) => Promise<void>
  deleteTag: (id: string) => Promise<void>

  // 大纲管理
  addOutline: (outline: Omit<NovelOutline, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>
  updateOutline: (id: string, updates: Partial<NovelOutline>) => Promise<void>
  deleteOutline: (id: string) => Promise<void>

  // 角色管理
  addCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>
  updateCharacter: (id: string, updates: Partial<Character>) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>

  // 地点管理
  refreshLocations: (novelId?: string) => Promise<void>

  // 世界观设定管理
  refreshCultures: (novelId?: string) => Promise<void>
  refreshTechnologies: (novelId?: string) => Promise<void>
  refreshMagics: (novelId?: string) => Promise<void>
  refreshHistories: (novelId?: string) => Promise<void>

  // 统计管理
  updateStats: (stats: Partial<WritingStats>) => Promise<void>

  // 写作记录管理
  writingRecords: WritingRecord[]
  refreshWritingRecords: (novelId?: string) => Promise<void>
  addWritingRecord: (record: Omit<WritingRecord, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>
  updateWritingRecord: (id: string, updates: Partial<WritingRecord>) => Promise<void>
  deleteWritingRecord: (id: string) => Promise<void>
  getWritingRecordsByNovelId: (novelId: string) => WritingRecord[]
  getWritingRecordsByType: (novelId: string, type: WritingRecord['type']) => WritingRecord[]

  // 搜索功能
  searchNovels: (filters: {
    keyword?: string
    genre?: string
    status?: string
    tags?: string[]
  }) => Promise<Novel[]>

  // 状态管理
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // 刷新数据
  refreshNovels: () => Promise<void>
  refreshChapters: (novelId?: string) => Promise<void>
  refreshGenres: () => Promise<void>
  refreshTags: () => Promise<void>
  refreshOutlines: (novelId?: string) => Promise<void>
  refreshCharacters: (novelId?: string) => Promise<void>
  refreshStats: () => Promise<void>
}

export const useNovelIndexDBStore = create<NovelIndexDBState & NovelIndexDBActions>((set, get) => ({
  // 初始状态
  novels: [],
  chapters: [],
  genres: [],
  tags: [],
  outlines: [],
  characters: [],
  locations: [],
  cultures: [],
  technologies: [],
  magics: [],
  histories: [],
  writingRecords: [],
  stats: null,
  isLoading: false,
  error: null,
  currentNovel: null,
  currentChapter: null,

  // 初始化数据
  initializeData: async () => {
    set({ isLoading: true, error: null })
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';
      console.log('初始化数据，当前用户ID:', currentUserId);
      
      const [novels, stats] = await Promise.all([
        databaseManager.novels.getNovelsByUserId(currentUserId),
        databaseManager.stats.getStats(),
      ])

      set({
        novels,
        // genres和tags模块已移除，使用空数组
        genres: [],
        tags: [],
        stats,
        isLoading: false,
      })
    } catch (error) {
      console.error('初始化失败:', error)
      set({
        error: error instanceof Error ? error.message : '初始化失败',
        isLoading: false,
      })
    }
  },

  // 小说管理
  addNovel: async (novelData) => {
    set({ isLoading: true, error: null })
    try {
      // 使用 databaseManager 添加小说
      const novelWithMeta = {
        ...novelData,
        id: `novel-${Date.now()}`,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      }
      
      await databaseManager.novels.addNovel(novelWithMeta)
      
      set(state => ({
        novels: [...state.novels, novelWithMeta],
        currentNovel: novelWithMeta,
        isLoading: false,
      }))
    } catch (error) {
      console.error('添加小说失败:', error)
      set({
        error: error instanceof Error ? error.message : '添加小说失败',
        isLoading: false,
      })
      throw error // 重新抛出错误以便上层处理
    }
  },

  updateNovel: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const novel = get().novels.find(n => n.id === id)
      if (!novel) throw new Error('小说不存在')

      const updatedNovel = { ...novel, ...updates, lastModified: new Date().toISOString() }
      await databaseManager.novels.updateNovel(updatedNovel)

      set(state => ({
        novels: state.novels.map(n => n.id === id ? updatedNovel : n),
        currentNovel: state.currentNovel?.id === id ? updatedNovel : state.currentNovel,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新小说失败',
        isLoading: false,
      })
    }
  },

  deleteNovel: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await databaseManager.novels.deleteNovel(id)
      set(state => ({
        novels: state.novels.filter(n => n.id !== id),
        currentNovel: state.currentNovel?.id === id ? null : state.currentNovel,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除小说失败',
        isLoading: false,
      })
    }
  },

  getNovel: async (id) => {
    try {
      return await databaseManager.novels.getNovel(id)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取小说失败',
      })
      return undefined
    }
  },

  setCurrentNovel: (novel) => {
    set({ currentNovel: novel })
  },

  // 章节管理
  addChapter: async (chapterData) => {
    set({ isLoading: true, error: null })
    try {
      const newChapter = await databaseManager.chapters.addChapter(chapterData)
      set(state => ({
        chapters: [...state.chapters, newChapter],
        currentChapter: newChapter,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '添加章节失败',
        isLoading: false,
      })
    }
  },

  updateChapter: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const chapter = get().chapters.find(c => c.id === id)
      if (!chapter) throw new Error('章节不存在')

      const updatedChapter = { ...chapter, ...updates, lastModified: new Date().toISOString() }
      await databaseManager.chapters.updateChapter(updatedChapter)

      set(state => ({
        chapters: state.chapters.map(c => c.id === id ? updatedChapter : c),
        currentChapter: state.currentChapter?.id === id ? updatedChapter : state.currentChapter,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新章节失败',
        isLoading: false,
      })
    }
  },

  deleteChapter: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await databaseManager.chapters.deleteChapter(id)
      set(state => ({
        chapters: state.chapters.filter(c => c.id !== id),
        currentChapter: state.currentChapter?.id === id ? null : state.currentChapter,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除章节失败',
        isLoading: false,
      })
    }
  },

  setCurrentChapter: (chapter) => {
    set({ currentChapter: chapter })
  },

  // 类型管理（移除所有与genres相关的方法，因为该模块已移除）
  addGenre: async (genreData) => {
    set({ isLoading: true, error: null })
    try {
      // genres模块已移除，不执行任何操作
      console.warn('genres模块已移除，addGenre方法不执行任何操作')
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '添加类型失败',
        isLoading: false,
      })
    }
  },

  updateGenre: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      // genres模块已移除，不执行任何操作
      console.warn('genres模块已移除，updateGenre方法不执行任何操作')
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新类型失败',
        isLoading: false,
      })
    }
  },

  deleteGenre: async (id) => {
    set({ isLoading: true, error: null })
    try {
      // genres模块已移除，不执行任何操作
      console.warn('genres模块已移除，deleteGenre方法不执行任何操作')
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除类型失败',
        isLoading: false,
      })
    }
  },

  // 标签管理（移除所有与tags相关的方法，因为该模块已移除）
  addTag: async (tagData) => {
    set({ isLoading: true, error: null })
    try {
      // tags模块已移除，不执行任何操作
      console.warn('tags模块已移除，addTag方法不执行任何操作')
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '添加标签失败',
        isLoading: false,
      })
    }
  },

  updateTag: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      // tags模块已移除，不执行任何操作
      console.warn('tags模块已移除，updateTag方法不执行任何操作')
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新标签失败',
        isLoading: false,
      })
    }
  },

  deleteTag: async (id) => {
    set({ isLoading: true, error: null })
    try {
      // tags模块已移除，不执行任何操作
      console.warn('tags模块已移除，deleteTag方法不执行任何操作')
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除标签失败',
        isLoading: false,
      })
    }
  },

  // 大纲管理
  addOutline: async (outlineData) => {
    set({ isLoading: true, error: null })
    try {
      const newOutline = await databaseManager.outlines.addOutline(outlineData)
      set(state => ({
        outlines: [...state.outlines, newOutline],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '添加大纲失败',
        isLoading: false,
      })
    }
  },

  updateOutline: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      console.log('更新大纲:', { id, updates });
      // 修复：直接从数据库获取最新数据，而不是使用状态中的缓存数据
      const outline = await databaseManager.outlines.getOutline(id);
      console.log('从数据库获取到要更新的大纲:', outline);
      if (!outline) throw new Error('大纲不存在')

      const updatedOutline = { ...outline, ...updates, lastModified: new Date().toISOString() }
      console.log('更新后的大纲数据:', updatedOutline);
      await databaseManager.outlines.updateOutline(updatedOutline)
      console.log('数据库更新完成');

      // 更新状态中的数据
      set(state => ({
        outlines: state.outlines.map(o => o.id === id ? updatedOutline : o),
        isLoading: false,
      }))
      console.log('状态更新完成');
    } catch (error) {
      console.error('更新大纲失败:', error);
      set({
        error: error instanceof Error ? error.message : '更新大纲失败',
        isLoading: false,
      })
    }
  },

  deleteOutline: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await databaseManager.outlines.deleteOutline(id)
      set(state => ({
        outlines: state.outlines.filter(o => o.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除大纲失败',
        isLoading: false,
      })
    }
  },

  // 角色管理
  addCharacter: async (characterData) => {
    set({ isLoading: true, error: null })
    try {
      const newCharacter = await databaseManager.characters.addCharacter(characterData)
      set(state => ({
        characters: [...state.characters, newCharacter],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '添加角色失败',
        isLoading: false,
      })
    }
  },

  updateCharacter: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const character = get().characters.find(c => c.id === id)
      if (!character) throw new Error('角色不存在')

      const updatedCharacter = { ...character, ...updates, lastModified: new Date().toISOString() }
      await databaseManager.characters.updateCharacter(updatedCharacter)

      set(state => ({
        characters: state.characters.map(c => c.id === id ? updatedCharacter : c),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新角色失败',
        isLoading: false,
      })
    }
  },

  deleteCharacter: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await databaseManager.characters.deleteCharacter(id)
      set(state => ({
        characters: state.characters.filter(c => c.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除角色失败',
        isLoading: false,
      })
    }
  },

  // 地点管理
  refreshLocations: async (novelId) => {
    try {
      if (novelId) {
        console.log('刷新地点设定，小说ID:', novelId);
        const locations = await databaseManager.locations.getLocationsByNovelId(novelId);
        console.log('获取到地点设定数据:', locations.length);
        set({ locations });
      } else {
        // getAllData方法已移除，使用空数组替代
        set({ locations: [] });
      }
    } catch (error) {
      console.error('刷新地点设定列表失败:', error);
      set({
        error: error instanceof Error ? error.message : '刷新地点设定列表失败',
      });
    }
  },

  // 统计管理
  updateStats: async (stats) => {
    set({ isLoading: true, error: null })
    try {
      const currentStats = get().stats
      const updatedStats = { ...currentStats, ...stats } as WritingStats
      await databaseManager.stats.updateStats(updatedStats)

      set({
        stats: updatedStats,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新统计失败',
        isLoading: false,
      })
    }
  },

  // 搜索功能
  searchNovels: async (filters) => {
    try {
      return await databaseManager.novels.searchNovels(filters)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '搜索失败',
      })
      return []
    }
  },

  // 状态管理
  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setError: (error) => {
    set({ error })
  },

  // 刷新数据
  refreshNovels: async () => {
    try {
      // 获取当前用户信息
      const { membershipInfo } = useMembershipStore.getState();
      const currentUserId = membershipInfo.email || 'anonymous';
      console.log('刷新小说数据，用户ID:', currentUserId);
      
      const novels = await databaseManager.novels.getNovelsByUserId(currentUserId)
      console.log('刷新小说数据:', novels); // 添加调试日志
      set({ novels });
    } catch (error) {
      console.error('刷新小说列表失败:', error)
      set({
        error: error instanceof Error ? error.message : '刷新小说列表失败',
      })
    }
  },

  refreshChapters: async (novelId) => {
    try {
      if (novelId) {
        const chapters = await databaseManager.chapters.getChaptersByNovelId(novelId)
        set({ chapters })
      } else {
        // getAllData方法已移除，使用空数组替代
        set({ chapters: [] })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '刷新章节列表失败',
      })
    }
  },

  refreshGenres: async () => {
    try {
      // genres模块已移除，使用空数组替代
      set({ genres: [] });
    } catch (error) {
      console.error('刷新类型列表失败:', error);
      set({
        error: error instanceof Error ? error.message : '刷新类型列表失败',
      });
    }
  },

  refreshTags: async () => {
    try {
      // tags模块已移除，使用空数组替代
      set({ tags: [] })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '刷新标签列表失败',
      })
    }
  },

  refreshOutlines: async (novelId) => {
    try {
      if (novelId) {
        const outlines = await databaseManager.outlines.getOutlinesByNovelId(novelId)
        set({ outlines })
      } else {
        // getAllData方法已移除，使用空数组替代
        set({ outlines: [] })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '刷新大纲列表失败',
      })
    }
  },

  refreshCharacters: async (novelId) => {
    try {
      if (novelId) {
        const characters = await databaseManager.characters.getCharactersByNovelId(novelId)
        set({ characters })
      } else {
        // getAllData方法已移除，使用空数组替代
        set({ characters: [] })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '刷新角色列表失败',
      })
    }
  },

  refreshStats: async () => {
    try {
      const stats = await databaseManager.stats.getStats()
      set({ stats })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '刷新统计信息失败',
      })
    }
  },

  // 刷新文化设定
  refreshCultures: async (novelId) => {
    try {
      if (novelId) {
        console.log('刷新文化设定，小说ID:', novelId);
        const cultures = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'culture');
        console.log('获取到文化设定数据:', cultures.length);
        set({ cultures });
      } else {
        // getAllData方法已移除，使用空数组替代
        set({ cultures: [] });
      }
    } catch (error) {
      console.error('刷新文化设定列表失败:', error);
      set({
        error: error instanceof Error ? error.message : '刷新文化设定列表失败',
      });
    }
  },

  // 刷新科技设定
  refreshTechnologies: async (novelId) => {
    try {
      if (novelId) {
        console.log('刷新科技设定，小说ID:', novelId);
        const technologies = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'technology');
        console.log('获取到科技设定数据:', technologies.length);
        set({ technologies });
      } else {
        // getAllData方法已移除，使用空数组替代
        set({ technologies: [] });
      }
    } catch (error) {
      console.error('刷新科技设定列表失败:', error);
      set({
        error: error instanceof Error ? error.message : '刷新科技设定列表失败',
      });
    }
  },

  // 刷新魔法设定
  refreshMagics: async (novelId) => {
    try {
      if (novelId) {
        console.log('刷新魔法设定，小说ID:', novelId);
        const magics = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'magic');
        console.log('获取到魔法设定数据:', magics.length);
        set({ magics });
      } else {
        // getAllData方法已移除，使用空数组替代
        set({ magics: [] });
      }
    } catch (error) {
      console.error('刷新魔法设定列表失败:', error);
      set({
        error: error instanceof Error ? error.message : '刷新魔法设定列表失败',
      });
    }
  },

  // 刷新历史设定
  refreshHistories: async (novelId) => {
    try {
      if (novelId) {
        console.log('刷新历史设定，小说ID:', novelId);
        const histories = await databaseManager.worldSettings.getWorldSettingsByNovelId(novelId, 'history');
        console.log('获取到历史设定数据:', histories.length);
        set({ histories });
      } else {
        // getAllData方法已移除，使用空数组替代
        set({ histories: [] });
      }
    } catch (error) {
      console.error('刷新历史设定列表失败:', error);
      set({
        error: error instanceof Error ? error.message : '刷新历史设定列表失败',
      });
    }
  },

  // 刷新写作记录
  refreshWritingRecords: async (novelId) => {
    try {
      if (novelId) {
        const writingRecords = await databaseManager.writingRecords.getWritingRecordsByNovelId(novelId)
        set({ writingRecords })
      } else {
        // getAllData方法已移除，使用空数组替代
        set({ writingRecords: [] })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '刷新写作记录列表失败',
      })
    }
  },

  // 添加写作记录
  addWritingRecord: async (recordData) => {
    set({ isLoading: true, error: null })
    try {
      await databaseManager.writingRecords.addWritingRecord(recordData)
      // 刷新写作记录列表
      if (recordData.novelId) {
        const writingRecords = await databaseManager.writingRecords.getWritingRecordsByNovelId(recordData.novelId)
        set({ writingRecords, isLoading: false })
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '添加写作记录失败',
        isLoading: false,
      })
    }
  },

  // 更新写作记录
  updateWritingRecord: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const record = get().writingRecords.find(r => r.id === id)
      if (!record) throw new Error('写作记录不存在')

      const updatedRecord = { ...record, ...updates, lastModified: new Date().toISOString() }
      await databaseManager.writingRecords.updateWritingRecord(updatedRecord)

      set(state => ({
        writingRecords: state.writingRecords.map(r => r.id === id ? updatedRecord : r),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新写作记录失败',
        isLoading: false,
      })
    }
  },

  // 删除写作记录
  deleteWritingRecord: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await databaseManager.writingRecords.deleteWritingRecord(id)
      set(state => ({
        writingRecords: state.writingRecords.filter(r => r.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除写作记录失败',
        isLoading: false,
      })
    }
  },

  // 根据小说ID获取写作记录
  getWritingRecordsByNovelId: (novelId) => {
    return get().writingRecords.filter(record => record.novelId === novelId)
  },

  // 根据类型获取写作记录
  getWritingRecordsByType: (novelId, type) => {
    return get().writingRecords.filter(record => record.novelId === novelId && record.type === type)
  },
}))