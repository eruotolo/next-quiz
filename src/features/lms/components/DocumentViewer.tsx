'use client';

interface Props {
    fileUrl: string;
    title: string;
}

export function DocumentViewer({ fileUrl, title }: Props) {
    const isPdf = /\.pdf(\?|$)/i.test(fileUrl);
    if (isPdf) {
        return (
            <div className="border-border overflow-hidden rounded-[12px] border bg-white shadow-sm">
                <iframe
                    src={`${fileUrl}#toolbar=0`}
                    title={title}
                    className="h-[70vh] w-full"
                />
            </div>
        );
    }
    return (
        <div className="border-border flex flex-col items-center gap-3 rounded-[12px] border bg-white p-8 text-center shadow-sm">
            <p className="text-ink font-display text-lg font-bold">{title}</p>
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground rounded-[10px] px-5 py-2.5 text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
            >
                Abrir documento
            </a>
        </div>
    );
}
