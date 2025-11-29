import { createSoraClient } from './api';
import type { GenerationMode } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';

export interface SoraGenerationParams {
    prompt: string;
    model: string;
    generationMode: GenerationMode;
    imageBase64?: string;
    remixVideoUrl?: string;
    videoBase64?: string; // For character creation
}

export interface StreamCallbacks {
    onProgress?: (progress: number, message: string) => void;
    onComplete?: (videoUrl: string) => void;
    onError?: (error: string) => void;
}

// Parse SSE data line
function parseSSEData(line: string): {
    progress?: number;
    message?: string;
    videoUrl?: string;
    isDone?: boolean;
} {
    if (line === 'data: [DONE]') {
        return { isDone: true };
    }

    if (!line.startsWith('data: ')) {
        return {};
    }

    try {
        const jsonStr = line.slice(6); // Remove 'data: ' prefix
        const data = JSON.parse(jsonStr);
        const delta = data.choices?.[0]?.delta;

        if (!delta) return {};

        // Check for progress in reasoning_content
        if (delta.reasoning_content) {
            const progressMatch = delta.reasoning_content.match(/(\d+)%/);
            if (progressMatch) {
                return {
                    progress: parseInt(progressMatch[1], 10),
                    message: delta.reasoning_content.trim()
                };
            }
            return { message: delta.reasoning_content.trim() };
        }

        // Check for video URL in content
        if (delta.content) {
            // Extract video URL from HTML video tag
            const videoMatch = delta.content.match(/src='([^']+)'/);
            if (videoMatch) {
                return { videoUrl: videoMatch[1] };
            }
        }

        return {};
    } catch {
        return {};
    }
}

export interface SoraModel {
    id: string;
    object: string;
    owned_by: string;
    description: string;
}

export interface ModelsResponse {
    object: string;
    data: SoraModel[];
}

