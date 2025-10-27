import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { StorageEnum, ThemeColorPresets, ThemeLayout, ThemeMode } from '#/enum';

type SettingsType = {
  themeColorPresets: ThemeColorPresets;
  themeMode: 'light' | 'dark';
  themeLayout: ThemeLayout;
  themeStretch: boolean;
  breadCrumb: boolean;
  multiTab: boolean;
  darkSidebar: boolean;
};
type SettingStore = {
  settings: SettingsType;
  // 使用 actions 命名空间来存放所有的 action
  actions: {
    setSettings: (settings: SettingsType) => void;
    clearSettings: () => void;
  };
};

const useLayoutSettingStore = create<SettingStore>()(
  persist(
    (set) => ({
      settings: {
        themeColorPresets: ThemeColorPresets.Default,
        themeMode: ThemeMode.Light,
        themeLayout: ThemeLayout.Vertical,
        themeStretch: false,
        breadCrumb: true,
        multiTab: true,
        darkSidebar: false,
      },
      actions: {
        setSettings: (settings) => {
          set({ settings });
        },
        clearSettings() {
          useLayoutSettingStore.persist.clearStorage();
        },
      },
    }),
    {
      name: StorageEnum.Settings, // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({ [StorageEnum.Settings]: state.settings }),
    },
  ),
);

export const useLayoutSettings = () => useLayoutSettingStore((state) => state.settings);
export const useLayoutSettingActions = () => useLayoutSettingStore((state) => state.actions);
