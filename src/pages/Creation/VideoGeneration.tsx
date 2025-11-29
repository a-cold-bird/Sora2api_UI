import React, { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { soraApi, type SoraModel } from '../../services/soraApi';
import { Play, Trash2, RefreshCw, Plus, Upload, X, Image as ImageIcon, Type, Repeat, Eye, Download, User, UserPlus } from 'lucide-react';
import type { VideoTask, GenerationMode } from '../../types';

export const VideoGeneration: React.FC = () => {
    const { tasks = [], addTask, updateTask, deleteTask, incrementVideosGenerated } = useTaskStore();
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'landscape' | 'portrait'>('landscape');
    const [duration, setDuration] = useState<'10s' | '15s'>('10s');
    const [models, setModels] = useState<SoraModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [generationMode, setGenerationMode] = useState<GenerationMode>('text-to-video');
    const [remixVideoUrl, setRemixVideoUrl] = useState('');
    const [previewTask, setPreviewTask] = useState<VideoTask | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // Fetch models on component mount
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const modelList = await soraApi.getModels();
                setModels(modelList);
            } catch (error) {
                console.error('Failed to fetch models:', error);
                // Fallback to default models based on README
                setModels([
                    { id: 'sora-video-landscape-10s', object: 'model', owned_by: 'sora2api', description: 'Video generation - landscape 10s' },
                    { id: 'sora-video-landscape-15s', object: 'model', owned_by: 'sora2api', description: 'Video generation - landscape 15s' },
                    { id: 'sora-video-portrait-10s', object: 'model', owned_by: 'sora2api', description: 'Video generation - portrait 10s' },
                    { id: 'sora-video-portrait-15s', object: 'model', owned_by: 'sora2api', description: 'Video generation - portrait 15s' },
                ]);
            } finally {
                setIsLoadingModels(false);
            }
        };
        fetchModels();
    }, []);

    // Get the selected model ID based on aspect ratio and duration
    const getSelectedModelId = (): string => {
        return `sora-video-${aspectRatio}-${duration}`;
    };

    // Get video models only
    const videoModels = models?.filter(m => m.id.startsWith('sora-video')) || [];

    // Handle image upload
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

    // Remove uploaded image
    const removeImage = () => {
        setUploadedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle video upload
    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;
                setUploadedVideo(base64);
                setVideoPreview(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove uploaded video
    const removeVideo = () => {
        setUploadedVideo(null);
        setVideoPreview(null);
        if (videoInputRef.current) {
            videoInputRef.current.value = '';
        }
    };

    const handleAddTask = () => {
        // Validate based on mode
        if (generationMode === 'image-to-video' && !uploadedImage) {
            alert('Please upload an image for Image to Video mode');
            return;
        }
        if (generationMode === 'remix' && !remixVideoUrl) {
            alert('Please enter a video URL for Remix mode');
            return;
        }
        if (generationMode === 'create-character' && !uploadedVideo) {
            alert('Please upload a video to create a character');
            return;
        }
        if (generationMode === 'character-to-video' && !uploadedVideo) {
            alert('Please upload a character video for Character to Video mode');
            return;
        }
        if (generationMode === 'character-to-video' && !prompt) {
            alert('Please enter a prompt for Character to Video mode');
            return;
        }

        const modelId = getSelectedModelId();
        const newTask: VideoTask = {
            id: crypto.randomUUID(),
            sequenceNumber: tasks.length + 1,
            prompt: prompt || 'Create character from video',
            status: 'pending',
            createdAt: Date.now(),
            model: modelId,
            aspectRatio,
            duration,
            generationMode,
            imageBase64: generationMode === 'image-to-video' ? (uploadedImage || undefined) : undefined,
            remixVideoUrl: generationMode === 'remix' ? remixVideoUrl : undefined,
            videoBase64: (generationMode === 'create-character' || generationMode === 'character-to-video') ? (uploadedVideo || undefined) : undefined,
        };
        addTask(newTask);
        setPrompt('');
        removeImage();
        removeVideo();
        setRemixVideoUrl('');
    };

    // Get mode display info
    const getModeInfo = (mode: GenerationMode) => {
        switch (mode) {
            case 'text-to-video':
                return { icon: Type, label: 'Text to Video', color: 'text-green-400' };
            case 'image-to-video':
                return { icon: ImageIcon, label: 'Image to Video', color: 'text-blue-400' };
            case 'remix':
                return { icon: Repeat, label: 'Remix', color: 'text-purple-400' };
            case 'create-character':
                return { icon: UserPlus, label: 'Create Character', color: 'text-yellow-400' };
            case 'character-to-video':
                return { icon: User, label: 'Character to Video', color: 'text-orange-400' };
        }
    };

    // Generate thumbnail from video URL
    const generateThumbnail = (videoUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.src = videoUrl;
            video.muted = true;

            video.onloadeddata = () => {
                // Seek to first frame
                video.currentTime = 0.1;
            };

            video.onseeked = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                        resolve(thumbnail);
                    } else {
                        reject(new Error('Failed to get canvas context'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            video.onerror = () => {
                reject(new Error('Failed to load video'));
            };

            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Thumbnail generation timeout'));
            }, 10000);
        });
    };

    // Download video
    const handleDownload = async (task: VideoTask) => {
        if (!task.videoUrl) return;

        setIsDownloading(task.id);
        try {
            const response = await fetch(task.videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sora-video-${task.id.slice(0, 8)}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: open in new tab
            window.open(task.videoUrl, '_blank');
        } finally {
            setIsDownloading(null);
        }
    };

    const handleGenerate = async (task: VideoTask) => {
        updateTask(task.id, { status: 'processing', progress: 0, progressMessage: 'Starting generation...' });

        try {
            await soraApi.generateVideo(
                {
                    prompt: task.prompt,
                    model: task.model,
                    generationMode: task.generationMode,
                    imageBase64: task.imageBase64,
                    remixVideoUrl: task.remixVideoUrl,
                    videoBase64: task.videoBase64,
                },
                {
                    onProgress: (progress, message) => {
                        updateTask(task.id, {
                            progress,
                            progressMessage: message
                        });
                    },
                    onComplete: async (videoUrl) => {
                        // Increment total videos generated counter
                        incrementVideosGenerated();

                        // First update with video URL
                        updateTask(task.id, {
                            status: 'completed',
                            videoUrl,
                            progress: 100,
                            progressMessage: 'Generation completed!'
                        });

                        // Then try to generate thumbnail
                        try {
                            const thumbnail = await generateThumbnail(videoUrl);
                            updateTask(task.id, { thumbnail });
                        } catch (error) {
                            console.error('Failed to generate thumbnail:', error);
                            // Thumbnail generation failed, but video is still available
                        }
                    },
                    onError: (error) => {
                        console.error('Generation error:', error);
                        updateTask(task.id, {
                            status: 'failed',
                            progressMessage: `Error: ${error}`
                        });
                    }
                }
            );
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Provide user-friendly error message
            let displayMessage = errorMessage;
            if (errorMessage.includes('network error') || errorMessage.includes('INCOMPLETE_CHUNKED_ENCODING')) {
                displayMessage = 'Generation failed: Possible content restriction or copyright issue. Try a different prompt.';
            } else if (errorMessage.includes('content restrictions') || errorMessage.includes('copyright')) {
                displayMessage = errorMessage; // Use the detailed message from soraApi
            }

            updateTask(task.id, {
                status: 'failed',
                progressMessage: displayMessage
            });
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Input Section */}
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/10 space-y-4">
                {/* Mode Selector */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Generation Mode</label>
                    <div className="flex flex-wrap gap-2">
                        {(['text-to-video', 'image-to-video', 'remix', 'create-character', 'character-to-video'] as GenerationMode[]).map((mode) => {
                            const info = getModeInfo(mode);
                            const Icon = info.icon;
                            return (
                                <button
                                    key={mode}
                                    onClick={() => setGenerationMode(mode)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${generationMode === mode
                                        ? 'bg-white/10 border-white/30 text-white'
                                        : 'bg-black border-white/10 text-zinc-400 hover:border-white/20'
                                        }`}
                                >
                                    <Icon size={16} className={generationMode === mode ? info.color : ''} />
                                    <span className="text-sm">{info.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">
                                Prompt
                                {generationMode === 'character-to-video' && <span className="text-red-400"> *</span>}
                                {generationMode === 'create-character' && <span className="text-zinc-500"> (Optional)</span>}
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-24 bg-black border border-white/10 rounded-lg p-3 focus:outline-none focus:border-white transition-colors resize-none"
                                placeholder={
                                    generationMode === 'remix'
                                        ? "Describe how to modify the video (e.g., 'change to watercolor style')"
                                        : generationMode === 'create-character'
                                            ? "Optional: Add description for the character..."
                                            : generationMode === 'character-to-video'
                                                ? "Describe the action for the character..."
                                                : "Describe your video..."
                                }
                            />
                        </div>

                        {/* Image Upload Section - only for image-to-video mode */}
                        {generationMode === 'image-to-video' && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    Reference Image <span className="text-red-400">*</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    {!imagePreview ? (
                                        <label
                                            htmlFor="image-upload"
                                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors"
                                        >
                                            <Upload size={16} />
                                            <span className="text-sm">Upload Image</span>
                                        </label>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    onClick={removeImage}
                                                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                            <span className="text-sm text-zinc-400">Image uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Remix Video URL - only for remix mode */}
                        {generationMode === 'remix' && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    Video URL <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={remixVideoUrl}
                                    onChange={(e) => setRemixVideoUrl(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-lg p-3 focus:outline-none focus:border-white transition-colors"
                                    placeholder="https://sora.chatgpt.com/p/s_..."
                                />
                                <p className="text-xs text-zinc-500 mt-1">
                                    Enter a Sora video URL to remix
                                </p>
                            </div>
                        )}

                        {/* Video Upload Section - for character modes */}
                        {(generationMode === 'create-character' || generationMode === 'character-to-video') && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">
                                    {generationMode === 'create-character' ? 'Character Video' : 'Reference Video'} <span className="text-red-400">*</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        ref={videoInputRef}
                                        onChange={handleVideoUpload}
                                        accept="video/*"
                                        className="hidden"
                                        id="video-upload"
                                    />
                                    {!videoPreview ? (
                                        <label
                                            htmlFor="video-upload"
                                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors"
                                        >
                                            <Upload size={16} />
                                            <span className="text-sm">Upload Video</span>
                                        </label>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/10 bg-black">
                                                <video
                                                    src={videoPreview}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                    preload="metadata"
                                                />
                                                <button
                                                    onClick={removeVideo}
                                                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 hover:bg-red-600 transition-colors z-10"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                            <span className="text-sm text-zinc-400">Video uploaded</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {generationMode === 'create-character'
                                        ? 'Upload a video to extract and create a character'
                                        : 'Upload a character video reference to generate new content'}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="w-64 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Aspect Ratio</label>
                            <select
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value as 'landscape' | 'portrait')}
                                className="w-full bg-black border border-white/10 rounded-lg p-2 focus:outline-none focus:border-white"
                            >
                                <option value="landscape">16:9 (Landscape)</option>
                                <option value="portrait">9:16 (Portrait)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Duration</label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value as '10s' | '15s')}
                                className="w-full bg-black border border-white/10 rounded-lg p-2 focus:outline-none focus:border-white"
                            >
                                <option value="10s">10 Seconds</option>
                                <option value="15s">15 Seconds</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Model</label>
                            <div className="text-xs text-zinc-500 bg-black border border-white/10 rounded-lg p-2">
                                {isLoadingModels ? (
                                    <span>Loading models...</span>
                                ) : (
                                    <span className="text-zinc-300">{getSelectedModelId()}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="text-xs text-zinc-500">
                        {videoModels.length > 0 && (
                            <span>{videoModels.length} video models available</span>
                        )}
                    </div>
                    <button
                        onClick={handleAddTask}
                        disabled={
                            (generationMode !== 'create-character' && !prompt) ||
                            (generationMode === 'image-to-video' && !uploadedImage) ||
                            (generationMode === 'remix' && !remixVideoUrl) ||
                            ((generationMode === 'create-character' || generationMode === 'character-to-video') && !uploadedVideo)
                        }
                        className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={18} />
                        Add to Queue
                    </button>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-auto bg-zinc-900/50 rounded-xl border border-white/10">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/50 sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                            <th className="p-4 font-medium text-zinc-400 border-b border-white/10">#</th>
                            <th className="p-4 font-medium text-zinc-400 border-b border-white/10">Thumbnail</th>
                            <th className="p-4 font-medium text-zinc-400 border-b border-white/10 w-1/2">Prompt</th>
                            <th className="p-4 font-medium text-zinc-400 border-b border-white/10">Status</th>
                            <th className="p-4 font-medium text-zinc-400 border-b border-white/10 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task, index) => (
                            <tr key={task.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 text-zinc-500">{tasks.length - index}</td>
                                <td className="p-4">
                                    <div
                                        className={`w-24 h-16 bg-black rounded-lg overflow-hidden border border-white/10 flex items-center justify-center relative group ${task.status === 'completed' && task.videoUrl ? 'cursor-pointer' : ''
                                            }`}
                                        onClick={() => {
                                            if (task.status === 'completed' && task.videoUrl) {
                                                setPreviewTask(task);
                                            }
                                        }}
                                    >
                                        {task.thumbnail ? (
                                            <img src={task.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                        ) : task.status === 'completed' && task.videoUrl ? (
                                            <video
                                                src={task.videoUrl}
                                                className="w-full h-full object-cover"
                                                muted
                                                preload="metadata"
                                                onLoadedData={(e) => {
                                                    // Set video to first frame
                                                    (e.target as HTMLVideoElement).currentTime = 0.1;
                                                }}
                                            />
                                        ) : (
                                            <div className="text-zinc-600 text-xs">No Preview</div>
                                        )}
                                        {task.status === 'completed' && task.videoUrl && (
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Eye size={16} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="space-y-1">
                                        <p className="line-clamp-2 text-sm text-zinc-300">{task.prompt}</p>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <span>{task.model}</span>
                                            {task.generationMode && (() => {
                                                const info = getModeInfo(task.generationMode);
                                                const Icon = info.icon;
                                                return (
                                                    <span className={`flex items-center gap-1 ${info.color}`}>
                                                        <Icon size={10} />
                                                        {info.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="space-y-2">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed'
                                                ? 'bg-green-900/30 text-green-400'
                                                : task.status === 'processing'
                                                    ? 'bg-blue-900/30 text-blue-400'
                                                    : task.status === 'failed'
                                                        ? 'bg-red-900/30 text-red-400'
                                                        : 'bg-zinc-800 text-zinc-400'
                                                }`}
                                        >
                                            {task.status.toUpperCase()}
                                        </span>
                                        {task.status === 'processing' && task.progress !== undefined && (
                                            <div className="space-y-1">
                                                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                                    <div
                                                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${task.progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-zinc-500 truncate max-w-32">
                                                    {task.progress}%
                                                </p>
                                            </div>
                                        )}
                                        {task.status === 'failed' && task.progressMessage && (
                                            <p className="text-xs text-red-400 truncate max-w-32" title={task.progressMessage}>
                                                {task.progressMessage}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {task.status === 'pending' && (
                                            <button
                                                onClick={() => handleGenerate(task)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                                                title="Generate"
                                            >
                                                <Play size={16} />
                                            </button>
                                        )}
                                        {task.status === 'completed' && task.videoUrl && (
                                            <>
                                                <button
                                                    onClick={() => setPreviewTask(task)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                                                    title="Preview"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(task)}
                                                    disabled={isDownloading === task.id}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors disabled:opacity-50"
                                                    title="Download"
                                                >
                                                    <Download size={16} className={isDownloading === task.id ? 'animate-pulse' : ''} />
                                                </button>
                                                <button
                                                    onClick={() => handleGenerate(task)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                                                    title="Regenerate"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="p-2 hover:bg-red-900/20 rounded-lg text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {tasks.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500">
                                    No tasks yet. Add one above to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Video Preview Modal */}
            {previewTask && previewTask.videoUrl && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
                    onClick={() => setPreviewTask(null)}
                >
                    <div
                        className="bg-zinc-900 rounded-xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-medium text-white truncate">Video Preview</h3>
                                <p className="text-sm text-zinc-400 truncate">{previewTask.prompt}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => handleDownload(previewTask)}
                                    disabled={isDownloading === previewTask.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                >
                                    <Download size={16} />
                                    {isDownloading === previewTask.id ? 'Downloading...' : 'Download'}
                                </button>
                                <button
                                    onClick={() => setPreviewTask(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        {/* Video Player */}
                        <div className="p-4">
                            <video
                                src={previewTask.videoUrl}
                                controls
                                autoPlay
                                className="w-full rounded-lg bg-black"
                                style={{ maxHeight: 'calc(90vh - 120px)' }}
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        {/* Modal Footer */}
                        <div className="px-4 pb-4 flex items-center justify-between text-xs text-zinc-500">
                            <span>Model: {previewTask.model}</span>
                            <span>
                                {(() => {
                                    const info = getModeInfo(previewTask.generationMode);
                                    return info.label;
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
