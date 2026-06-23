import { prisma } from '@/shared/lib/prisma';
import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { startSelectedExam, viewMyResult } from '@/features/exam-session/actions/mutations';
import { calcGrade } from '@/shared/lib/grade';
import { Button } from '@/shared/components/ui/button';
import { Avatar } from '@/shared/components/ui/avatar';
import { StudentTopBar } from '@/features/exam-session/components/StudentTopBar';
import { ExamCloseCountdown } from '@/features/exam-session/components/ExamCloseCountdown';
import { cn } from '@/shared/lib/utils';
import {
    closesLabel,
    dayLabel,
    opensLabel,
    completedFormatter,
    WEEK_MS,
} from '@/features/exam-session/lib/exam-formatters';
import { ArrowRight, BookOpen, Clock, UserRound } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Mis exámenes · Aulika',
};



// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: página con clasificación de exámenes en 3 secciones (disponibles, próximos, rendidos) + sidebar; separarla dispersaría la lógica de una sola vista
export default async function ExamSelectionPage() {
    const authSession = await getStudentAuthSession();
    if (!authSession) redirect('/examen/login');

    const student = await prisma.user.findUnique({
        where: { id: authSession.studentId },
        select: {
            name: true,
            lastname: true,
            academicInstitutionId: true,
            group: { select: { name: true } },
            academicInstitution: { select: { name: true } },
        },
    });
    if (!student) redirect('/examen/login');

    const exams = await prisma.exam.findMany({
        where: {
            academicInstitutionId: student.academicInstitutionId,
            groups: { some: { id: authSession.groupId } },
            questions: { some: {} },
            OR: [
                { active: true },
                { results: { some: { studentId: authSession.studentId } } }
            ],
        },
        select: {
            id: true,
            title: true,
            subject: true,
            unit: true,
            timeLimit: true,
            scheduledAt: true,
            closesAt: true,
            maxGrade: true,
            passingGrade: true,
            passingPercentage: true,
            _count: { select: { questions: true } },
            createdBy: { select: { name: true, lastname: true } },
            results: {
                where: { studentId: authSession.studentId },
                select: { id: true, score: true, maxScore: true, completedAt: true },
                take: 1,
            },
        },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    });

    const now = new Date();
    const nowMs = now.getTime();

    type ExamRow = (typeof exams)[number];
    const available: ExamRow[] = [];
    const upcoming: ExamRow[] = [];
    const taken: ExamRow[] = [];

    for (const exam of exams) {
        if (exam.results.length > 0) {
            taken.push(exam);
            continue;
        }
        const opensAt = exam.scheduledAt?.getTime() ?? null;
        const closesAtMs = exam.closesAt?.getTime() ?? null;
        if (opensAt !== null && opensAt > nowMs) {
            upcoming.push(exam);
        } else if (closesAtMs !== null && closesAtMs < nowMs) {
            // Vencido sin rendir: no se muestra (no es rendible ni próximo).
        } else {
            available.push(exam);
        }
    }

    const pendingCount = available.length + upcoming.length;
    const thisWeekCount = upcoming.filter(
        (e) => e.scheduledAt && e.scheduledAt.getTime() <= nowMs + WEEK_MS,
    ).length;

    const grades: number[] = [];
    for (const e of taken) {
        const r = e.results[0];
        if (!r) continue;
        grades.push(calcGrade(r.score, r.maxScore, e.maxGrade, e.passingGrade, e.passingPercentage));
    }
    const average =
        grades.length > 0 ? (grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(1) : null;

    const fullName = `${student.name} ${student.lastname}`;
    const groupName = student.group?.name ?? null;
    const institutionName = student.academicInstitution?.name ?? null;
    const topbarLabel = [institutionName, 'Mis exámenes'].filter(Boolean).join(' · ');

    // Agenda lateral: disponibles + próximos ordenados por fecha de referencia.
    const agenda = [...available, ...upcoming]
        .map((e) => ({ exam: e, ref: e.scheduledAt ?? e.closesAt ?? now }))
        .sort((a, b) => a.ref.getTime() - b.ref.getTime())
        .slice(0, 6);

    return (
        <div className="bg-paper flex min-h-screen flex-col">
            <StudentTopBar
                topbarLabel={topbarLabel}
                fullName={fullName}
                groupName={groupName}
                showLogout
            />

            <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_320px]">
                {/* Main column */}
                <div className="min-w-0">
                    <span className="text-mute font-mono text-[11px] tracking-[0.1em] uppercase">
                        Mis exámenes
                    </span>
                    <h1 className="font-display text-ink mt-2 text-[40px] leading-none font-semibold tracking-[-0.03em]">
                        Hola, {student.name}.
                    </h1>
                    <p className="text-ink-dim mt-3 max-w-xl text-[14px] leading-relaxed">
                        {available.length > 0
                            ? `Tienes ${available.length} examen${available.length !== 1 ? 'es' : ''} disponible${available.length !== 1 ? 's' : ''} ahora`
                            : 'No tienes exámenes disponibles ahora'}
                        {upcoming.length > 0 &&
                            ` y ${upcoming.length} programado${upcoming.length !== 1 ? 's' : ''}`}
                        . Cuando estés en un lugar tranquilo, abre el que toca.
                    </p>

                    {/* Disponible ahora */}
                    {available.length > 0 && (
                        <section className="mt-8">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="text-ink font-mono text-[11px] tracking-[0.1em] uppercase">
                                    Disponible ahora
                                </span>
                                <span className="bg-primary inline-flex size-4 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white">
                                    {available.length}
                                </span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {available.map((exam) => {
                                    const teacher = exam.createdBy
                                        ? `${exam.createdBy.name} ${exam.createdBy.lastname}`
                                        : null;
                                    const closeSeconds = exam.closesAt
                                        ? Math.max(
                                              0,
                                              Math.ceil((exam.closesAt.getTime() - nowMs) / 1000),
                                          )
                                        : null;
                                    return (
                                        <div
                                            key={exam.id}
                                            className="border-primary/40 grid gap-5 rounded-[16px] border-2 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
                                        >
                                            <div className="min-w-0">
                                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                                    {(exam.subject || exam.unit) && (
                                                        <span className="bg-primary-wash text-primary rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] uppercase">
                                                            {[exam.subject, exam.unit]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </span>
                                                    )}
                                                    {exam.closesAt && (
                                                        <span className="text-warning font-mono text-[10px] font-semibold">
                                                            {closesLabel(exam.closesAt, now)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-display text-ink text-[22px] leading-tight font-semibold tracking-[-0.02em]">
                                                    {exam.title}
                                                </p>
                                                <div className="text-mute mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                                                        <BookOpen size={12} />
                                                        {exam._count.questions} preguntas
                                                    </span>
                                                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                                                        <Clock size={12} />
                                                        {exam.timeLimit} min
                                                    </span>
                                                    {teacher && (
                                                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                                                            <UserRound size={12} />
                                                            {teacher}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-start gap-3 sm:items-end">
                                                {closeSeconds !== null && (
                                                    <div className="text-right">
                                                        <p className="text-mute font-mono text-[9px] tracking-[0.1em] uppercase">
                                                            Tiempo restante
                                                        </p>
                                                        <p className="font-display text-ink text-[28px] leading-none font-semibold tracking-[-0.02em]">
                                                            <ExamCloseCountdown
                                                                initialSeconds={closeSeconds}
                                                            />
                                                        </p>
                                                    </div>
                                                )}
                                                <form
                                                    action={startSelectedExam.bind(null, exam.id)}
                                                >
                                                    <Button variant="primary" size="lg" type="submit">
                                                        Comenzar
                                                        <ArrowRight className="size-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Próximos */}
                    {upcoming.length > 0 && (
                        <section className="mt-8">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="text-ink font-mono text-[11px] tracking-[0.1em] uppercase">
                                    Próximos
                                </span>
                                <span className="bg-ink inline-flex size-4 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white">
                                    {upcoming.length}
                                </span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {upcoming.map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="border-border rounded-[14px] border border-l-[3px] border-l-primary bg-white p-5"
                                    >
                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                            {(exam.subject || exam.unit) && (
                                                <span className="text-mute font-mono text-[10px] tracking-[0.08em] uppercase">
                                                    {[exam.subject, exam.unit]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </span>
                                            )}
                                            {exam.scheduledAt && (
                                                <span className="bg-paper-warm text-ink-dim rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.06em] uppercase">
                                                    {dayLabel(exam.scheduledAt, now)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-display text-ink text-[17px] leading-tight font-semibold tracking-[-0.01em]">
                                            {exam.title}
                                        </p>
                                        <div className="text-mute mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="flex items-center gap-1 font-mono text-[11px]">
                                                <BookOpen size={11} />
                                                {exam._count.questions} preg.
                                            </span>
                                            <span className="flex items-center gap-1 font-mono text-[11px]">
                                                <Clock size={11} />
                                                {exam.timeLimit} min
                                            </span>
                                        </div>
                                        {exam.scheduledAt && (
                                            <p className="text-ink-dim border-border mt-3 border-t pt-2.5 font-mono text-[11px]">
                                                {opensLabel(exam.scheduledAt, now)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Ya rendidos */}
                    {taken.length > 0 && (
                        <section className="mt-8">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="text-ink font-mono text-[11px] tracking-[0.1em] uppercase">
                                    Ya rendidos
                                </span>
                                <span className="bg-success inline-flex size-4 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white">
                                    {taken.length}
                                </span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {taken.map((exam) => {
                                    const r = exam.results[0];
                                    if (!r) return null;
                                    const grade = calcGrade(
                                        r.score,
                                        r.maxScore,
                                        exam.maxGrade,
                                        exam.passingGrade,
                                        exam.passingPercentage,
                                    );
                                    const passing = grade >= exam.passingGrade;
                                    return (
                                        <div
                                            key={exam.id}
                                            className="border-border border-l-success grid gap-4 rounded-[14px] border border-l-[3px] bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center"
                                        >
                                            <div className="min-w-0">
                                                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                    {(exam.subject || exam.unit) && (
                                                        <span className="text-mute font-mono text-[10px] tracking-[0.08em] uppercase">
                                                            {[exam.subject, exam.unit]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </span>
                                                    )}
                                                    <span className="text-success font-mono text-[10px] font-semibold">
                                                        Entregado · {completedFormatter.format(r.completedAt)}
                                                    </span>
                                                </div>
                                                <p className="text-ink text-[15px] leading-tight font-semibold">
                                                    {exam.title}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-mute font-mono text-[9px] tracking-[0.1em] uppercase">
                                                        Nota
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            'font-display text-[24px] leading-none font-semibold',
                                                            passing ? 'text-success' : 'text-destructive',
                                                        )}
                                                    >
                                                        {grade.toFixed(1)}
                                                    </p>
                                                </div>
                                                <form action={viewMyResult.bind(null, r.id)}>
                                                    <Button variant="ghost" size="sm" type="submit">
                                                        Ver resultado
                                                        <ArrowRight className="size-3.5" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {available.length === 0 &&
                        upcoming.length === 0 &&
                        taken.length === 0 && (
                            <div className="border-border mt-8 rounded-[16px] border border-dashed bg-white p-10 text-center">
                                <p className="text-ink text-[15px] font-semibold">
                                    No tienes exámenes asignados todavía
                                </p>
                                <p className="text-mute mt-1 text-[13px]">
                                    Cuando tu profesor publique uno, va a aparecer acá.
                                </p>
                            </div>
                        )}
                </div>

                {/* Sidebar */}
                <aside className="flex flex-col gap-4">
                    {/* Student card — ink */}
                    <div className="bg-ink rounded-[16px] p-5 text-white">
                        <div className="flex items-center gap-3">
                            <Avatar name={fullName} size={40} />
                            <div className="min-w-0 leading-tight">
                                <p className="truncate text-[14px] font-semibold">{fullName}</p>
                                <p className="truncate text-[11px] text-white/50">
                                    {[groupName, institutionName].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                        </div>
                        <div className="border-border/10 mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                            {[
                                { value: pendingCount, label: 'Pendientes' },
                                { value: thisWeekCount, label: 'Esta semana' },
                                { value: average ?? '—', label: 'Promedio' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <p className="font-display text-[24px] leading-none font-semibold">
                                        {stat.value}
                                    </p>
                                    <p className="mt-1 font-mono text-[9px] tracking-[0.06em] text-white/40 uppercase">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Esta semana — agenda */}
                    {agenda.length > 0 && (
                        <div className="border-border rounded-[16px] border bg-white p-5">
                            <p className="text-mute mb-3 font-mono text-[10px] tracking-[0.1em] uppercase">
                                Esta semana
                            </p>
                            <div className="flex flex-col gap-3">
                                {agenda.map(({ exam, ref }) => {
                                    const isAvailable = available.includes(exam);
                                    return (
                                        <div key={exam.id} className="flex items-center gap-3">
                                            <span className="text-mute w-8 shrink-0 font-mono text-[10px] font-semibold tracking-[0.06em] uppercase">
                                                {dayLabel(ref, now)}
                                            </span>
                                            <span className="text-ink-dim min-w-0 flex-1 truncate text-[12px]">
                                                {[exam.subject, exam.unit].filter(Boolean).join(' · ') ||
                                                    exam.title}
                                            </span>
                                            <span
                                                className={cn(
                                                    'size-1.5 shrink-0 rounded-full',
                                                    isAvailable ? 'bg-lime' : 'bg-primary',
                                                )}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Sesión */}
                    <div className="bg-primary-wash/50 rounded-[16px] p-5">
                        <p className="text-primary mb-1.5 text-[13px] font-semibold">
                            Tu sesión es solo tuya
                        </p>
                        <p className="text-ink-dim text-[12px] leading-relaxed">
                            Ingresaste con tu RUT. Si te desconectas, retomas el examen donde
                            quedaste. ¿Dudas?{' '}
                            <a
                                href="mailto:hola@aulika.cl"
                                className="text-primary underline"
                            >
                                hola@aulika.cl
                            </a>
                        </p>
                    </div>
                </aside>
            </main>
        </div>
    );
}
