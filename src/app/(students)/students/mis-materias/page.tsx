import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, CheckCircle2, GraduationCap, XCircle } from 'lucide-react';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import {
    getDashboardContext,
    getExamHistory,
    getLmsCourseHistory,
} from '@/features/students/lib/dashboard-queries';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

export const metadata = {
    title: 'Mis materias · Aulika',
};

function formatDate(date: Date): string {
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

async function ExamHistorySection({ studentId }: { studentId: string }) {
    const exams = await getExamHistory(studentId);

    if (exams.length === 0) {
        return (
            <div className="border-border rounded-[14px] border-2 border-dashed bg-white p-8 text-center">
                <GraduationCap className="text-mute mx-auto mb-3 size-8" />
                <p className="text-ink text-[14px] font-medium">Sin exámenes rendidos</p>
                <p className="text-mute mt-1 text-[13px]">
                    Cuando completes un examen, tu historial aparecerá aquí.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface border-border overflow-hidden rounded-[14px] border">
            <div className="divide-border divide-y">
                {exams.map((row) => (
                    <Link
                        key={row.resultId}
                        href={`/students/examen/resultado/${row.resultId}` as `/${string}`}
                        className="hover:bg-paper-warm flex items-center justify-between gap-4 px-5 py-4 transition-colors"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-ink truncate text-[13.5px] font-medium">
                                {row.examTitle}
                            </p>
                            <p className="text-mute mt-0.5 font-mono text-[11px]">
                                {row.subject ?? 'Examen'} · {formatDate(row.completedAt)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {row.passed ? (
                                <CheckCircle2 className="text-success size-4 shrink-0" />
                            ) : (
                                <XCircle className="text-destructive size-4 shrink-0" />
                            )}
                            <span
                                className={cn(
                                    'font-display w-10 text-right text-[18px] font-bold tabular-nums',
                                    row.passed ? 'text-success' : 'text-destructive',
                                )}
                            >
                                {row.grade.toFixed(1)}
                            </span>
                            <ArrowUpRight
                                className="text-mute size-4 shrink-0"
                                aria-hidden="true"
                            />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function ExamHistorySkeleton() {
    return (
        <div className="bg-surface border-border overflow-hidden rounded-[14px] border">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-border flex items-center gap-4 border-b px-5 py-4">
                    <div className="flex-1">
                        <Skeleton className="mb-1.5 h-3.5 w-48" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-lg" />
                </div>
            ))}
        </div>
    );
}

async function LmsCoursesSection({ studentId }: { studentId: string }) {
    const courses = await getLmsCourseHistory(studentId);

    if (courses.length === 0) return null;

    return (
        <section>
            <div className="mb-4 flex items-center gap-2">
                <BookOpen className="text-mute size-4" />
                <h2 className="text-ink text-[15px] font-semibold">Aula Virtual</h2>
                <span className="text-mute text-[12px]">({courses.length} cursos)</span>
            </div>
            <div className="flex flex-col gap-3">
                {courses.map((course) => (
                    <details
                        key={course.courseId}
                        className="bg-surface border-border group rounded-[14px] border open:shadow-sm"
                    >
                        <summary className="hover:bg-paper-warm flex cursor-pointer items-center gap-3 rounded-[14px] px-4 py-3 [&::-webkit-details-marker]:hidden">
                            <span
                                className={cn(
                                    'font-display inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
                                    course.average === null
                                        ? 'bg-paper-warm text-mute'
                                        : course.passed
                                          ? 'bg-success-wash text-success'
                                          : 'bg-danger-wash text-destructive',
                                )}
                            >
                                {course.average === null ? '—' : course.average.toFixed(1)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-ink truncate text-[14px] font-semibold">
                                    {course.title}
                                </p>
                                <p className="text-mute font-mono text-[11px]">
                                    {course.completedItems}/{course.totalItems} evaluaciones
                                    {course.passed === true && ' · Aprobado'}
                                    {course.passed === false && ' · Reprobado'}
                                </p>
                            </div>
                            <span className="text-mute transition-transform group-open:rotate-180">
                                ▾
                            </span>
                        </summary>
                        {course.items.length === 0 ? (
                            <p className="text-mute border-border border-t px-4 py-3 text-[13px]">
                                Este curso aún no tiene evaluaciones publicadas.
                            </p>
                        ) : (
                            <ul className="border-border list-none divide-y divide-[color:var(--border)] border-t p-0">
                                {course.items.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 px-4 py-2.5"
                                    >
                                        <span className="text-ink-dim truncate text-[13px]">
                                            {item.title}
                                        </span>
                                        <span className="font-mono text-[12px] font-semibold">
                                            {item.score === null ? (
                                                <span className="text-mute">Pendiente</span>
                                            ) : (
                                                <span
                                                    className={cn(
                                                        item.score >= 4.0
                                                            ? 'text-success'
                                                            : 'text-destructive',
                                                    )}
                                                >
                                                    {item.score.toFixed(1)}
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </details>
                ))}
            </div>
        </section>
    );
}

function LmsCoursesSkeleton() {
    return (
        <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full rounded-[14px]" />
            <Skeleton className="h-16 w-full rounded-[14px]" />
        </div>
    );
}

export default async function MisMateriasPage() {
    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');
    const ctx = await getDashboardContext();
    const hasLms = ctx?.hasLms ?? false;

    return (
        <div className="flex flex-col gap-8">
            <div>
                <p className="text-mute mb-2 font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                    Historial académico
                </p>
                <h1 className="font-display text-ink text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">
                    Mis materias
                </h1>
                <p className="text-ink-dim mt-2 text-[14px]">
                    Calificaciones de exámenes y notas acumuladas de tus cursos LMS.
                </p>
            </div>

            <section>
                <div className="mb-4 flex items-center gap-2">
                    <GraduationCap className="text-mute size-4" />
                    <h2 className="text-ink text-[15px] font-semibold">Exámenes rendidos</h2>
                </div>
                <Suspense fallback={<ExamHistorySkeleton />}>
                    <ExamHistorySection studentId={session.studentId} />
                </Suspense>
            </section>

            {hasLms && (
                <Suspense fallback={<LmsCoursesSkeleton />}>
                    <LmsCoursesSection studentId={session.studentId} />
                </Suspense>
            )}
        </div>
    );
}
