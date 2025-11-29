import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VideoTask } from '../types';

interface TaskState {
    tasks: VideoTask[];
    totalApiCalls: number;
    totalVideosGenerated: number;
    apiCallTimestamps: number[]; // Store timestamps of API calls
    videoGeneratedTimestamps: number[]; // Store timestamps of video generations
    addTask: (task: VideoTask) => void;
    updateTask: (id: string, updates: Partial<VideoTask>) => void;
    deleteTask: (id: string) => void;
    incrementApiCalls: () => void;
    incrementVideosGenerated: () => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set) => ({
            tasks: [],
            totalApiCalls: 0,
            totalVideosGenerated: 0,
            apiCallTimestamps: [],
            videoGeneratedTimestamps: [],
            addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
            updateTask: (id, updates) =>
                set((state) => ({
                    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
                })),
            deleteTask: (id) =>
                set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
            incrementApiCalls: () =>
                set((state) => {
                    const now = Date.now();
                    // Keep only last 30 days of timestamps to prevent unlimited growth
                    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
                    const recentTimestamps = state.apiCallTimestamps.filter(t => t > thirtyDaysAgo);
                    return {
                        totalApiCalls: state.totalApiCalls + 1,
                        apiCallTimestamps: [...recentTimestamps, now]
                    };
                }),
            incrementVideosGenerated: () =>
                set((state) => {
                    const now = Date.now();
                    // Keep only last 30 days of timestamps to prevent unlimited growth
                    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
                    const recentTimestamps = state.videoGeneratedTimestamps.filter(t => t > thirtyDaysAgo);
                    return {
                        totalVideosGenerated: state.totalVideosGenerated + 1,
                        videoGeneratedTimestamps: [...recentTimestamps, now]
                    };
                }),
        }),
        {
            name: 'video-tasks',
        }
    )
);
