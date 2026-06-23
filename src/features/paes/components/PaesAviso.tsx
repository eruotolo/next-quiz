import { ExternalLink } from 'lucide-react';

interface PaesAvisoProps {
    sourceUrl: string;
    source: string;
}

export function PaesAviso({ sourceUrl, source }: PaesAvisoProps) {
    return (
        <div className="border-border bg-paper-warm flex items-center justify-between gap-3 rounded-[10px] border px-4 py-2.5">
            <div className="flex items-center gap-2">
                <span className="bg-primary/60 size-1.5 shrink-0 rounded-full" />
                <span className="text-mute font-mono text-[10px]">
                    Fuente: <span className="text-ink">{source}</span>
                </span>
            </div>
            <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 font-mono text-[10px] underline-offset-2 hover:underline"
            >
                Ver en DEMRE
                <ExternalLink size={10} />
            </a>
        </div>
    );
}
