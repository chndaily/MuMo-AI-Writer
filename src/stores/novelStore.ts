import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Novel {
  id: string
  title: string
  content: string
  genre: string
  wordCount: number
  progress: number
  lastModified: string
  status: 'draft' | 'publishing' | 'completed'
  createdAt: string
}

interface NovelState {
  novels: Novel[]
  currentNovel: Novel | null
  isLoading: boolean
  error: string | null
}

interface NovelActions {
  // 小说管理
  addNovel: (novel: Omit<Novel, 'id' | 'createdAt' | 'lastModified'>) => void
  updateNovel: (id: string, updates: Partial<Novel>) => void
  deleteNovel: (id: string) => void
  setCurrentNovel: (novel: Novel | null) => void
  
  // 内容管理
  updateNovelContent: (id: string, content: string) => void
  updateNovelTitle: (id: string, title: string) => void
  updateNovelGenre: (id: string, genre: string) => void
  
  // 状态管理
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 统计信息
  getTotalWordCount: () => number
  getNovelCount: () => number
  getNovelsByStatus: (status: Novel['status']) => Novel[]
}

export const useNovelStore = create<NovelState & NovelActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      novels: [],
      currentNovel: null,
      isLoading: false,
      error: null,

      // 小说管理
      addNovel: (novelData) => {
        const newNovel: Novel = {
          ...novelData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        }
        set((state) => ({
          novels: [...state.novels, newNovel],
          currentNovel: newNovel,
        }))
      },

      updateNovel: (id, updates) => {
        set((state) => ({
          novels: state.novels.map((novel) =>
            novel.id === id
              ? { ...novel, ...updates, lastModified: new Date().toISOString() }
              : novel
          ),
          currentNovel:
            state.currentNovel?.id === id
              ? { ...state.currentNovel, ...updates, lastModified: new Date().toISOString() }
              : state.currentNovel,
        }))
      },

      deleteNovel: (id) => {
        set((state) => ({
          novels: state.novels.filter((novel) => novel.id !== id),
          currentNovel: state.currentNovel?.id === id ? null : state.currentNovel,
        }))
      },

      setCurrentNovel: (novel) => {
        set({ currentNovel: novel })
      },

      // 内容管理
      updateNovelContent: (id, content) => {
        const wordCount = content.length
        get().updateNovel(id, { content, wordCount })
      },

      updateNovelTitle: (id, title) => {
        get().updateNovel(id, { title })
      },

      updateNovelGenre: (id, genre) => {
        get().updateNovel(id, { genre })
      },

      // 状态管理
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      // 统计信息
      getTotalWordCount: () => {
        return get().novels.reduce((total, novel) => total + novel.wordCount, 0)
      },

      getNovelCount: () => {
        return get().novels.length
      },

      getNovelsByStatus: (status) => {
        return get().novels.filter((novel) => novel.status === status)
      },
    }),
    {
      name: 'novel-storage',
      partialize: (state) => ({ novels: state.novels }),
    }
  )
) 