import React, { useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import { Video, Activity, Zap, HardDrive } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const { tasks = [], totalApiCalls = 0, totalVideosGenerated = 0, apiCallTimestamps = [], videoGeneratedTimestamps = [] } = useTaskStore();

    // Calculate real statistics
    const statistics = useMemo(() => {
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const processingTasks = tasks.filter(t => t.status === 'processing');
        const failedTasks = tasks.filter(t => t.status === 'failed');

        // Calculate storage: estimate based on video count and average size
        // Average video size: ~50MB for 5s, ~150MB for 15s
        const estimatedStorageMB = completedTasks.reduce((total, task) => {
            const durationInSeconds = parseInt(task.duration) || 5;
            const estimatedSize = (durationInSeconds / 5) * 50; // 50MB per 5 seconds
            return total + estimatedSize;
        }, 0);

        const storageGB = (estimatedStorageMB / 1024).toFixed(2);
        const storageMB = estimatedStorageMB.toFixed(0);
        const storageDisplay = estimatedStorageMB >= 1024
            ? `${storageGB} GB`
            : `${storageMB} MB`;

        // Calculate 24-hour statistics using persistent timestamps
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recent24hApiCalls = (apiCallTimestamps || []).filter(t => t > oneDayAgo).length;
        const recent24hVideos = (videoGeneratedTimestamps || []).filter(t => t > oneDayAgo).length;

        return {
            totalVideos: totalVideosGenerated,
            recent24hVideos: recent24hVideos,
            videoDisplay: `${recent24hVideos}/${totalVideosGenerated}`,
            apiCalls: totalApiCalls,
            recent24hApiCalls: recent24hApiCalls,
            apiDisplay: `${recent24hApiCalls}/${totalApiCalls}`,
            processing: processingTasks.length,
            processingStatus: processingTasks.length > 0 ? t('dashboard.active') : t('dashboard.idle'),
            storage: storageDisplay,
            storageType: estimatedStorageMB > 0 ? t('dashboard.local') : t('dashboard.empty'),
            failed: failedTasks.length,
        };
    }, [tasks, totalApiCalls, totalVideosGenerated, apiCallTimestamps, videoGeneratedTimestamps, t]);

    const stats = [
        {
            label: t('dashboard.totalVideos'),
            value: statistics.videoDisplay,
            icon: Video,
            change: t('dashboard.hour24Total'),
            changeColor: 'text-green-400 bg-green-900/20',
        },
        {
            label: t('dashboard.apiCalls'),
            value: statistics.apiDisplay,
            icon: Activity,
            change: t('dashboard.hour24Total'),
            changeColor: 'text-blue-400 bg-blue-900/20',
        },
        {
            label: t('dashboard.processing'),
            value: statistics.processing,
            icon: Zap,
            change: statistics.processingStatus,
            changeColor: statistics.processing > 0 ? 'text-yellow-400 bg-yellow-900/20' : 'text-zinc-400 bg-zinc-900/20',
        },
        {
            label: t('dashboard.storageUsed'),
            value: statistics.storage,
            icon: HardDrive,
            change: statistics.storageType,
            changeColor: 'text-purple-400 bg-purple-900/20',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h2>
                <p className="text-zinc-400">{t('dashboard.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-zinc-900/50 p-6 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-white/5 rounded-lg text-white">
                                <stat.icon size={20} />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.changeColor}`}>
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                        <p className="text-sm text-zinc-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/50 rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-bold mb-4">{t('dashboard.recentActivity')}</h3>
                <div className="space-y-4">
                    {tasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                                    task.status === 'processing' ? 'bg-blue-500' :
                                        task.status === 'failed' ? 'bg-red-500' : 'bg-zinc-500'
                                    }`} />
                                <div>
                                    <p className="text-sm font-medium text-white line-clamp-1">{task.prompt}</p>
                                    <p className="text-xs text-zinc-500">{new Date(task.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <span className="text-xs text-zinc-400 capitalize">{task.status}</span>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <p className="text-zinc-500 text-sm">{t('dashboard.noActivity')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
