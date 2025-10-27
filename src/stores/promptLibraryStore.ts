/**
 * 提示和模型集合存储
 */
import { create } from 'zustand'
import { Collection, CollectionType, PromptType, CollectionState, CollectionMap, Tag } from '#/promptLibrary'
import defaultPromptLibraryState from '@/constants/defaultPromptLibraryState'
import dayjs from 'dayjs'
import { databaseManager } from '@/services/databaseManager'

// 具体集合类型别名
type PromptCollection = CollectionMap<CollectionType.Prompts>
type ModelCollection = CollectionMap<CollectionType.Models>
type DefaultPromptCollection = CollectionMap<CollectionType.Defaults>
type PersonaCollection = CollectionMap<CollectionType.Personas>
type PresetCollection = CollectionMap<CollectionType.Presets>

interface PromptLibraryState {
    collections: Collection[]
    isLoading: boolean
    error: string | null
    initialize: () => Promise<void>
    refresh: () => Promise<void>
    getCollectionsByType: <T extends CollectionType>(type: T) => CollectionMap<T>[]
    getCollection: (id: string) => Collection | undefined
    addCollection: (collection: Collection) => Promise<void>
    updateCollection: (collection: Collection) => Promise<void>
    deleteCollection: (id: string) => Promise<void>
}

export const usePromptLibraryStore = create<PromptLibraryState>()(
    (set, get) => ({
        collections: [],
        isLoading: false,
        error: null,
        
        // 初始化提示词库数据 - 只获取全局提示词（不关联特定小说的）
        initialize: async () => {
            set({ isLoading: true, error: null });
            try {
                // 从MongoDB获取提示词库数据
                const allCollections = await databaseManager.promptLibrary.getAllCollections();
                // 过滤出全局提示词（不关联特定小说的）
                const globalCollections = allCollections.filter(collection => {
                    // 检查集合是否有标签属性
                    if (collection.attributes && Array.isArray(collection.attributes.tags)) {
                        // 全局提示词：包含公共标签但不包含小说标签
                        const hasPublicTag = collection.attributes.tags.some(tag => tag.type === 'public');
                        const hasNovelTag = collection.attributes.tags.some(tag => tag.type === 'novel');
                        return hasPublicTag && !hasNovelTag;
                    }
                    // 如果没有标签属性，使用原有的项目关联逻辑作为后备
                    if (!collection.relationships || !collection.relationships.projects) {
                        return true;
                    }
                    // 检查是否关联了小说项目，如果没有关联小说项目则是全局的
                    return !collection.relationships.projects.some(project => 
                        project.type === 'novels'
                    );
                });
                // 如果没有数据，使用默认数据
                if (globalCollections.length === 0) {
                    set({ collections: defaultPromptLibraryState.collections });
                } else {
                    set({ collections: globalCollections });
                }
            } catch (error) {
                console.error('初始化提示词库数据失败:', error);
                set({ error: '初始化提示词库数据失败' });
            } finally {
                set({ isLoading: false });
            }
        },
        
        // 刷新提示词库数据
        refresh: async () => {
            try {
                // 从MongoDB获取提示词库数据
                const allCollections = await databaseManager.promptLibrary.getAllCollections();
                // 过滤出全局提示词（不关联特定小说的）
                const globalCollections = allCollections.filter(collection => {
                    // 检查集合是否有标签属性
                    if (collection.attributes && Array.isArray(collection.attributes.tags)) {
                        // 全局提示词：包含公共标签但不包含小说标签
                        const hasPublicTag = collection.attributes.tags.some(tag => tag.type === 'public');
                        const hasNovelTag = collection.attributes.tags.some(tag => tag.type === 'novel');
                        return hasPublicTag && !hasNovelTag;
                    }
                    // 如果没有标签属性，使用原有的项目关联逻辑作为后备
                    if (!collection.relationships || !collection.relationships.projects) {
                        return true;
                    }
                    // 检查是否关联了小说项目，如果没有关联小说项目则是全局的
                    return !collection.relationships.projects.some(project => 
                        project.type === 'novels'
                    );
                });
                // 更新集合数据
                set({ collections: globalCollections });
            } catch (error) {
                console.error('刷新提示词库数据失败:', error);
                set({ error: '刷新提示词库数据失败' });
            }
        },
        
        // 类型集合
        getCollectionsByType: <T extends CollectionType>(type: T): CollectionMap<T>[] => {
            return get().collections.filter(collection => collection.type === type) as CollectionMap<T>[]
        },
        getCollection: (id: string) => {
            return get().collections.find(collection => collection.id === id)
        },
        addCollection: async (collection: Collection) => {
            try {
                // 为全局提示词库集合添加公共标签
                const collectionWithPublicTag = {
                    ...collection,
                    attributes: {
                        ...collection.attributes,
                        tags: [
                            ...(collection.attributes?.tags || []),
                            { id: 'public', name: 'Public', type: 'public' } as Tag
                        ]
                    }
                };
                
                // 保存到MongoDB并获取新创建的数据
                const newCollection = await databaseManager.promptLibrary.createCollection(collectionWithPublicTag);
                set((state) => ({ collections: [...state.collections, newCollection] }))
            } catch (error) {
                console.error('添加集合失败:', error);
                throw error;
            }
        },
        updateCollection: async (collection: Collection) => {
            try {
                collection.meta.updatedAt = dayjs().toISOString()
                // 更新到MongoDB并获取更新后的数据
                const updatedCollection = await databaseManager.promptLibrary.updateCollection(collection.id, collection);
                set((state) => ({ collections: state.collections.map(c => c.id === collection.id ? updatedCollection : c) }))
            } catch (error) {
                console.error('更新集合失败:', error);
                throw error;
            }
        },
        deleteCollection: async (id: string) => {
            try {
                // 从MongoDB删除
                await databaseManager.promptLibrary.deleteCollection(id);
                set((state) => ({ collections: state.collections.filter(c => c.id !== id) }))
            } catch (error) {
                console.error('删除集合失败:', error);
                throw error;
            }
        }
    })
)

export const usePromptCollections = (type: PromptType): PromptCollection[] => {
    const { collections } = usePromptLibraryStore();
    return collections.filter(collection => {
        if (collection.type === CollectionType.Prompts) {
            return collection.attributes.type === type;
        }
        return false;
    }) as PromptCollection[];
}