import Link from 'next/link';
import { BookOpen, GraduationCap } from 'lucide-react';
import { getMyCoursesCards } from '@/features/students/lib/dashboard-queries';
import { cn } from '@/shared/lib/utils';

interface MyCoursesWidgetProps {
    studentId: string;
}

export async function MyCoursesWidget({ studentId }: MyCoursesWidgetProps) {
    const courses = await getMyCoursesCards(studentId);

    if (courses.length === 0) {
        return (
            <section
                aria-label="Mis cursos"
                className="bg-surface border-border rounded-[16px] border p-5"
            >
                <header className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                        Mis cursos
                    </h2>
                </header>
                <p className="text-mute text-[13px]">Todavía no estás inscripto en ningún curso.</p>
            </section>
        );
    }

    return (
        <section
            aria-label="Mis cursos"
            className="bg-surface border-border rounded-[16px] border p-5"
        >
            <header className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                    Mis cursos
                </h2>
                <Link
                    href={'/aula' as `/${string}`}
                    className="text-primary text-[12px] font-medium hover:underline"
                >
                    Ver todos
                </Link>
            </header>
            <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                    <li key={course.id}>
                        <Link
                            href={`/students/aula/cursos/${course.id}` as `/${string}`}
                            className="bg-paper-warm border-border hover:border-primary/30 group flex h-full flex-col gap-3 rounded-[12px] border p-4 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <BookOpen
                                    className="text-primary size-5 shrink-0"
                                    aria-hidden="true"
                                />
                                {course.averageGrade !== null && (
                                    <span
                                        className={cn(
                                            'flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold',
                                            course.averageGrade >= 4.0
                                                ? 'bg-success-wash text-success'
                                                : 'bg-danger-wash text-destructive',
                                        )}
                                    >
                                        <GraduationCap className="size-3" aria-hidden="true" />
                                        {course.averageGrade.toFixed(1)}
                                    </span>
                                )}
                            </div>
                            <p className="text-ink line-clamp-2 text-[14px] font-medium">
                                {course.title}
                            </p>
                            <div className="mt-auto">
                                <div className="text-mute mb-1 flex items-center justify-between font-mono text-[10px] font-bold tracking-wider uppercase">
                                    <span>Progreso</span>
                                    <span className="text-ink">{course.progressPct}%</span>
                                </div>
                                <div className="bg-border h-1.5 w-full overflow-hidden rounded-full">
                                    <div
                                        className="bg-primary group-hover:bg-primary/90 h-full rounded-full transition-all"
                                        style={{ width: `${course.progressPct}%` }}
                                    />
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
