import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Novel } from '#/novel';

interface CreationCenterState {
  selectedNovelId: string | null;
  selectedNovel: Novel | null;
}

interface CreationCenterActions {
  setSelectedNovel: (novel: Novel) => void;
  clearSelectedNovel: () => void;
  updateSelectedNovel: (updates: Partial<Novel>) => void;
}

export const useCreationCenterStore = create<CreationCenterState & CreationCenterActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      selectedNovelId: null,
      selectedNovel: null,

      // 设置选中的小说
      setSelectedNovel: (novel: Novel) => {
        set({
          selectedNovelId: novel.id,
          selectedNovel: novel
        });
      },

      // 清除选中的小说
      clearSelectedNovel: () => {
        set({
          selectedNovelId: null,
          selectedNovel: null
        });
      },

      // 更新选中小说的信息
      updateSelectedNovel: (updates: Partial<Novel>) => {
        const { selectedNovel } = get();
        if (selectedNovel) {
          set({
            selectedNovel: { ...selectedNovel, ...updates }
          });
        }
      }
    }),
    {
      name: 'creation-center-store',
      partialize: (state) => ({
        selectedNovelId: state.selectedNovelId,
        selectedNovel: state.selectedNovel
      })
    }
  )
);