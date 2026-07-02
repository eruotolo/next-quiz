import Link from 'next/link';
import { CalendarCheck2, CheckCircle2, ClipboardList, GraduationCap, Video } from 'lucide-react';
import {
    getUpcomingFeed,
    type DashboardStudentContext,
    type UpcomingAssignment,
    type UpcomingExam,
} from '@/features/students/lib/dashboard-queries';
import { formatUrgencyRelative } from '@/features/students/lib/relative-time';
import { cn } from '@/shared/lib/utils';

interface UpcomingWidgetProps {
    ctx: DashboardStudentContext;
}

const URGENCY_BADGE: Record<'critical' | 'warning' | 'normal', string> = {
    critical: 'bg-danger-wash text-destructive',
    warning: 'bg-warning-wash text-warning',
    normal: 'bg-success-wash text-success',
};

const URGENCY_LABEL: Record<'critical' | 'warning' | 'normal', string> = {
    critical: 'Urgente',
    warning: 'Pronto',
    normal: 'Pendiente',
};

function ExamRow({ exam }: { exam: UpcomingExam }) {
    return (
        <li className="border-border flex items-start gap-3 border-b py-3 last:border-0">
            <span
                className={cn(
                    'mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase',
                    URGENCY_BADGE[exam.urgency],
                )}
            >
                {URGENCY_LABEL[exam.urgency]}
            </span>
            <div className="min-w-0 flex-1">
                <Link
                    href={`/students/examen/${exam.id}/intro` as `/${string}`}
                    className="text-ink hover:text-primary block truncate text-[14px] font-medium"
                >
                    {exam.title}
                </Link>
                <p className="text-mute mt-0.5 flex items-center gap-1 font-mono text-[11px]">
                    <GraduationCap className="size-3" aria-hidden="true" />
                    Examen · {formatUrgencyRelative(exam.scheduledAt)}
                </p>
            </div>
        </li>
    );
}

function AssignmentRow({ assignment }: { assignment: UpcomingAssignment }) {
    return (
        <li className="border-border flex items-start gap-3 border-b py-3 last:border-0">
            <span
                className={cn(
                    'mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase',
                    URGENCY_BADGE[assignment.urgency],
                )}
            >
                {URGENCY_LABEL[assignment.urgency]}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[14px] font-medium">{assignment.title}</p>
                <p className="text-mute mt-0.5 flex items-center gap-1 font-mono text-[11px]">
                    <ClipboardList className="size-3" aria-hidden="true" />
                    {assignment.courseTitle} · Entrega {formatUrgencyRelative(assignment.dueAt)}
                </p>
            </div>
        </li>
    );
}

export async function UpcomingWidget({ ctx }: UpcomingWidgetProps) {
    const feed = await getUpcomingFeed(ctx);

    if (!feed.hasItems) {
        return (
            <section
                aria-label="Próximas actividades"
                className="bg-surface border-border rounded-[16px] border p-5"
            >
                <header className="mb-2 flex items-center justify-between">
                    <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                        Próximas actividades
                    </h2>
                </header>
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <CheckCircle2 className="text-success size-8" aria-hidden="true" />
                    <p className="text-success text-[13.5px] font-medium">
                        Todo al día por esta semana
                    </p>
                    <p className="text-mute text-[12.5px]">
                        No tenés exámenes ni entregas pendientes.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section
            aria-label="Próximas actividades"
            className="bg-surface border-border rounded-[16px] border p-5"
        >
            <header className="mb-2 flex items-center justify-between">
                <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                    Próximas actividades
                </h2>
                <Link
                    href={'/calendario' as `/${string}`}
                    className="text-primary text-[12px] font-medium hover:underline"
                >
                    Ver calendario
                </Link>
            </header>
            <ul className="list-none p-0">
                {feed.exams.map((exam) => (
                    <ExamRow key={exam.id} exam={exam} />
                ))}
                {feed.assignments.map((a) => (
                    <AssignmentRow key={a.id} assignment={a} />
                ))}
            </ul>
            <div className="text-mute mt-3 flex items-center gap-1 font-mono text-[11px]">
                <CalendarCheck2 className="size-3" aria-hidden="true" />
                {feed.exams.length} examen{feed.exams.length === 1 ? '' : 'es'} ·{' '}
                {feed.assignments.length} entrega{feed.assignments.length === 1 ? '' : 's'}
            </div>
            {feed.assignments.length > 0 && (
                <p className="text-mute mt-2 flex items-center gap-1 font-mono text-[10px]">
                    <Video className="size-3" aria-hidden="true" /> Las clases en vivo aparecen en
                    Calendario.
                </p>
            )}
        </section>
    );
}
