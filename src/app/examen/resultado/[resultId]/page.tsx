import { Button } from '@/components/ui/button';
import { calcGrade } from '@/lib/grade';
import { cn } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { getResultSession } from '@/lib/student-session';
import { auth } from '@/auth';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { LogoMark } from '@/components/ui/logo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from './_components/PrintButton';

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

    const answerMap = result.answers as Record<string, string>;

    return (
        <div className="flex min-h-screen flex-col bg-[linear-gradient(135deg,#e6f1fe_0%,#ffffff_50%,#f0f7ff_100%)] print:bg-white">
            {/* Header */}
            <header className="flex items-center gap-3 px-8 py-6 print:pb-2">
                <LogoMark size={36} />
                <span className="text-lg font-bold text-foreground">EduNext Quiz</span>
            </header>

            <main className="mx-auto w-full max-w-2xl px-4 pb-16">
                {/* Score card */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
                    {/* Top band */}
                    <div className="bg-primary px-7 py-5 text-primary-foreground">
                        <div className="flex items-center gap-3">
                            <Award size={24} />
                            <div>
                                <p className="text-xs font-medium text-primary-foreground/80">
                                    Resultado del examen
                                </p>
                                <h1 className="text-lg font-bold">{result.exam.title}</h1>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-7">
                        {/* Student */}
                        <p className="mb-0 text-center text-[15px] text-muted-foreground">
                            <span className="font-semibold text-foreground">
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
                                    <span className="text-[38px] font-extrabold tracking-tight text-foreground">
                                        {percentage}%
                                    </span>
                                    <span className="text-[13px] text-muted-foreground">
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
                        <div className="mt-7 grid grid-cols-3 gap-3 rounded-[14px] bg-muted/50 p-4">
                            <div className="text-center">
                                <p className="text-[22px] font-extrabold text-foreground">
                                    {result.score}
                                </p>
                                <p className="text-[11px] text-muted-foreground">Puntos obtenidos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[22px] font-extrabold text-foreground">
                                    {result.maxScore}
                                </p>
                                <p className="text-[11px] text-muted-foreground">Puntos posibles</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[22px] font-extrabold text-foreground">
                                    {result.exam.questions.length}
                                </p>
                                <p className="text-[11px] text-muted-foreground">Preguntas</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question review */}
                <h2 className="mb-3.5 text-[15.5px] font-bold text-foreground">
                    Revisión de respuestas
                </h2>
                <div className="flex flex-col gap-2.5">
                    {result.exam.questions.map((q, idx) => {
                        const selectedId = answerMap[q.id];
                        const correctOption = q.options.find((o) => o.isCorrect);
                        const selectedOption = q.options.find((o) => o.id === selectedId);
                        const isCorrect = selectedId === correctOption?.id;

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
                                            className="mt-[1px] shrink-0 text-success"
                                        />
                                    ) : (
                                        <XCircle
                                            size={20}
                                            className="mt-[1px] shrink-0 text-destructive"
                                        />
                                    )}
                                    <p className="text-sm leading-[1.45] font-medium text-foreground">
                                        {idx + 1}. {q.text}
                                    </p>
                                </div>

                                {!isCorrect && (
                                    <div className="ml-8 mt-2 flex flex-col gap-1 text-[13px]">
                                        <p className="text-destructive">
                                            <span className="font-semibold">Tu respuesta:</span>{' '}
                                            {selectedOption?.text ?? 'Sin respuesta'}
                                        </p>
                                        <p className="text-success">
                                            <span className="font-semibold">Correcta:</span>{' '}
                                            {correctOption?.text}
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
