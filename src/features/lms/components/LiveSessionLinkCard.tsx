import { Radio, Video } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { parseLiveSessionUrl } from '@/features/lms/lib/lesson-url-validators';

const PROVIDER_LABEL = {
    google_meet: 'Google Meet',
    zoom: 'Zoom',
} as const;

interface Props {
    externalLink: string | null;
}

export function LiveSessionLinkCard({ externalLink }: Props) {
    if (!externalLink) {
        return (
            <Card className="border-border flex flex-col items-center gap-3 bg-white p-8 text-center">
                <Radio size={28} className="text-primary" />
                <p className="text-ink font-display text-lg font-bold">Clase en vivo</p>
                <p className="text-mute text-sm">El docente aún no publicó el enlace.</p>
            </Card>
        );
    }

    const parsed = parseLiveSessionUrl(externalLink);
    const providerLabel = parsed ? PROVIDER_LABEL[parsed.provider] : 'videollamada';

    return (
        <Card className="border-border flex flex-col items-center gap-3 bg-white p-8 text-center">
            <Radio size={28} className="text-primary" />
            <p className="text-ink font-display text-lg font-bold">
                Clase en vivo — {providerLabel}
            </p>
            <p className="text-mute text-sm">
                Hacé clic en el botón unos minutos antes del horario acordado con tu docente.
            </p>
            <Button asChild variant="primary" size="md">
                <a href={externalLink} target="_blank" rel="noopener noreferrer">
                    <Video size={16} className="mr-1" />
                    Unirme a la clase
                </a>
            </Button>
        </Card>
    );
}
