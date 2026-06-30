import { Sparkles } from 'lucide-react';
import { getDashboardIdentity } from '@/features/students/lib/dashboard-queries';

interface WelcomeHeaderProps {
    studentId: string;
}

export async function WelcomeHeader({ studentId }: WelcomeHeaderProps) {
    const identity = await getDashboardIdentity(studentId);
    if (!identity) return null;

    const firstName = (identity.name ?? '').split(/\s+/)[0] ?? '';
    const fullName = `${identity.name ?? ''} ${identity.lastname ?? ''}`.trim();

    return (
        <header className="mb-8 flex flex-col gap-3">
            <p className="text-mute flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                <Sparkles className="text-primary size-3" aria-hidden="true" />
                {identity.institutionName}
            </p>
            <h1 className="font-display text-ink text-[28px] leading-[1.05] font-medium tracking-[-0.02em] sm:text-[36px]">
                Hola, {firstName || 'estudiante'}
            </h1>
            {identity.groupName && (
                <p className="text-ink-dim text-[14px]">
                    Grupo <span className="font-medium">{identity.groupName}</span>
                    <span className="text-mute"> · Sesión activa como {fullName}</span>
                </p>
            )}
        </header>
    );
}