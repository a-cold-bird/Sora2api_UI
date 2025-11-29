import React, { useState, useEffect, useRef } from 'react';
import { geminiApi, type GeminiModel } from '../../services/geminiApi';
import { Send, Copy, Loader2, Upload, X, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    mode: 'image' | 'prompt';
}

export const ImagePromptGeneration: React.FC<Props> = ({ mode }) => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState<GeminiModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [loadingModels, setLoadingModels] = useState(true);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch models on component mount
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await geminiApi.getModels();

                // --- 修复开始：增加防御性检查 ---
                let modelList: GeminiModel[] = [];

                if (Array.isArray(response)) {
                    // 如果直接是数组，直接使用
                    modelList = response;
                } else if (response && typeof response === 'object') {
                    // 如果是对象，尝试查找内部的 models 字段或者 data 字段
                    // 很多 API 会返回 { models: [...] } 或 { data: [...] }
                    // @ts-ignore - 临时忽略类型检查以处理未知结构
                    modelList = response.models || response.data || [];

                    if (!Array.isArray(modelList)) {
                        console.warn('API returned an object but could not find a model array inside:', response);
                        modelList = [];
                    }
                } else {
                    console.warn('Unexpected response format from getModels:', response);
                }
                // --- 修复结束 ---

                setModels(modelList);

                // Try to load saved model preference for this mode
                const savedModel = localStorage.getItem(`gemini-model-${mode}`);

                // 现在 modelList 确保是数组了，可以安全调用 .some
                if (savedModel && modelList.some(m => m.name === savedModel)) {
                    setSelectedModel(savedModel);
                } else if (modelList.length > 0) {
                    // Auto-select first model if no saved preference
                    setSelectedModel(modelList[0].name);
                }
            } catch (error) {
                console.error('Failed to fetch models:', error);
                setModels([]); // 出错时确保设置为空数组
            } finally {
                setLoadingModels(false);
            }
        };
        fetchModels();
    }, [mode]);

    // Save selected model to localStorage when it changes
    useEffect(() => {
        if (selectedModel) {
            localStorage.setItem(`gemini-model-${mode}`, selectedModel);
        }
    }, [selectedModel, mode]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                setUploadedImage(base64);
                setImagePreview(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setUploadedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Helper function to check if text is base64 image
    const isBase64Image = (text: string): boolean => {
        return text.startsWith('data:image/') ||
            (text.length > 100 && !text.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(text.substring(0, 100)));
    };

    // Helper function to format base64 for display
    const formatBase64Image = (text: string): string => {
        if (text.startsWith('data:image/')) {
            return text;
        }
        // Assume it's PNG if no prefix
        return `data:image/png;base64,${text}`;
    };

    const handleGenerate = async () => {
        if (!input && !uploadedImage) return;
        if (!selectedModel) {
            alert(t('creation.noModelsAvailable'));
            return;
        }

        setLoading(true);
        setGeneratedImageUrl(null);
        try {
            let result;

            if (mode === 'prompt') {
                result = await geminiApi.generatePrompt({
                    model: selectedModel,
                    prompt: input,
                    imageBase64: uploadedImage || undefined
                });
            } else {
                result = await geminiApi.generateImage({
                    model: selectedModel,
                    prompt: input,
                    imageBase64: uploadedImage || undefined
                });
            }

            // --- 修改开始：专门处理 Gemini 的 Image 响应结构 ---

            // 1. 获取第一个 part
            const firstPart = result.candidates?.[0]?.content?.parts?.[0];

            // 2. 检查是否存在 inlineData (这是 Gemini 返回图片的方式)
            if (mode === 'image' && firstPart?.inlineData) {
                const { mimeType, data } = firstPart.inlineData;
                // 构建完整的 Base64 URL
                const imageUrl = `data:${mimeType || 'image/png'};base64,${data}`;

                setGeneratedImageUrl(imageUrl);
                setOutput(t('creation.imageGeneratedSuccess') || 'Image generated successfully!');
            }
            // 3. 如果没有 inlineData，再尝试获取 text
            else {
                const generatedText = firstPart?.text || JSON.stringify(result, null, 2);

                // 兼容逻辑：如果 wrapper 已经把结果处理成了纯 base64 字符串
                if (mode === 'image' && isBase64Image(generatedText)) {
                    const imageUrl = formatBase64Image(generatedText);
                    setGeneratedImageUrl(imageUrl);
                    setOutput('Image generated successfully!');
                } else {
                    setOutput(generatedText);
                }
            }
            // --- 修改结束 ---

        } catch (error) {
            console.error('Generation error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setOutput(`Error: ${errorMessage}\n\nPlease check:\n1. API configuration in Settings\n2. Model name is correct\n3. Network connection`);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
    };

    const handleDownloadImage = () => {
        if (!generatedImageUrl) return;
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        link.download = `generated-image-${Date.now()}.png`;
        link.click();
    };

    return (
        <div className="h-full flex gap-6">
            {/* Input Section */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 flex-1 flex flex-col">
                    <h3 className="text-lg font-medium mb-4 text-zinc-300">{t('creation.input')}</h3>

                    {/* Model Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            {t('creation.selectModel')}
                        </label>
                        {loadingModels ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                <Loader2 size={16} className="animate-spin" />
                                {t('creation.loadingModels')}
                            </div>
                        ) : models.length > 0 ? (
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-white transition-colors"
                            >
                                {models.map((model) => (
                                    <option key={model.name} value={model.name}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-sm text-zinc-500">{t('creation.noModelsAvailable')}</p>
                        )}
                    </div>

                    {/* Image Upload */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            {t('creation.uploadReferenceImage')}
                            <span className="text-xs text-zinc-500 ml-2">({t('creation.multimodalSupport')})</span>
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                            id="reference-image-upload"
                        />
                        {!imagePreview ? (
                            <label
                                htmlFor="reference-image-upload"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors"
                            >
                                <Upload size={16} />
                                <span className="text-sm">{t('creation.uploadReferenceImage')}</span>
                            </label>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-zinc-800 border border-white/10 rounded-lg">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="flex-1 text-sm text-zinc-400">{t('creation.referenceImageUploaded')}</span>
                                <button
                                    onClick={removeImage}
                                    className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors text-red-400"
                                    title={t('creation.removeImage')}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Text Input */}
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-black border border-white/10 rounded-lg p-4 focus:outline-none focus:border-white transition-colors resize-none"
                        placeholder={mode === 'prompt' ? t('creation.inputPlaceholderPrompt') : t('creation.inputPlaceholderImage')}
                    />

                    {/* Generate Button */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || (!input && !uploadedImage) || !selectedModel}
                            className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {t('creation.generateButton')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Output Section */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-zinc-300">{t('creation.output')}</h3>
                        <div className="flex gap-2">
                            {generatedImageUrl && (
                                <button
                                    onClick={handleDownloadImage}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                    title="Download Image"
                                >
                                    <Download size={18} />
                                </button>
                            )}
                            {output && !generatedImageUrl && (
                                <button
                                    onClick={handleCopy}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                    title={t('creation.copy')}
                                >
                                    <Copy size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 bg-black border border-white/10 rounded-lg p-4 overflow-auto">
                        {generatedImageUrl ? (
                            <div className="h-full flex items-center justify-center">
                                <img
                                    src={generatedImageUrl}
                                    alt="Generated"
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            </div>
                        ) : output ? (
                            <div className="whitespace-pre-wrap text-zinc-300">{output}</div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-600">
                                {t('creation.generatedContentPlaceholder')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
