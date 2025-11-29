import axios from 'axios';
import { useSettingsStore } from '../store/settingsStore';

// Extended timeout for video generation (5 minutes)
const VIDEO_GENERATION_TIMEOUT = 5 * 60 * 1000;

export const createSoraClient = () => {
    const { settings } = useSettingsStore.getState();
    return axios.create({
        baseURL: settings.soraApiUrl,
        headers: {
            'Authorization': `Bearer ${settings.soraApiKey}`,
            'Content-Type': 'application/json',
        },
        timeout: VIDEO_GENERATION_TIMEOUT,
    });
};

export const createGeminiClient = () => {
    const { settings } = useSettingsStore.getState();
    return axios.create({
        baseURL: settings.geminiApiUrl,
        headers: {
            'Authorization': `Bearer ${settings.geminiApiKey}`,
            'Content-Type': 'application/json',
        },
    });
};
