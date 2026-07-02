import type { CSSProperties } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getCourseProgressBars } from '@/features/students/lib/dashboard-queries';

function gradeColor(grade: number | null): string {
    if (grade === null) return 'text-mute';
    if (grade >= 5.0) return 'text-success';
    if (grade >= 4.0) return 'text-ink';
    return 'text-destructive';
}

export async function CourseProgressChart({ studentId }: { studentId: string }) {
    const courses = await getCourseProgressBars(studentId, 5);

    if (courses.length === 0) {
        return (
            <section
                aria-label="Progreso por curso"
                className="bg-surface border-border rounded-[16px] border p-5"
            >
                <header className="mb-3">
                    <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                        Progreso por curso
                    </h2>
                    <p className="text-mute text-[12px]">Cursos activos en el aula virtual.</p>
                </header>
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <BookOpen className="text-mute size-6" aria-hidden="true" />
                    <p className="text-mute text-[13px]">Aún no estás inscripto en cursos.</p>
                </div>
            </section>
        );
    }

    return (
        <section
            aria-label="Progreso por curso"
            className="bg-surface border-border rounded-[16px] border p-5"
        >
            <header className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                        Progreso por curso
                    </h2>
                    <p className="text-mute text-[12px]">Cursos activos · {courses.length}</p>
                </div>
                <Link
                    href={'/students/aula' as `/${string}`}
                    className="text-primary text-[12px] font-medium hover:underline"
                >
                    Ver todos
                </Link>
            </header>

            <ul className="flex flex-col gap-4">
                {courses.map((c) => {
                    const pct = Math.max(0, Math.min(100, c.progressPct));
                    return (
                        <li key={c.id}>
                            <div className="mb-1.5 flex items-baseline justify-between gap-3">
                                <Link
                                    href={`/students/aula/cursos/${c.courseId}` as `/${string}`}
                                    className="text-ink hover:text-primary truncate text-[13.5px] font-medium"
                                >
                                    {c.title}
                                </Link>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-ink font-mono text-[12px] font-semibold tabular-nums">
                                        {pct}%
                                    </span>
                                    {c.averageGrade !== null && (
                                        <span
                                            className={`font-mono text-[11px] font-semibold tabular-nums ${gradeColor(c.averageGrade)}`}
                                        >
                                            {c.averageGrade.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div
                                className="bg-paper-warm h-1.5 w-full overflow-hidden rounded-full"
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Progreso: ${c.title}`}
                            >
                                <div
                                    className={`h-full w-[var(--w)] rounded-full transition-all ${
                                        pct === 100
                                            ? 'bg-success'
                                            : pct >= 50
                                              ? 'bg-primary'
                                              : 'bg-warning'
                                    }`}
                                    style={{ '--w': `${pct}%` } as CSSProperties}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
