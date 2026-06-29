'use client';

import MuxPlayer from '@mux/mux-player-react';

interface Props {
    playbackId: string;
    title: string;
    onTimeUpdate?: (currentTimeSec: number) => void;
    startTime?: number;
}

export function VideoPlayer({ playbackId, title, onTimeUpdate, startTime }: Props) {
    return (
        <div className="bg-ink relative aspect-video w-full overflow-hidden rounded-[12px]">
            <MuxPlayer
                streamType="on-demand"
                playbackId={playbackId}
                metadata={{ video_title: title }}
                startTime={startTime}
                onTimeUpdate={(e) => {
                    if (onTimeUpdate) {
                        const t = (e.target as HTMLVideoElement).currentTime;
                        onTimeUpdate(Math.floor(t));
                    }
                }}
                accentColor="#1f2eff"
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
}
