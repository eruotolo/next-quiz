import { ExternalLink } from 'lucide-react';

interface PaesAvisoProps {
    sourceUrl: string;
    source: string;
}

export function PaesAviso({ sourceUrl, source }: PaesAvisoProps): React.JSX.Element {
    return (
        <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-paper-warm px-4 py-2.5">
            <div className="flex items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-primary/60" />
                <span className="font-mono text-[10px] text-mute">
                    Fuente: <span className="text-ink">{source}</span>
                </span>
            </div>
            <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] text-primary underline-offset-2 hover:underline"
            >
                Ver en DEMRE
                <ExternalLink size={10} />
            </a>
        </div>
    );
}
