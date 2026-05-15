import { useState } from 'react';
import { useNavigate } from 'react-router';
import LazyMuxPlayer from 'src/components/shared/LazyMuxPlayer';
import { Icon } from '@iconify/react';
import { Button } from 'src/components/ui/button';

interface AiTrailerPromotionProps {
    category: string;
    title: string;
    description?: string;
    muxPlaybackId?: string;
    playbackToken?: string;
    thumbnailUrl?: string;
    buyUrl?: string;
    upgradeUrl?: string;
    hasAccess: boolean;
    hasTier: boolean;
    onContinue: () => void;
}

const STORAGE_KEY_PREFIX = 'ai_trailer_skip_';

export const AiTrailerPromotion = ({
    category,
    title,
    description,
    muxPlaybackId,
    playbackToken,
    thumbnailUrl,
    buyUrl,
    upgradeUrl,
    hasAccess,
    hasTier,
    onContinue,
}: AiTrailerPromotionProps) => {
    const navigate = useNavigate();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleContinue = () => {
        // If user doesn't have access, redirect to buy/upgrade page
        if (!hasAccess) {
            // FREE user (no tier) → use buyUrl
            // PAID user (has tier but no AI) → use upgradeUrl
            const redirectUrl = hasTier 
                ? (upgradeUrl || '/user/upgrade') 
                : (buyUrl || '/user/upgrade');
                
            if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
                window.location.href = redirectUrl;
            } else {
                navigate(redirectUrl);
            }
            return;
        }

        // If user has access, continue to chat
        if (dontShowAgain) {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${category}`, 'true');
        }
        onContinue();
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDontShowAgain(e.target.checked);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-70px)] overflow-hidden -mx-5 lg:-mx-8 -my-8">
            {/* Content Area - Full Height */}
            <div className="flex-1 flex flex-col justify-center px-4 lg:px-8 overflow-hidden">
                {/* Video Player */}
                <div className="relative w-full bg-black shadow-sm shrink-0 rounded-xl overflow-hidden aspect-video max-w-5xl mx-auto">
                    {muxPlaybackId ? (
                        <>
                            {console.log('🎬 [MuxPlayer] Props:', {
                                playbackId: muxPlaybackId,
                                hasToken: !!playbackToken,
                                tokenLength: playbackToken?.length,
                                tokenPreview: playbackToken?.substring(0, 50) + '...',
                            })}
                            <LazyMuxPlayer
                                playbackId={muxPlaybackId}
                                tokens={playbackToken ? { playback: playbackToken } : undefined}
                                metadata={{
                                    video_title: title,
                                }}
                                accentColor="#4F75FF"
                                className="w-full h-full"
                                streamType="on-demand"
                            />
                        </>
                    ) : thumbnailUrl ? (
                        <img 
                            src={thumbnailUrl} 
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
                            <Icon icon="solar:video-frame-play-horizontal-bold" height={48} className="text-gray-500 mb-2" />
                            <span className="text-sm text-gray-400">Video belum tersedia</span>
                        </div>
                    )}
                </div>

                {/* Control Section - Compact */}
                <div className="space-y-3 py-4 max-w-5xl mx-auto w-full">
                    {/* Control Bar: Checkbox (Left) | Navigation (Right) */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Left: Checkbox */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-start">
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={dontShowAgain}
                                        onChange={handleCheckboxChange}
                                    />
                                    <div className="w-5 h-5 border-2 border-[#4F75FF] rounded flex items-center justify-center peer-checked:bg-[#4F75FF] peer-checked:border-[#4F75FF] transition-all group-hover:border-[#4F75FF]/80">
                                        <Icon icon="solar:check-read-linear" className="text-white opacity-0 peer-checked:opacity-100" height={14} />
                                    </div>
                                </div>
                                <span className={`text-sm ${dontShowAgain ? 'text-dark font-medium' : 'text-bodytext'}`}>
                                    Jangan tampilkan lagi
                                </span>
                            </label>
                        </div>

                        {/* Right: Navigation Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {hasAccess ? (
                                // User has access - show Continue button
                                <Button
                                    size="sm"
                                    className="flex-1 sm:flex-none bg-[#4F75FF] hover:bg-[#4F75FF]/90 text-white h-9 px-4"
                                    onClick={handleContinue}
                                >
                                    Lanjutkan
                                    <Icon icon="solar:arrow-right-outline" className="ml-1" height={16} />
                                </Button>
                            ) : (
                                // User doesn't have access - show Beli/Upgrade button
                                <Button
                                    size="sm"
                                    className="flex-1 sm:flex-none bg-[#4F75FF] hover:bg-[#4F75FF]/90 text-white h-9 px-4"
                                    onClick={handleContinue}
                                >
                                    <Icon icon="solar:crown-bold" className="mr-1" height={16} />
                                    {hasTier ? 'Upgrade Paket' : 'Beli Paket'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const shouldShowTrailer = (category: string): boolean => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${category}`) !== 'true';
};
