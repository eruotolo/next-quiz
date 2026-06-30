import Link from 'next/link';
import { ArrowUpRight, GraduationCap } from 'lucide-react';
import { getRecentGrades } from '@/features/students/lib/dashboard-queries';
import { cn } from '@/shared/lib/utils';

interface RecentGradesWidgetProps {
    studentId: string;
}

export async function RecentGradesWidget({ studentId }: RecentGradesWidgetProps) {
    const grades = await getRecentGrades(studentId);

    if (grades.length === 0) {
        return (
            <section
                aria-label="Últimas notas"
                className="bg-surface border-border rounded-[16px] border p-5"
            >
                <header className="mb-2 flex items-center justify-between">
                    <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                        Últimas notas
                    </h2>
                </header>
                <p className="text-mute text-[13px]">Cuando rindas un examen, lo vas a ver acá.</p>
            </section>
        );
    }

    return (
        <section
            aria-label="Últimas notas"
            className="bg-surface border-border rounded-[16px] border p-5"
        >
            <header className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                    Últimas notas
                </h2>
                <Link
                    href={'/mis-materias' as `/${string}`}
                    className="text-primary text-[12px] font-medium hover:underline"
                >
                    Ver historial
                </Link>
            </header>
            <ul className="list-none divide-y divide-[color:var(--border)] p-0">
                {grades.map((grade) => (
                    <li key={grade.resultId}>
                        <Link
                            href={`/examen/resultado/${grade.resultId}` as `/${string}`}
                            className="hover:bg-paper-warm -mx-2 flex items-center gap-3 rounded-[10px] px-2 py-2.5"
                        >
                            <span
                                className={cn(
                                    'font-display flex size-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold',
                                    grade.passed
                                        ? 'bg-success-wash text-success'
                                        : 'bg-danger-wash text-destructive',
                                )}
                                aria-hidden="true"
                            >
                                {grade.grade.toFixed(1)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-ink truncate text-[13.5px] font-medium">
                                    {grade.examTitle}
                                </p>
                                <p className="text-mute mt-0.5 flex items-center gap-2 font-mono text-[11px]">
                                    <GraduationCap className="size-3" aria-hidden="true" />
                                    {grade.subject ?? 'Examen'}
                                    <span aria-hidden="true">·</span>
                                    {grade.completedAt.toLocaleDateString('es-CL', {
                                        day: '2-digit',
                                        month: 'short',
                                    })}
                                </p>
                            </div>
                            <ArrowUpRight
                                className="text-mute size-4 shrink-0"
                                aria-hidden="true"
                            />
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
