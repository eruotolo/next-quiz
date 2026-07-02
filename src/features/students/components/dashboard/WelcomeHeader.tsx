import { Sparkles } from 'lucide-react';
import { getDashboardIdentity } from '@/features/students/lib/dashboard-queries';
import type { DashboardSummaryCounts } from '@/features/students/lib/dashboard-queries';

interface WelcomeHeaderProps {
    studentId: string;
    summary: DashboardSummaryCounts;
}

function greeting(hour: number): string {
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

function buildHeadline(summary: DashboardSummaryCounts): string {
    if (summary.criticalExams > 0) {
        return summary.criticalExams === 1
            ? 'Tenés un examen crítico esta semana.'
            : `Tenés ${summary.criticalExams} exámenes críticos esta semana.`;
    }
    if (summary.todayItems > 0) {
        return 'Tenés entregas o exámenes para esta semana.';
    }
    if (summary.upcomingExams + summary.upcomingAssignments > 0) {
        return 'Hay actividad próxima en tus cursos.';
    }
    return 'Estás al día. Buen momento para repasar o descansar.';
}

export async function WelcomeHeader({ studentId, summary }: WelcomeHeaderProps) {
    const identity = await getDashboardIdentity(studentId);
    if (!identity) return null;

    const firstName = (identity.name ?? '').split(/\s+/)[0] ?? '';
    const fullName = `${identity.name ?? ''} ${identity.lastname ?? ''}`.trim();
    const hour = new Date().getHours();

    return (
        <header className="mb-8 flex flex-col gap-3">
            <p className="text-mute flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                <Sparkles className="text-primary size-3" aria-hidden="true" />
                {identity.institutionName}
                {identity.groupName ? ` · ${identity.groupName}` : ''}
            </p>
            <h1 className="font-display text-ink text-[28px] leading-[1.05] font-medium tracking-[-0.02em] sm:text-[36px]">
                {greeting(hour)}, {firstName || 'estudiante'}
            </h1>
            <p className="text-ink-dim text-[14px]">{buildHeadline(summary)}</p>
            <p className="text-mute font-mono text-[11px]">
                Sesión activa como {fullName}
            </p>
        </header>
    );
}