export const soraApi = {
    getModels: async (): Promise<SoraModel[]> => {
        const client = createSoraClient();
        const response = await client.get<ModelsResponse>('/v1/models');
        return response.data.data;
    },

    generateVideo: async (params: SoraGenerationParams, callbacks?: StreamCallbacks) => {
        const { settings } = useSettingsStore.getState();
        const { incrementApiCalls } = useTaskStore.getState();

        // Increment API call counter
        incrementApiCalls();

        // Build content based on generation mode
        let content: string | Array<{type: string; text?: string; image_url?: {url: string}; video_url?: {url: string}}>;

        switch (params.generationMode) {
            case 'text-to-video':
                content = params.prompt;
                break;

            case 'image-to-video':
                if (params.imageBase64) {
                    content = [
                        { type: 'text', text: params.prompt },
                        { type: 'image_url', image_url: { url: params.imageBase64 } }
                    ];
                } else {
                    content = params.prompt;
                }
                break;

            case 'remix':
                content = params.remixVideoUrl ? `${params.remixVideoUrl}${params.prompt}` : params.prompt;
                break;

            case 'create-character':
                // Upload video to create character
                if (params.videoBase64) {
                    content = [
                        { type: 'video_url', video_url: { url: params.videoBase64 } }
                    ];
                } else {
                    content = params.prompt;
                }
                break;

            case 'character-to-video':
                // Generate video with character
                if (params.videoBase64) {
                    content = [
                        { type: 'video_url', video_url: { url: params.videoBase64 } },
                        { type: 'text', text: params.prompt }
                    ];
                } else {
                    content = params.prompt;
                }
                break;

            default:
                content = params.prompt;
        }

        const response = await fetch(`${settings.soraApiUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.soraApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: params.model,
                messages: [{ role: 'user', content }],
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            callbacks?.onError?.(errorText || `HTTP error ${response.status}`);
            throw new Error(errorText || `HTTP error ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            callbacks?.onError?.('No response body');
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let videoUrl = '';
        let hasCompleted = false;

        try {
            while (true) {
                let chunk;
                try {
                    chunk = await reader.read();
                } catch (readError) {
                    // Connection interrupted - check if we have video URL
                    console.log('Stream read error:', readError);
                    console.log('Current videoUrl value:', videoUrl);
                    console.log('hasCompleted:', hasCompleted);
                    if (videoUrl && !hasCompleted) {
                        console.log('Video URL found despite error, marking as complete');
                        hasCompleted = true;
                        callbacks?.onComplete?.(videoUrl);
                        return videoUrl;
                    }
                    // No video URL received before connection closed
                    console.error('Connection closed before receiving video URL');
                    const errorMsg = 'Connection interrupted - video generation may still be in progress on server';
                    callbacks?.onError?.(errorMsg);
                    throw new Error(errorMsg);
                }

                const { done, value } = chunk;
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    const parsed = parseSSEData(trimmedLine);

                    if (parsed.progress !== undefined && parsed.message) {
                        callbacks?.onProgress?.(parsed.progress, parsed.message);
                    } else if (parsed.message) {
                        callbacks?.onProgress?.(0, parsed.message);
                    }

                    if (parsed.videoUrl) {
                        videoUrl = parsed.videoUrl;
                        console.log('Video URL extracted:', videoUrl);
                    }

                    if (parsed.isDone && videoUrl && !hasCompleted) {
                        hasCompleted = true;
                        callbacks?.onComplete?.(videoUrl);
                    }
                }
            }

            // Process any remaining buffer
            if (buffer.trim()) {
                const parsed = parseSSEData(buffer.trim());
                if (parsed.videoUrl) {
                    videoUrl = parsed.videoUrl;
                }
            }

            // If we have a video URL but haven't called onComplete yet, call it now
            if (videoUrl && !hasCompleted) {
                hasCompleted = true;
                callbacks?.onComplete?.(videoUrl);
            }

            return videoUrl;
        } catch (streamError) {
            // Handle stream errors - if we already have the video URL, consider it a success
            if (videoUrl && !hasCompleted) {
                hasCompleted = true;
                callbacks?.onComplete?.(videoUrl);
                return videoUrl;
            }

            // Check if it's a network error (likely due to copyright restriction)
            const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
            if (errorMessage.includes('network error') || errorMessage.includes('INCOMPLETE_CHUNKED_ENCODING')) {
                const detailedError = 'Video generation failed. This may be due to content restrictions or copyright issues. Please try a different prompt or style.';
                callbacks?.onError?.(detailedError);
                throw new Error(detailedError);
            }

            // Re-throw if we don't have a video URL
            throw streamError;
        } finally {
            reader.releaseLock();
        }
    },

    // Character creation - upload video to create character (backend only, no UI)
    createCharacter: async (videoBase64: string, model: string) => {
        const client = createSoraClient();

        const content = [
            {
                type: 'video_url',
                video_url: {
                    url: videoBase64
                }
            }
        ];

        const response = await client.post('/v1/chat/completions', {
            model,
            messages: [
                {
                    role: 'user',
                    content
                }
            ],
            stream: true
        }, {
            responseType: 'stream'
        });

        return response.data;
    },

    // Generate video with character (backend only, no UI)
    generateWithCharacter: async (videoBase64: string, prompt: string, model: string) => {
        const client = createSoraClient();

        const content = [
            {
                type: 'video_url',
                video_url: {
                    url: videoBase64
                }
            },
            {
                type: 'text',
                text: prompt
            }
        ];

        const response = await client.post('/v1/chat/completions', {
            model,
            messages: [
                {
                    role: 'user',
                    content
                }
            ],
            stream: true
        }, {
            responseType: 'stream'
        });

        return response.data;
    },

    getTaskStatus: async (taskId: string) => {
        const client = createSoraClient();
        const response = await client.get(`/v1/video/generations/${taskId}`);
        return response.data;
    }
};
