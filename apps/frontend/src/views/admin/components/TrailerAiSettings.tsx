import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Switch } from 'src/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { toast } from 'react-toastify';
import api from 'src/api/axios';
import { Loading } from 'src/components/ui/loading';
import LazyMuxPlayer from 'src/components/shared/LazyMuxPlayer';

interface TrailerData {
    id?: string;
    category: string;
    muxPlaybackId: string;
    playbackToken?: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    buyUrl: string;
    upgradeUrl: string;
    isActive: boolean;
}

const categories = [
    { id: 'trainer', label: 'AI for Trainer', color: '#4F75FF', icon: 'solar:presentation-graph-bold-duotone' },
    { id: 'master', label: 'AI for Master', color: '#AA8D55', icon: 'solar:diploma-verified-bold-duotone' },
    { id: 'branding', label: 'AI for Branding', color: '#10B981', icon: 'solar:star-bold-duotone' },
];

const defaultTrailer = (category: string): TrailerData => ({
    category,
    muxPlaybackId: '',
    title: '',
    description: '',
    thumbnailUrl: '',
    buyUrl: '',
    upgradeUrl: '',
    isActive: true,
});

export const TrailerAiSettings = () => {
    const [trailers, setTrailers] = useState<Record<string, TrailerData>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [uploading, setUploading] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({});
    const [uploadType, setUploadType] = useState<Record<string, 'mux' | 'youtube'>>({});

    useEffect(() => {
        fetchTrailers();
    }, []);

    const fetchTrailers = async () => {
        try {
            const { data } = await api.get('/admin/ai-trailer');
            const trailersMap: Record<string, TrailerData> = {};
            
            // Initialize with defaults
            categories.forEach(cat => {
                trailersMap[cat.id] = defaultTrailer(cat.id);
            });
            
            // Override with fetched data
            data.forEach((trailer: TrailerData) => {
                trailersMap[trailer.category] = trailer;
            });
            
            setTrailers(trailersMap);
        } catch (error) {
            console.error('Failed to fetch trailers:', error);
            toast.error('Gagal memuat data trailer');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (category: string, field: keyof TrailerData, value: string | boolean) => {
        setTrailers(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value,
            },
        }));
    };

    // Mux Direct Upload
    const handleMuxUpload = async (category: string, file: File) => {
        setUploading(category);
        setUploadProgress(prev => ({ ...prev, [category]: 0 }));
        setProcessingStatus(prev => ({ ...prev, [category]: 'Membuat upload URL...' }));

        try {
            // Create upload URL
            const response = await api.post(
                `/admin/ai-trailer/${category}/mux-upload`,
                { corsOrigin: window.location.origin }
            );

            const { uploadUrl } = response.data;
            
            if (!uploadUrl) {
                throw new Error('Upload URL tidak diterima dari server');
            }

            setProcessingStatus(prev => ({ ...prev, [category]: 'Mengupload video...' }));

            // Upload file to Mux
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setUploadProgress(prev => ({ ...prev, [category]: progress }));
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.open('PUT', uploadUrl);
                xhr.send(file);
            });

            setProcessingStatus(prev => ({ ...prev, [category]: 'Video sedang diproses...' }));
            setUploadProgress(prev => ({ ...prev, [category]: 100 }));

            // Poll for video status
            await pollVideoStatus(category);

            setProcessingStatus(prev => ({ ...prev, [category]: 'Video berhasil diupload!' }));
            
            // Refresh data
            await fetchTrailers();
            
            setTimeout(() => {
                setUploading(null);
                setProcessingStatus(prev => ({ ...prev, [category]: '' }));
                setUploadProgress(prev => ({ ...prev, [category]: 0 }));
            }, 1000);

        } catch (error: any) {
            console.error('Upload failed:', error);
            toast.error('Upload gagal: ' + (error.response?.data?.message || error.message));
            setProcessingStatus(prev => ({ ...prev, [category]: '' }));
            setUploadProgress(prev => ({ ...prev, [category]: 0 }));
        } finally {
            setUploading(null);
        }
    };

    // Poll video status
    const pollVideoStatus = async (category: string) => {
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await api.get(`/admin/ai-trailer/${category}/mux-status`);
                const { status } = response.data;

                if (status === 'ready') {
                    return response.data;
                } else if (status === 'errored') {
                    throw new Error('Video processing failed');
                }

                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;
            } catch (error: any) {
                if (error.response?.status === 404) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                } else {
                    throw error;
                }
            }
        }

        throw new Error('Video processing timeout');
    };

    // Delete video
    const handleDeleteVideo = async (category: string) => {
        if (!window.confirm('Hapus video? Video akan dihapus dari Mux dan database.')) {
            return;
        }
        
        setUploading(category);
        setProcessingStatus(prev => ({ ...prev, [category]: 'Menghapus video...' }));
        
        try {
            await api.delete(`/admin/ai-trailer/${category}/mux-asset`);
            toast.success('Video berhasil dihapus');
            await fetchTrailers();
        } catch (error: any) {
            console.error('Failed to delete video:', error);
            toast.error('Gagal menghapus video: ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(null);
            setProcessingStatus(prev => ({ ...prev, [category]: '' }));
        }
    };

    const handleSave = async (category: string) => {
        setSaving(category);
        try {
            await api.put(`/admin/ai-trailer/${category}`, trailers[category]);
            toast.success('Trailer berhasil disimpan');
        } catch (error) {
            console.error('Failed to save trailer:', error);
            toast.error('Gagal menyimpan trailer');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return <Loading fullPage text="Memuat trailer settings..." />;
    }

    return (
        <div className="space-y-6">
            {categories.map(cat => (
                <Card key={cat.id}>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${cat.color}20` }}
                                >
                                    <Icon icon={cat.icon} height={24} style={{ color: cat.color }} />
                                </div>
                                <CardTitle className="text-lg">{cat.label}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor={`active-${cat.id}`} className="text-sm text-bodytext">
                                    Active
                                </Label>
                                <Switch
                                    id={`active-${cat.id}`}
                                    checked={trailers[cat.id]?.isActive ?? true}
                                    onCheckedChange={(checked) => handleChange(cat.id, 'isActive', checked)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Video Section */}
                        <div className="space-y-2">
                            <Label>Video</Label>
                            {trailers[cat.id]?.muxPlaybackId ? (
                                // MANAGE MODE
                                <div className="space-y-3">
                                    <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: '16/9', maxHeight: '320px' }}>
                                        <LazyMuxPlayer
                                            playbackId={trailers[cat.id].muxPlaybackId}
                                            tokens={trailers[cat.id].playbackToken ? { playback: trailers[cat.id].playbackToken } : undefined}
                                            metadata={{
                                                video_title: trailers[cat.id].title || cat.label,
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
                                            onClick={() => handleDeleteVideo(cat.id)}
                                            disabled={uploading === cat.id}
                                            className="flex items-center gap-2"
                                        >
                                            {uploading === cat.id ? (
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
                                    </div>
                                    
                                    {processingStatus[cat.id] && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Icon icon="svg-spinners:ring-resize" className="text-primary" />
                                            {processingStatus[cat.id]}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                // UPLOAD MODE
                                <div className="space-y-3">
                                    {uploading !== cat.id ? (
                                        <Input
                                            type="file"
                                            accept="video/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleMuxUpload(cat.id, file);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Icon icon="svg-spinners:ring-resize" className="text-primary" />
                                                {processingStatus[cat.id]}
                                            </div>
                                            {uploadProgress[cat.id] > 0 && (
                                                <div className="space-y-1">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-primary h-2 rounded-full transition-all"
                                                            style={{ width: `${uploadProgress[cat.id]}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-center text-muted-foreground">
                                                        {uploadProgress[cat.id]}%
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`title-${cat.id}`}>Judul</Label>
                                <Input
                                    id={`title-${cat.id}`}
                                    placeholder="Judul trailer"
                                    value={trailers[cat.id]?.title || ''}
                                    onChange={(e) => handleChange(cat.id, 'title', e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor={`description-${cat.id}`}>Deskripsi</Label>
                            <Textarea
                                id={`description-${cat.id}`}
                                placeholder="Deskripsi trailer..."
                                rows={3}
                                value={trailers[cat.id]?.description || ''}
                                onChange={(e) => handleChange(cat.id, 'description', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`thumbnail-${cat.id}`}>Thumbnail URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id={`thumbnail-${cat.id}`}
                                    placeholder="https://..."
                                    value={trailers[cat.id]?.thumbnailUrl || ''}
                                    onChange={(e) => handleChange(cat.id, 'thumbnailUrl', e.target.value)}
                                    className="flex-1"
                                />
                                {trailers[cat.id]?.thumbnailUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(trailers[cat.id].thumbnailUrl, '_blank')}
                                    >
                                        <Icon icon="solar:eye-linear" height={16} />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`buy-url-${cat.id}`}>
                                Beli URL 
                                <span className="text-xs text-gray-500 ml-2">(Untuk user FREE/belum punya tier)</span>
                            </Label>
                            <Input
                                id={`buy-url-${cat.id}`}
                                placeholder="https://wa.me/628xxx?text=Saya%20mau%20beli%20paket atau /user/upgrade"
                                value={trailers[cat.id]?.buyUrl || ''}
                                onChange={(e) => handleChange(cat.id, 'buyUrl', e.target.value)}
                            />
                            <p className="text-xs text-gray-500">
                                URL tujuan ketika user FREE (no tier) klik tombol "Beli Paket". 
                                Bisa internal path (/user/upgrade) atau external URL (https://wa.me/...)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`upgrade-url-${cat.id}`}>
                                Upgrade URL 
                                <span className="text-xs text-gray-500 ml-2">(Untuk user PAID tanpa AI)</span>
                            </Label>
                            <Input
                                id={`upgrade-url-${cat.id}`}
                                placeholder="https://wa.me/628xxx?text=Saya%20mau%20upgrade%20paket atau /user/upgrade"
                                value={trailers[cat.id]?.upgradeUrl || ''}
                                onChange={(e) => handleChange(cat.id, 'upgradeUrl', e.target.value)}
                            />
                            <p className="text-xs text-gray-500">
                                URL tujuan ketika user PAID tanpa AI feature klik tombol "Upgrade Paket". 
                                Bisa internal path (/user/upgrade) atau external URL (https://wa.me/...)
                            </p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={() => handleSave(cat.id)}
                                disabled={saving === cat.id}
                            >
                                {saving === cat.id ? (
                                    <>
                                        <Icon icon="svg-spinners:ring-resize" height={16} className="mr-2" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:diskette-linear" height={16} className="mr-2" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
