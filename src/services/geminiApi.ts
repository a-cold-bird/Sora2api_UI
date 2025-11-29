import { createGeminiClient } from './api';

export interface GeminiModel {
    name: string;
    displayName?: string;
    description?: string;
}

export interface GenerateContentParams {
    model: string;
    prompt: string;
    imageBase64?: string;
}

export const geminiApi = {
    getModels: async (): Promise<GeminiModel[]> => {
        try {
            const client = createGeminiClient();
            // Gemini API models endpoint
            const response = await client.get('/models');
            // Response format may vary, adjust based on actual API
            return response.data.models || response.data || [];
        } catch (error) {
            console.error('Failed to fetch Gemini models:', error);
            // Return fallback models
            return [
                { name: 'gemini-pro', displayName: 'Gemini Pro' },
                { name: 'gemini-pro-vision', displayName: 'Gemini Pro Vision' },
            ];
        }
    },

    generateContent: async (params: GenerateContentParams) => {
        const client = createGeminiClient();

        // Build content based on whether image is provided
        let content;
        if (params.imageBase64) {
            // Multimodal input: text + image
            content = [
                { text: params.prompt },
                {
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: params.imageBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix
                    }
                }
            ];
        } else {
            // Text-only input
            content = [{ text: params.prompt }];
        }

        // Gemini API generateContent endpoint
        // Model name already includes 'models/' prefix (e.g., 'models/gemini-pro')
        // So we just append :generateContent directly
        const response = await client.post(`/${params.model}:generateContent`, {
            contents: [{
                parts: content
            }]
        });

        return response.data;
    },

    generateImage: async (params: GenerateContentParams) => {
        // For image generation, use the same generateContent method
        // The model should be an image generation model like gemini-pro-image
        return geminiApi.generateContent(params);
    },

    generatePrompt: async (params: GenerateContentParams) => {
        // For prompt generation, use generateContent with specific instructions
        const enhancedPrompt = params.imageBase64
            ? `Based on the following text and image, generate an optimized, detailed prompt for AI image generation:\n\n${params.prompt}`
            : `Generate an optimized, detailed prompt for AI image generation based on this idea:\n\n${params.prompt}`;

        return geminiApi.generateContent({
            ...params,
            prompt: enhancedPrompt
        });
    }
};
