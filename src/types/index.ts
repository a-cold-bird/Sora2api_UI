export interface Settings {
    soraApiUrl: string;
    soraApiKey: string;
    geminiApiUrl: string;
    geminiApiKey: string;
}

export type GenerationMode = 'text-to-video' | 'image-to-video' | 'remix' | 'create-character' | 'character-to-video';

export interface VideoTask {
    id: string;
    sequenceNumber: number;
    thumbnail?: string;
    prompt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: number;
    videoUrl?: string;
    model: string;
    aspectRatio: string;
    duration: string;
    generationMode: GenerationMode;
    imageBase64?: string;
    remixVideoUrl?: string;
    videoBase64?: string; // For character creation and character-to-video
    characterId?: string; // To store created character reference
    progress?: number;
    progressMessage?: string;
}

export interface GeneratedImage {
    id: string;
    prompt: string;
    imageUrl: string;
    createdAt: number;
}

export interface GeneratedPrompt {
    id: string;
    originalInput: string;
    generatedPrompt: string;
    createdAt: number;
}
