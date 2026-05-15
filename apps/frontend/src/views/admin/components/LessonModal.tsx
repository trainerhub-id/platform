import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { ButtonLoading } from 'src/components/ui/loading';
import { Icon } from '@iconify/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import api from 'src/api/axios';
import LazyMuxPlayer from 'src/components/shared/LazyMuxPlayer';

// Helper to format seconds to MM:SS
const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
};

interface LessonModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (data: any) => void;
    initialData?: any;
    loading?: boolean;
}

export const LessonModal: React.FC<LessonModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
    initialData,
    loading = false,
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: '00:00',
        videoUrl: '',
        videoType: 'youtube',
    });

    const [uploadType, setUploadType] = useState<'mux' | 'youtube' | 'google-drive'>('mux');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    // Local state to track video existence (can be updated independently of initialData)
    const [localPlaybackId, setLocalPlaybackId] = useState<string | null>(null);
    
    const hasExistingVideo = localPlaybackId && localPlaybackId !== '';

    useEffect(() => {
        if (open) {
            // Initialize local playback ID from initialData when modal opens
            setLocalPlaybackId(initialData?.muxPlaybackId || null);
        }
    }, [open, initialData?.muxPlaybackId]);

    useEffect(() => {
        if (open) {
            setFormData({
                title: initialData?.title || '',
                description: initialData?.description || '',
                duration: initialData?.duration || '00:00',
                videoUrl: initialData?.videoUrl || '',
                videoType: initialData?.videoType || 'youtube',
            });
            setUploadType(
                initialData?.videoType === 'mux' ? 'mux' : 
                initialData?.videoType === 'google-drive' ? 'google-drive' : 
                'youtube'
            );
            setSelectedFile(null);
            setUploadProgress(0);
            setProcessingStatus('');
        }
    }, [open, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Mux Direct Upload
    const handleMuxUpload = async (file: File) => {
        if (!initialData?.id) {
            alert('Harap simpan lesson terlebih dahulu sebelum upload video');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setProcessingStatus('Membuat upload URL...');

        try {
            // 1. Get upload URL from backend
            console.log('Creating upload URL for lesson:', initialData.id);
            console.log('CORS origin:', window.location.origin);
            
            const response = await api.post(
                `/kelas/lessons/${initialData.id}/mux-upload`,
                { corsOrigin: window.location.origin }
            );

            console.log('Upload URL response:', response.data);
            const { uploadUrl, uploadId, assetId } = response.data;
            
            if (!uploadUrl) {
                throw new Error('Upload URL tidak diterima dari server');
            }

            setProcessingStatus('Mengupload video...');

            // 2. Upload file directly to Mux
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setUploadProgress(progress);
                        console.log('Upload progress:', progress + '%');
                    }
                });

                xhr.addEventListener('load', () => {
                    console.log('Upload completed with status:', xhr.status);
                    if (xhr.status === 200 || xhr.status === 201) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    console.error('XHR error during upload');
                    reject(new Error('Network error during upload'));
                });

                xhr.open('PUT', uploadUrl);
                xhr.send(file);
            });

            setProcessingStatus('Video sedang diproses...');
            setUploadProgress(100);

            // 3. Poll for video processing status
            const assetStatus = await pollVideoStatus(initialData.id);

            setProcessingStatus('Menyimpan data video...');

            // NEW: Save to database
            const newDuration = assetStatus.duration ? formatDuration(assetStatus.duration) : formData.duration;
            try {
                await api.patch(`/kelas/lessons/${initialData.id}`, {
                    videoType: 'mux',
                    muxAssetId: assetStatus.id,
                    muxPlaybackId: assetStatus.playbackId,
                    thumbnailUrl: assetStatus.playbackId 
                        ? `https://image.mux.com/${assetStatus.playbackId}/thumbnail.jpg?time=0&width=640`
                        : undefined,
                    duration: newDuration,
                });
                
                // Update form data with new duration and video type
                setFormData(prev => ({
                    ...prev,
                    duration: newDuration,
                    videoType: 'mux',
                }));
                setUploadType('mux'); // Update tab selection
                
                console.log('✅ Video data saved to database');
            } catch (error: any) {
                console.error('❌ Failed to save video data:', error);
                alert('Video uploaded but failed to save: ' + (error.response?.data?.message || error.message));
                setUploading(false);
                return;
            }

            setProcessingStatus('✅ Video berhasil diupload dan tersimpan!');
            
            // Update local playback ID to trigger UI switch to manage mode
            setLocalPlaybackId(assetStatus.playbackId);
            
            // Don't call onSuccess here - modal should stay open
            // Parent will refresh when user clicks "Simpan" button
            
            setTimeout(() => {
                setUploading(false);
                setProcessingStatus('');
                setUploadProgress(0);
                // Modal stays open to show the video player in manage mode
            }, 2000);

        } catch (error: any) {
            console.error('Upload failed:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });
            
            let errorMsg = 'Unknown error';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMsg = 'Unauthorized - Silakan login kembali';
            } else if (error.response?.status === 403) {
                errorMsg = 'Forbidden - Anda tidak memiliki akses';
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            alert('Upload gagal: ' + errorMsg);
            setProcessingStatus('');
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    // YouTube URL Import to Mux
    const handleYoutubeImport = async () => {
        if (!initialData?.id) {
            alert('Harap simpan lesson terlebih dahulu');
            return;
        }

        if (!formData.videoUrl) {
            alert('Masukkan URL YouTube');
            return;
        }

        setUploading(true);
        setProcessingStatus('Mengimport video dari YouTube...');

        try {
            await api.post(
                `/kelas/lessons/${initialData.id}/mux-from-url`,
                { url: formData.videoUrl }
            );

            setProcessingStatus('Video sedang diproses...');

            // Poll for processing status
            const assetStatus = await pollVideoStatus(initialData.id);

            setProcessingStatus('✅ Video berhasil diimport dan tersimpan!');
            
            // Update local state with imported video
            setLocalPlaybackId(assetStatus.playbackId);
            
            const newDuration = assetStatus.duration ? formatDuration(assetStatus.duration) : formData.duration;
            setFormData(prev => ({
                ...prev,
                duration: newDuration,
                videoType: 'mux',
                videoUrl: formData.videoUrl,
            }));
            setUploadType('mux'); // Update tab selection
            
            setTimeout(() => {
                setUploading(false);
                setProcessingStatus('');
                // Modal stays open to show the imported video
            }, 2000);

        } catch (error: any) {
            console.error('Import failed:', error);
            alert('Import gagal: ' + (error.response?.data?.message || error.message));
            setProcessingStatus('');
        } finally {
            setUploading(false);
        }
    };

    // Internal delete without confirmation
    const _deleteVideoInternal = async (): Promise<boolean> => {
        if (!initialData?.id) {
            alert('Lesson ID tidak ditemukan');
            return false;
        }
        
        setUploading(true);
        setProcessingStatus('Menghapus video...');
        
        try {
            // Delete from Mux and DB
            await api.delete(`/kelas/lessons/${initialData.id}/mux-asset`);
            
            console.log('✅ Video deleted successfully');
            
            // Clear local playback ID to trigger UI switch to upload mode
            setLocalPlaybackId(null);
            
            // Don't call onSuccess here - modal should stay open
            // Parent will refresh when user clicks "Simpan" button
            
            // Reset form
            setFormData(prev => ({
                ...prev,
                videoType: 'youtube',
                duration: '00:00', // Reset to default when video deleted
            }));
            setUploadType('mux'); // Reset to default tab
            
            return true;
        } catch (error: any) {
            console.error('❌ Failed to delete video:', error);
            alert('Gagal menghapus video: ' + (error.response?.data?.message || error.message));
            return false;
        } finally {
            setUploading(false);
            setProcessingStatus('');
        }
    };

    // Delete existing video
    const handleDeleteVideo = async () => {
        if (!window.confirm('Hapus video? Video akan dihapus dari Mux dan database.')) {
            return;
        }
        
        const success = await _deleteVideoInternal();
        if (success) {
            setProcessingStatus('✅ Video berhasil dihapus!');
            setTimeout(() => {
                setProcessingStatus('');
            }, 2000);
            // Modal stays open, UI automatically switches to upload mode via localPlaybackId state
        }
    };

    // Replace existing video with new upload
    const handleReplaceVideo = async () => {
        if (!window.confirm('Replace video? Video lama akan dihapus dan Anda dapat upload video baru.')) {
            return;
        }
        
        await _deleteVideoInternal();
        // After delete, user can upload new video via the file input
    };

    // Poll video status until ready
    const pollVideoStatus = async (lessonId: string) => {
        const maxAttempts = 60; // 5 minutes max
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await api.get(`/kelas/lessons/${lessonId}/mux-status`);
                const { status } = response.data;

                if (status === 'ready') {
                    return response.data; // Return asset data when ready
                } else if (status === 'errored') {
                    throw new Error('Video processing failed');
                }

                // Wait 5 seconds before next check
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
            } catch (error: any) {
                if (error.response?.status === 404) {
                    // No Mux asset yet, keep polling
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                } else {
                    throw error;
                }
            }
        }

        throw new Error('Video processing timeout');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        // Update videoType based on selected tab
        const dataToSubmit = {
            ...formData,
            videoType: uploadType,
        };

        onSuccess(dataToSubmit);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Pelajaran' : 'Tambah Pelajaran'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="lesson-title">Judul Pelajaran</Label>
                        <Input
                            id="lesson-title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Contoh: Instalasi Node.js"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration">Durasi (MM:SS)</Label>
                        <Input
                            id="duration"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            placeholder="00:00"
                            disabled={hasExistingVideo}
                            className={hasExistingVideo ? 'bg-muted cursor-not-allowed' : ''}
                        />
                        {hasExistingVideo && (
                            <p className="text-xs text-muted-foreground">
                                Durasi otomatis dari video yang diupload
                            </p>
                        )}
                    </div>

                    {/* Video Upload/Management Section */}
                    <div className="space-y-2">
                        <Label>Video</Label>
                        
                        {hasExistingVideo ? (
                            // MANAGE MODE: Show Mux Player + Management Buttons
                            <div className="space-y-3">
                                <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: '16/9', maxHeight: '320px' }}>
                                    <LazyMuxPlayer
                                        playbackId={initialData.muxPlaybackId}
                                        metadata={{
                                            video_title: initialData.title || 'Lesson Video',
                                        }}
                                        streamType="on-demand"
                                        className="w-full h-full rounded-lg"
                                    />
                                </div>
                                
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDeleteVideo}
                                        disabled={uploading}
                                        className="flex items-center gap-2"
                                    >
                                        {uploading ? (
                                            <>
                                                <Icon icon="svg-spinners:ring-resize" />
                                                Menghapus...
                                            </>
                                        ) : (
                                            <>
                                                <Icon icon="solar:trash-bin-trash-linear" />
                                                Hapus Video
                                            </>
                                        )}
                                    </Button>
                                    
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleReplaceVideo}
                                        disabled={uploading}
                                        className="flex items-center gap-2"
                                    >
                                        <Icon icon="solar:refresh-linear" />
                                        Replace Video
                                    </Button>
                                </div>
                                
                                {processingStatus && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Icon icon="svg-spinners:ring-resize" className="text-primary" />
                                        {processingStatus}
                                    </p>
                                )}
                            </div>
                        ) : (
                            // UPLOAD MODE: Show Tabs (Mux/YouTube/Google Drive)
                            <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'mux' | 'youtube' | 'google-drive')}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="mux">
                                        <Icon icon="solar:upload-linear" className="mr-2" />
                                        Upload Video (Mux)
                                    </TabsTrigger>
                                    <TabsTrigger value="youtube">
                                        <Icon icon="logos:youtube-icon" className="mr-2" />
                                        YouTube URL
                                    </TabsTrigger>
                                    <TabsTrigger value="google-drive">
                                        <Icon icon="logos:google-drive" className="mr-2" />
                                        Google Drive
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="mux" className="space-y-3 mt-4">
                                    {!uploading ? (
                                        <div>
                                            <Input
                                                type="file"
                                                accept="video/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setSelectedFile(file);
                                                        handleMuxUpload(file);
                                                    }
                                                }}
                                                disabled={!initialData?.id}
                                            />
                                            {!initialData?.id && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    ⚠️ Simpan lesson terlebih dahulu sebelum upload video
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Icon icon="svg-spinners:ring-resize" className="text-primary" />
                                                {processingStatus}
                                            </div>
                                            {uploadProgress > 0 && (
                                                <div className="space-y-1">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-primary h-2 rounded-full transition-all"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-center text-muted-foreground">
                                                        {uploadProgress}%
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="youtube" className="space-y-3 mt-4">
                                    <div className="space-y-2">
                                        <Input
                                            id="videoUrl"
                                            name="videoUrl"
                                            value={formData.videoUrl}
                                            onChange={handleChange}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            disabled={uploading || !initialData?.id}
                                        />
                                        {!initialData?.id && (
                                            <p className="text-xs text-amber-600">
                                                ⚠️ Simpan lesson terlebih dahulu
                                            </p>
                                        )}
                                        {formData.videoUrl && initialData?.id && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleYoutubeImport}
                                                disabled={uploading}
                                                className="w-full"
                                            >
                                                {uploading ? (
                                                    <>
                                                        <Icon icon="svg-spinners:ring-resize" className="mr-2" />
                                                        Importing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon icon="solar:import-linear" className="mr-2" />
                                                        Import ke Mux
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {uploading && processingStatus && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Icon icon="svg-spinners:ring-resize" className="text-primary" />
                                                {processingStatus}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Masukkan URL YouTube, lalu klik "Import ke Mux" untuk mengkonversi video.
                                    </p>
                                </TabsContent>

                                <TabsContent value="google-drive" className="space-y-3 mt-4">
                                    <div className="space-y-2">
                                        <Input
                                            id="googleDriveUrl"
                                            name="videoUrl"
                                            value={formData.videoUrl}
                                            onChange={handleChange}
                                            placeholder="https://drive.google.com/file/d/FILE_ID/view"
                                        />
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">
                                                <strong>⚠️ Penting:</strong> Video harus di-set sebagai "Anyone with the link can view"
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Format URL yang didukung:
                                            </p>
                                            <ul className="text-xs text-muted-foreground list-disc list-inside ml-2">
                                                <li>https://drive.google.com/file/d/FILE_ID/view</li>
                                                <li>https://drive.google.com/open?id=FILE_ID</li>
                                            </ul>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lesson-desc">Deskripsi</Label>
                        <Textarea
                            id="lesson-desc"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Penjelasan singkat materi ini..."
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading || !formData.title.trim()} className="bg-primary hover:bg-primary/90">
                            {loading ? <ButtonLoading /> : null}
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
