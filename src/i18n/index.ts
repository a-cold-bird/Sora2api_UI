import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import zh from './locales/zh';

// Get saved language from localStorage or default to Chinese
const savedLanguage = localStorage.getItem('language') || 'zh';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en,
            zh,
        },
        lng: savedLanguage,
        fallbackLng: 'zh',
        interpolation: {
            escapeValue: false,
        },
    });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('language', lng);
});

export default i18n;
