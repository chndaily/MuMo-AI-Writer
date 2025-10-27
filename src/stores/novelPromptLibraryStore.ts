/**
 * 小说特定提示词库存储
 * 用于存储和管理特定小说的提示词库数据
 */
import { create } from 'zustand'
import { Collection, CollectionType, CollectionState, Tag } from '#/promptLibrary'
import { databaseManager } from '@/services/databaseManager'
import dayjs from 'dayjs'

// 小说特定提示词库状态接口
interface NovelPromptLibraryState {
    collections: Collection[]
    isLoading: boolean
    error: string | null
    novelId: string | null
    initialize: (novelId: string) => Promise<void>
    refresh: (novelId: string) => Promise<void>
    getCollectionsByType: <T extends CollectionType>(type: T) => Collection[]
    getCollection: (id: string) => Collection | undefined
    addCollection: (collection: Omit<Collection, 'id'>) => Promise<void>
    updateCollection: (collection: Collection) => Promise<void>
    deleteCollection: (id: string) => Promise<void>
}

// 创建小说特定提示词库存储
export const useNovelPromptLibraryStore = create<NovelPromptLibraryState>()(
    (set, get) => ({
        collections: [],
        isLoading: false,
        error: null,
        novelId: null,
        
        // 初始化小说特定提示词库数据
        initialize: async (novelId: string) => {
            set({ isLoading: true, error: null, novelId });
            try {
                // 获取所有提示词库数据，然后过滤出与当前小说相关的
                const allCollections = await databaseManager.promptLibrary.getAllCollections();
                // 过滤出全局提示词和当前小说的特定提示词
                const novelCollections = allCollections.filter(collection => {
                    // 检查集合是否有标签属性
                    if (collection.attributes && Array.isArray(collection.attributes.tags)) {
                        // 检查是否包含公共标签（全局提示词）
                        const hasPublicTag = collection.attributes.tags.some(tag => tag.type === 'public');
                        // 检查是否包含与当前小说ID匹配的标签（当前小说特定提示词）
                        const hasCurrentNovelTag = collection.attributes.tags.some(tag => 
                            tag.type === 'novel' && tag.id === novelId
                        );
                        // 检查是否包含其他小说的标签
                        const hasOtherNovelTags = collection.attributes.tags.some(tag => 
                            tag.type === 'novel' && tag.id !== novelId
                        );
                        
                        // 加载条件：
                        // 1. 包含公共标签且不包含其他小说标签的集合（全局提示词）
                        // 2. 包含与当前小说ID匹配的标签的集合（当前小说特定提示词）
                        return (hasPublicTag && !hasOtherNovelTags) || hasCurrentNovelTag;
                    }
                    // 如果没有标签属性，使用原有的项目关联逻辑作为后备
                    if (!collection.relationships || !collection.relationships.projects) {
                        return true;
                    }
                    // 检查是否有与当前小说关联的项目
                    return collection.relationships.projects.some(project => 
                        project.type === 'novels' && project.id === novelId
                    );
                });
                set({ collections: novelCollections });
            } catch (error) {
                console.error('初始化小说特定提示词库数据失败:', error);
                set({ error: '初始化小说特定提示词库数据失败' });
            } finally {
                set({ isLoading: false });
            }
        },
        
        // 刷新小说特定提示词库数据
        refresh: async (novelId: string) => {
            try {
                // 获取所有提示词库数据，然后过滤出与当前小说相关的
                const allCollections = await databaseManager.promptLibrary.getAllCollections();
                // 过滤出全局提示词和当前小说的特定提示词
                const novelCollections = allCollections.filter(collection => {
                    // 检查集合是否有标签属性
                    if (collection.attributes && Array.isArray(collection.attributes.tags)) {
                        // 检查是否包含公共标签（全局提示词）
                        const hasPublicTag = collection.attributes.tags.some(tag => tag.type === 'public');
                        // 检查是否包含与当前小说ID匹配的标签（当前小说特定提示词）
                        const hasCurrentNovelTag = collection.attributes.tags.some(tag => 
                            tag.type === 'novel' && tag.id === novelId
                        );
                        // 检查是否包含其他小说的标签
                        const hasOtherNovelTags = collection.attributes.tags.some(tag => 
                            tag.type === 'novel' && tag.id !== novelId
                        );
                        
                        // 加载条件：
                        // 1. 包含公共标签且不包含其他小说标签的集合（全局提示词）
                        // 2. 包含与当前小说ID匹配的标签的集合（当前小说特定提示词）
                        return (hasPublicTag && !hasOtherNovelTags) || hasCurrentNovelTag;
                    }
                    // 如果没有标签属性，使用原有的项目关联逻辑作为后备
                    if (!collection.relationships || !collection.relationships.projects) {
                        return true;
                    }
                    // 检查是否有与当前小说关联的项目
                    return collection.relationships.projects.some(project => 
                        project.type === 'novels' && project.id === novelId
                    );
                });
                set({ collections: novelCollections });
            } catch (error) {
                console.error('刷新小说特定提示词库数据失败:', error);
                set({ error: '刷新小说特定提示词库数据失败' });
            }
        },
        
        // 根据类型获取集合
        getCollectionsByType: <T extends CollectionType>(type: T) => {
            return get().collections.filter(collection => collection.type === type)
        },
        getCollection: (id: string) => {
            return get().collections.find(collection => collection.id === id)
        },
        addCollection: async (collectionData: Omit<Collection, 'id'>) => {
            const { novelId } = get();
            if (!novelId) {
                throw new Error('未指定小说ID');
            }
            
            try {
                // 创建小说特定的提示词集合，添加小说ID标签
                const newCollectionData = {
                    ...collectionData,
                    attributes: {
                        ...collectionData.attributes,
                        tags: [
                            ...(collectionData.attributes?.tags || []),
                            { id: novelId, name: `novel-${novelId}`, type: 'novel' } as Tag
                        ]
                    },
                    relationships: {
                        ...collectionData.relationships,
                        projects: [
                            ...(collectionData.relationships?.projects || []),
                            {
                                type: 'novels' as const,
                                id: novelId
                            }
                        ]
                    }
                };
                
                // 保存到数据库
                const newCollection = await databaseManager.promptLibrary.createCollection(newCollectionData);
                set((state) => ({ collections: [...state.collections, newCollection] }))
            } catch (error) {
                console.error('添加小说特定提示词集合失败:', error);
                throw error;
            }
        },
        updateCollection: async (collection: Collection) => {
            const { novelId } = get();
            if (!novelId) {
                throw new Error('未指定小说ID');
            }
            
            try {
                collection.meta.updatedAt = dayjs().toISOString()
                // 更新小说特定的提示词集合
                const updatedCollection = await databaseManager.promptLibrary.updateCollection(collection.id, collection);
                set((state) => ({ collections: state.collections.map(c => c.id === collection.id ? updatedCollection : c) }))
            } catch (error) {
                console.error('更新小说特定提示词集合失败:', error);
                throw error;
            }
        },
        deleteCollection: async (id: string) => {
            const { novelId } = get();
            if (!novelId) {
                throw new Error('未指定小说ID');
            }
            
            try {
                // 删除小说特定的提示词集合
                await databaseManager.promptLibrary.deleteCollection(id);
                set((state) => ({ collections: state.collections.filter(c => c.id !== id) }))
            } catch (error) {
                console.error('删除小说特定提示词集合失败:', error);
                throw error;
            }
        }
    })
)