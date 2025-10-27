import { useState, useEffect, useCallback } from 'react'
import { useNovelStore } from '../stores/novelStore'
import { debounce } from '../utils/helpers'
import { Novel } from '#/novel'

export const useNovel = (novelId?: string) => {
  const {
    novels,
    currentNovel,
    addNovel,
    updateNovel,
    deleteNovel,
    setCurrentNovel,
    updateNovelContent,
    updateNovelTitle,
    updateNovelGenre,
  } = useNovelStore()

  // 直接使用 databaseManager 获取小说
  const getNovel = useCallback(async (id: string) => {
    const { databaseManager } = await import('@/services/index');
    return await databaseManager.novels.getNovel(id);
  }, []);

  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [novel, setNovel] = useState<Novel | null>(null)
  const [loading, setLoading] = useState(false)

  // 获取指定小说
  useEffect(() => {
    const fetchNovel = async () => {
      if (novelId) {
        setLoading(true)
        try {
          console.log('Fetching novel with id:', novelId);
          const fetchedNovel = await getNovel(novelId)
          console.log('Fetched novel:', fetchedNovel);
          setNovel(fetchedNovel || null)
        } catch (error) {
          console.error('获取小说失败:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setNovel(currentNovel)
      }
    }

    fetchNovel()
  }, [novelId, currentNovel, getNovel])

  // 防抖保存
  const debouncedSave = useCallback(
    debounce((id: string, updates: Partial<Novel>) => {
      updateNovel(id, updates)
      setHasUnsavedChanges(false)
    }, 1000),
    [updateNovel]
  )

  // 更新内容
  const updateContent = useCallback((content: string) => {
    if (!novel) return
    
    updateNovelContent(novel.id, content)
    setHasUnsavedChanges(true)
    debouncedSave(novel.id, { content })
  }, [novel, updateNovelContent, debouncedSave])

  // 更新标题
  const updateTitle = useCallback((title: string) => {
    if (!novel) return
    
    updateNovelTitle(novel.id, title)
    setHasUnsavedChanges(true)
    debouncedSave(novel.id, { title })
  }, [novel, updateNovelTitle, debouncedSave])

  // 更新类型
  const updateGenre = useCallback((genre: string) => {
    if (!novel) return
    
    updateNovelGenre(novel.id, genre)
    setHasUnsavedChanges(true)
    debouncedSave(novel.id, { genre })
  }, [novel, updateNovelGenre, debouncedSave])

  // 保存小说
  const saveNovel = useCallback(() => {
    if (!novel) return
    
    updateNovel(novel.id, { lastModified: new Date().toISOString() })
    setHasUnsavedChanges(false)
  }, [novel, updateNovel])

  // 删除小说
  const removeNovel = useCallback(() => {
    if (!novel) return
    
    deleteNovel(novel.id)
    setCurrentNovel(null)
  }, [novel, deleteNovel, setCurrentNovel])

  // 创建新小说
  const createNovel = useCallback((novelData: Omit<Novel, 'id' | 'createdAt' | 'lastModified'>) => {
    addNovel(novelData)
    setIsEditing(true)
  }, [addNovel])

  // 开始编辑
  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  // 停止编辑
  const stopEditing = useCallback(() => {
    setIsEditing(false)
    setHasUnsavedChanges(false)
  }, [])

  // 监听未保存的更改
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '您有未保存的更改，确定要离开吗？'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return {
    novel,
    isEditing,
    hasUnsavedChanges,
    loading,
    updateContent,
    updateTitle,
    updateGenre,
    saveNovel,
    removeNovel,
    createNovel,
    startEditing,
    stopEditing,
  }
}