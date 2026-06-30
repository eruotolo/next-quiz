'use client';

import { useEffect, useRef } from 'react';

interface DailyCallFrameProps {
    roomUrl: string;
    token?: string | null;
    onLeave?: () => void;
}

export function DailyCallFrame({ roomUrl, token, onLeave }: DailyCallFrameProps) {
    const frameRef = useRef<HTMLIFrameElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const handleMessage = (event: MessageEvent) => {
            if (!frameRef.current?.contentWindow) return;
            const source = event.source;
            if (source !== frameRef.current.contentWindow) return;
            if (typeof event.data !== 'object' || event.data === null) return;
            const data = event.data as { action?: string };
            if (data.action === 'left-meeting' && onLeave) {
                onLeave();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onLeave]);

    const url = token ? `${roomUrl}?t=${encodeURIComponent(token)}` : roomUrl;

    return (
        <div ref={wrapperRef} className="h-full w-full overflow-hidden rounded-md bg-black">
            <iframe
                ref={frameRef}
                src={url}
                title="Aula sincrónica"
                allow="camera; microphone; display-capture; autoplay; clipboard-write"
                className="h-full w-full border-0"
            />
        </div>
    );
}
