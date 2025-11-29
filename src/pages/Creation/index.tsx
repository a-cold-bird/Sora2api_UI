import React, { useState } from 'react';
import { VideoGeneration } from './VideoGeneration';
import { ImagePromptGeneration } from './ImagePromptGeneration';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

type Tab = 'video' | 'image' | 'prompt';

export const Creation: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('video');

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('video')}
                    className={clsx(
                        'px-4 py-2 rounded-lg transition-colors',
                        activeTab === 'video' ? 'bg-white text-black font-medium' : 'text-zinc-400 hover:text-white'
                    )}
                >
                    {t('creation.videoGenerationTab')}
                </button>
                <button
                    onClick={() => setActiveTab('image')}
                    className={clsx(
                        'px-4 py-2 rounded-lg transition-colors',
                        activeTab === 'image' ? 'bg-white text-black font-medium' : 'text-zinc-400 hover:text-white'
                    )}
                >
                    {t('creation.imageGenerationTab')}
                </button>
                <button
                    onClick={() => setActiveTab('prompt')}
                    className={clsx(
                        'px-4 py-2 rounded-lg transition-colors',
                        activeTab === 'prompt' ? 'bg-white text-black font-medium' : 'text-zinc-400 hover:text-white'
                    )}
                >
                    {t('creation.promptGenerationTab')}
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'video' && <VideoGeneration />}
                {(activeTab === 'image' || activeTab === 'prompt') && (
                    <ImagePromptGeneration mode={activeTab} />
                )}
            </div>
        </div>
    );
};
