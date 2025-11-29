import React from 'react';
import { useTaskStore } from '../store/taskStore';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Gallery: React.FC = () => {
    const { t } = useTranslation();
    const { tasks = [] } = useTaskStore();
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">{t('gallery.title')}</h2>
                <p className="text-zinc-400">{t('gallery.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedTasks.map((task) => (
                    <div key={task.id} className="group relative bg-zinc-900/50 rounded-xl border border-white/10 overflow-hidden">
                        <div className="aspect-video bg-black relative">
                            {task.thumbnail ? (
                                <img src={task.thumbnail} alt={task.prompt} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">No Preview</div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button className="p-3 bg-white rounded-full text-black hover:scale-110 transition-transform">
                                    <Play size={24} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-zinc-300 line-clamp-2 mb-3">{task.prompt}</p>
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                <span>{task.duration}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {completedTasks.length === 0 && (
                    <div className="col-span-full py-20 text-center text-zinc-500">
                        {t('gallery.noVideos')}
                    </div>
                )}
            </div>
        </div>
    );
};
