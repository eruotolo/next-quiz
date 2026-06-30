import { Sparkles } from 'lucide-react';
import { getRecentActivity, type RecentActivity } from '@/features/students/lib/dashboard-queries';
import { formatRelativeTime } from '@/features/students/lib/relative-time';

interface RecentActivityWidgetProps {
    studentId: string;
}

const SOURCE_LABEL: Record<string, string> = {
    LESSON_COMPLETED: 'Lección completada',
    ASSIGNMENT_SUBMITTED: 'Tarea entregada',
    ASSIGNMENT_GRADED: 'Tarea calificada',
    EXAM_PASSED: 'Examen aprobado',
    FORUM_POST: 'Post en foro',
    MANUAL: 'Reconocimiento',
    STREAK_BONUS: 'Bonus de racha',
};

function describe(event: RecentActivity): string {
    const label = SOURCE_LABEL[event.sourceType] ?? 'Evento';
    return `${label} · ${event.reason}`;
}

export async function RecentActivityWidget({ studentId }: RecentActivityWidgetProps) {
    const events = await getRecentActivity(studentId);

    if (events.length === 0) {
        return (
            <section
                aria-label="Actividad reciente"
                className="bg-surface border-border rounded-[16px] border p-5"
            >
                <header className="mb-2 flex items-center justify-between">
                    <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                        Actividad reciente
                    </h2>
                </header>
                <p className="text-mute text-[13px]">
                    Empezá a sumar puntos completando lecciones y tareas.
                </p>
            </section>
        );
    }

    return (
        <section
            aria-label="Actividad reciente"
            className="bg-surface border-border rounded-[16px] border p-5"
        >
            <header className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                    Actividad reciente
                </h2>
            </header>
            <ul className="list-none p-0">
                {events.map((event) => (
                    <li
                        key={event.id}
                        className="border-border flex items-start gap-3 border-b py-2.5 last:border-0"
                    >
                        <span className="bg-lime text-ink mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full">
                            <Sparkles className="size-3.5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-ink truncate text-[13.5px]">{describe(event)}</p>
                            <p className="text-mute mt-0.5 font-mono text-[11px]">
                                {formatRelativeTime(event.createdAt)}
                            </p>
                        </div>
                        <span className="text-success font-mono text-[12px] font-semibold">
                            +{event.amount}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}