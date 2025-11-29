import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';

interface SettingsState {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: {
                // 默认值为空，用户需要在设置页面填写
                soraApiUrl: '',
                soraApiKey: '',
                geminiApiUrl: '',
                geminiApiKey: '',
            },
            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),
        }),
        {
            name: 'app-settings',
        }
    )
);
