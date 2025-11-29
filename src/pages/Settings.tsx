import React, { useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { Save, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { soraApi, type SoraModel } from '../services/soraApi';
import { geminiApi, type GeminiModel } from '../services/geminiApi';

export const SettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const { settings, updateSettings } = useSettingsStore();
    const [localSettings, setLocalSettings] = React.useState(settings);
    const [soraModels, setSoraModels] = useState<SoraModel[]>([]);
    const [geminiModels, setGeminiModels] = useState<GeminiModel[]>([]);
    const [fetchingSora, setFetchingSora] = useState(false);
    const [fetchingGemini, setFetchingGemini] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalSettings((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        updateSettings(localSettings);
        alert(t('settings.settingsSaved'));
    };

    const handleFetchSoraModels = async () => {
        setFetchingSora(true);
        try {
            // Temporarily update settings to use current input values
            updateSettings(localSettings);
            const models = await soraApi.getModels();
            setSoraModels(models);
            alert(t('settings.modelsFetched'));
        } catch (error) {
            console.error('Failed to fetch Sora models:', error);
            alert(t('settings.modelsError'));
        } finally {
            setFetchingSora(false);
        }
    };

    const handleFetchGeminiModels = async () => {
        setFetchingGemini(true);
        try {
            // Temporarily update settings to use current input values
            updateSettings(localSettings);
            const models = await geminiApi.getModels();
            setGeminiModels(models);
            alert(t('settings.modelsFetched'));
        } catch (error) {
            console.error('Failed to fetch Gemini models:', error);
            alert(t('settings.modelsError'));
        } finally {
            setFetchingGemini(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold mb-2">{t('settings.title')}</h2>
                <p className="text-zinc-400">{t('settings.subtitle')}</p>
            </div>

            {/* Sora API Configuration */}
            <div className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-xl font-semibold">{t('settings.soraApi')}</h3>
                    <button
                        onClick={handleFetchSoraModels}
                        disabled={fetchingSora || !localSettings.soraApiUrl || !localSettings.soraApiKey}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <RefreshCw size={16} className={fetchingSora ? 'animate-spin' : ''} />
                        {fetchingSora ? t('settings.fetchingModels') : t('settings.fetchModels')}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">{t('settings.soraApiUrl')}</label>
                            <input
                                type="text"
                                name="soraApiUrl"
                                value={localSettings.soraApiUrl}
                                onChange={handleChange}
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-white transition-colors"
                                placeholder={t('settings.soraApiUrlPlaceholder')}
                            />
                            <p className="text-xs text-zinc-500 mt-1">{t('settings.soraApiUrlHint')}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">{t('settings.soraApiKey')}</label>
                            <input
                                type="password"
                                name="soraApiKey"
                                value={localSettings.soraApiKey}
                                onChange={handleChange}
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-white transition-colors"
                                placeholder={t('settings.soraApiKeyPlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Sora Models Display */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">{t('settings.availableModels')}</label>
                        <div className="bg-black border border-white/10 rounded-lg p-4 max-h-48 overflow-y-auto">
                            {soraModels.length > 0 ? (
                                <ul className="space-y-2">
                                    {soraModels.map((model) => (
                                        <li key={model.id} className="text-sm">
                                            <div className="text-zinc-300 font-mono">{model.id}</div>
                                            {model.description && (
                                                <div className="text-xs text-zinc-500">{model.description}</div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-zinc-500 text-center py-4">{t('settings.noModels')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gemini API Configuration */}
            <div className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h3 className="text-xl font-semibold">{t('settings.geminiApi')}</h3>
                    <button
                        onClick={handleFetchGeminiModels}
                        disabled={fetchingGemini || !localSettings.geminiApiUrl || !localSettings.geminiApiKey}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <RefreshCw size={16} className={fetchingGemini ? 'animate-spin' : ''} />
                        {fetchingGemini ? t('settings.fetchingModels') : t('settings.fetchModels')}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">{t('settings.geminiApiUrl')}</label>
                            <input
                                type="text"
                                name="geminiApiUrl"
                                value={localSettings.geminiApiUrl}
                                onChange={handleChange}
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-white transition-colors"
                                placeholder={t('settings.soraApiUrlPlaceholder')}
                            />
                            <p className="text-xs text-zinc-500 mt-1">{t('settings.geminiApiUrlHint')}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">{t('settings.geminiApiKey')}</label>
                            <input
                                type="password"
                                name="geminiApiKey"
                                value={localSettings.geminiApiKey}
                                onChange={handleChange}
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-white transition-colors"
                                placeholder={t('settings.soraApiKeyPlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Gemini Models Display */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">{t('settings.availableModels')}</label>
                        <div className="bg-black border border-white/10 rounded-lg p-4 max-h-48 overflow-y-auto">
                            {geminiModels.length > 0 ? (
                                <ul className="space-y-2">
                                    {geminiModels.map((model, index) => (
                                        <li key={index} className="text-sm">
                                            <div className="text-zinc-300 font-mono">{model.name}</div>
                                            {model.displayName && model.displayName !== model.name && (
                                                <div className="text-xs text-zinc-500">{model.displayName}</div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-zinc-500 text-center py-4">{t('settings.noModels')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                >
                    <Save size={18} />
                    {t('settings.saveSettings')}
                </button>
            </div>
        </div>
    );
};
