'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { saveWhiteboardSnapshot } from '@/features/lms/actions/whiteboard';
import { toast } from 'sonner';

interface WhiteboardProps {
    sessionId: string;
    canSave: boolean;
}

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

export function Whiteboard({ sessionId, canSave }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getContext = () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        return { canvas, ctx };
    };

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const ref = getContext();
        if (!ref) return;
        drawingRef.current = true;
        const rect = ref.canvas.getBoundingClientRect();
        ref.ctx.beginPath();
        ref.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawingRef.current) return;
        const ref = getContext();
        if (!ref) return;
        const rect = ref.canvas.getBoundingClientRect();
        ref.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ref.ctx.strokeStyle = '#1e293b';
        ref.ctx.lineWidth = 2;
        ref.ctx.lineCap = 'round';
        ref.ctx.lineJoin = 'round';
        ref.ctx.stroke();
    };

    const onPointerUp = () => {
        drawingRef.current = false;
    };

    const onClear = () => {
        const ref = getContext();
        if (!ref) return;
        ref.ctx.fillStyle = '#ffffff';
        ref.ctx.fillRect(0, 0, ref.canvas.width, ref.canvas.height);
    };

    const onSave = async () => {
        const ref = getContext();
        if (!ref) return;
        setIsExporting(true);
        try {
            const pngBase64 = ref.canvas.toDataURL('image/png').split(',')[1] ?? '';
            if (pngBase64.length === 0) throw new Error('No se pudo exportar la pizarra');
            const result = await saveWhiteboardSnapshot({
                sessionId,
                pngBase64,
                width: ref.canvas.width,
                height: ref.canvas.height,
                title: null,
            });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Pizarra guardada');
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <h3 className="text-sm font-medium">Pizarra</h3>
                {canSave ? (
                    <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
                            Limpiar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={onSave}
                            disabled={isExporting}
                        >
                            {isExporting ? 'Guardando…' : 'Guardar snapshot'}
                        </Button>
                    </div>
                ) : null}
            </div>
            <div className="relative flex-1 overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={DEFAULT_WIDTH}
                    height={DEFAULT_HEIGHT}
                    className="h-full w-full touch-none"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                />
            </div>
        </div>
    );
}
