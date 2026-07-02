import { parseVideoEmbedUrl } from '@/features/lms/lib/lesson-url-validators';

interface Props {
    externalLink: string | null;
}

export function VideoEmbed({ externalLink }: Props) {
    if (!externalLink) {
        return (
            <p className="text-mute py-12 text-center text-sm">
                Aún no se cargó un video para esta lección.
            </p>
        );
    }

    const parsed = parseVideoEmbedUrl(externalLink);
    if (!parsed) {
        return (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-mute text-sm">
                    No pudimos reconocer este enlace como YouTube o Vimeo.
                </p>
                <a
                    href={externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm underline"
                >
                    Abrir enlace directamente
                </a>
            </div>
        );
    }

    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-black">
            <iframe
                src={parsed.embedUrl}
                title="Video de la lección"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="no-referrer"
                allowFullScreen
            />
        </div>
    );
}
