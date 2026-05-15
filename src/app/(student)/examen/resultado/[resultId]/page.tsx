import { Button } from '@/shared/components/ui/button';
import { calcGrade } from '@/features/results/lib/grade';
import { cn } from '@/shared/lib/utils';
import { prisma } from '@/shared/lib/prisma';
import { getResultSession } from '@/features/exam-session/lib/session';
import { auth } from '@/features/auth/auth';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { LogoMark } from '@/shared/components/branding/logo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/features/results/components/PrintButton';

interface PageProps {
    params: Promise<{ resultId: string }>;
}

export default async function ResultadoPage({ params }: PageProps) {
    const { resultId } = await params;

    const result = await prisma.result.findUnique({
        where: { id: resultId },
        include: {
            student: { select: { name: true, lastname: true } },
            exam: {
                select: {
                    title: true,
                    maxGrade: true,
                    passingGrade: true,
                    passingPercentage: true,
                    questions: {
                        orderBy: { order: 'asc' },
                        include: {
                            options: { select: { id: true, text: true, isCorrect: true } },
                        },
                    },
                },
            },
        },
    });

    if (!result) notFound();

    // Allow access to: the student who owns the result (via result session set at exam completion),
    // or any logged-in admin.
    const [resultSession, adminSession] = await Promise.all([getResultSession(), auth()]);
    const isOwner =
        resultSession?.studentId === result.studentId && resultSession?.resultId === resultId;
    const isAdmin = !!adminSession?.user;
    if (!isOwner && !isAdmin) notFound();

    const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

    const grade = calcGrade(
        result.score,
        result.maxScore,
        result.exam.maxGrade,
        result.exam.passingGrade,
        result.exam.passingPercentage,
    );
    const passing = grade >= result.exam.passingGrade;

    const gradeColorClass = passing
        ? 'text-success border-success bg-success/10'
        : 'text-destructive border-destructive bg-destructive/10';

    const arcColor = passing ? 'stroke-success' : 'stroke-destructive';

    const answerMap = result.answers as Record<string, string[] | string>;

    // Normalize old string format (before multi-select) and new string[] format
    function getSelectedIds(val: string[] | string | undefined): string[] {
        if (!val) return [];
        return Array.isArray(val) ? val : [val];
    }

    return (
        <div className="flex min-h-screen flex-col bg-[linear-gradient(135deg,#e6f1fe_0%,#ffffff_50%,#f0f7ff_100%)] print:bg-white">
            {/* Header */}
            <header className="flex items-center gap-3 px-8 py-6 print:pb-2">
                <LogoMark size={36} />
                <span className="text-foreground text-lg font-bold">EduNext Quiz</span>
            </header>

            <main className="mx-auto w-full max-w-2xl px-4 pb-16">
                {/* Score card */}
                <div className="border-border mb-8 overflow-hidden rounded-2xl border bg-white shadow-xl">
                    {/* Top band */}
                    <div className="bg-primary text-primary-foreground px-7 py-5">
                        <div className="flex items-center gap-3">
                            <Award size={24} />
                            <div>
                                <p className="text-primary-foreground/80 text-xs font-medium">
                                    Resultado del examen
                                </p>
                                <h1 className="text-lg font-bold">{result.exam.title}</h1>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-7">
                        {/* Student */}
                        <p className="text-muted-foreground mb-0 text-center text-[15px]">
                            <span className="text-foreground font-semibold">
                                {result.student.name} {result.student.lastname}
                            </span>
                        </p>

                        {/* Big score */}
                        <div className="mt-6 flex flex-col items-center gap-[18px]">
                            {/* Circle */}
                            <div className="relative h-[160px] w-[160px]">
                                <svg
                                    aria-hidden="true"
                                    width="160"
                                    height="160"
                                    className="-rotate-90"
                                >
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="68"
                                        fill="none"
                                        className="stroke-border"
                                        strokeWidth="12"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="68"
                                        fill="none"
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 68}`}
                                        strokeDashoffset={`${2 * Math.PI * 68 * (1 - percentage / 100)}`}
                                        className={arcColor}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-foreground text-[38px] font-extrabold tracking-tight">
                                        {percentage}%
                                    </span>
                                    <span className="text-muted-foreground text-[13px]">
                                        {result.score}/{result.maxScore} pts
                                    </span>
                                </div>
                            </div>

                            {/* Grade badge */}
                            <div
                                className={cn(
                                    'rounded-[14px] border-2 px-6 py-2 text-xl font-extrabold',
                                    gradeColorClass,
                                )}
                            >
                                Nota {grade.toFixed(1)}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-muted/50 mt-7 grid grid-cols-3 gap-3 rounded-[14px] p-4">
                            <div className="text-center">
                                <p className="text-foreground text-[22px] font-extrabold">
                                    {result.score}
                                </p>
                                <p className="text-muted-foreground text-[11px]">
                                    Puntos obtenidos
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-foreground text-[22px] font-extrabold">
                                    {result.maxScore}
                                </p>
                                <p className="text-muted-foreground text-[11px]">Puntos posibles</p>
                            </div>
                            <div className="text-center">
                                <p className="text-foreground text-[22px] font-extrabold">
                                    {result.exam.questions.length}
                                </p>
                                <p className="text-muted-foreground text-[11px]">Preguntas</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question review */}
                <h2 className="text-foreground mb-3.5 text-[15.5px] font-bold">
                    Revisión de respuestas
                </h2>
                <div className="flex flex-col gap-2.5">
                    {result.exam.questions.map((q, idx) => {
                        const selectedIds = getSelectedIds(answerMap[q.id]);
                        const correctOptions = q.options.filter((o) => o.isCorrect);
                        const correctSet = new Set(correctOptions.map((o) => o.id));
                        const selectedSet = new Set(selectedIds);
                        const isCorrect =
                            selectedSet.size > 0 &&
                            correctSet.size === selectedSet.size &&
                            [...correctSet].every((id) => selectedSet.has(id));
                        const selectedOptions = q.options.filter((o) => selectedIds.includes(o.id));

                        return (
                            <div
                                key={q.id}
                                className={cn(
                                    'rounded-[14px] border-2 p-[18px]',
                                    isCorrect
                                        ? 'border-success/30 bg-success/10'
                                        : 'border-destructive/30 bg-destructive/10',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {isCorrect ? (
                                        <CheckCircle
                                            size={20}
                                            className="text-success mt-[1px] shrink-0"
                                        />
                                    ) : (
                                        <XCircle
                                            size={20}
                                            className="text-destructive mt-[1px] shrink-0"
                                        />
                                    )}
                                    <p className="text-foreground text-sm leading-[1.45] font-medium">
                                        {idx + 1}. {q.text}
                                    </p>
                                </div>

                                {!isCorrect && (
                                    <div className="mt-2 ml-8 flex flex-col gap-1 text-[13px]">
                                        <p className="text-destructive">
                                            <span className="font-semibold">Tu respuesta:</span>{' '}
                                            {selectedOptions.length > 0
                                                ? selectedOptions.map((o) => o.text).join(', ')
                                                : 'Sin respuesta'}
                                        </p>
                                        <p className="text-success">
                                            <span className="font-semibold">
                                                {correctOptions.length > 1
                                                    ? 'Correctas:'
                                                    : 'Correcta:'}
                                            </span>{' '}
                                            {correctOptions.map((o) => o.text).join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-7 flex items-center justify-center gap-3 print:hidden">
                    <PrintButton />
                    <Button asChild size="lg" className="rounded-full font-semibold">
                        <Link href="/">Volver al inicio</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
