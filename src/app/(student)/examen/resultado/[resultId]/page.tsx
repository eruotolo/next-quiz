import { Button } from '@/shared/components/ui/button';
import { calcGrade } from '@/features/results/lib/grade';
import { cn } from '@/shared/lib/utils';
import { prisma } from '@/shared/lib/prisma';
import { getResultSession } from '@/features/exam-session/lib/session';
import { auth } from '@/features/auth/auth';
import { CheckCircle, XCircle } from 'lucide-react';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/features/results/components/PrintButton';

interface PageProps {
    params: Promise<{ resultId: string }>;
}

export default async function ResultadoPage({ params }: PageProps): Promise<React.JSX.Element> {
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

    const [resultSession, adminSession] = await Promise.all([getResultSession(), auth()]);
    const isOwner =
        resultSession?.studentId === result.studentId && resultSession?.resultId === resultId;
    const isAdmin = !!adminSession?.user;
    if (!isOwner && !isAdmin) notFound();

    const percentage =
        result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

    const grade = calcGrade(
        result.score,
        result.maxScore,
        result.exam.maxGrade,
        result.exam.passingGrade,
        result.exam.passingPercentage,
    );
    const passing = grade >= result.exam.passingGrade;

    const answerMap = result.answers as Record<string, string[] | string>;

    function getSelectedIds(val: string[] | string | undefined): string[] {
        if (!val) return [];
        return Array.isArray(val) ? val : [val];
    }

    const correctCount = result.exam.questions.filter((q) => {
        const selectedIds = getSelectedIds(answerMap[q.id]);
        const correctSet = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
        const selectedSet = new Set(selectedIds);
        return (
            selectedSet.size > 0 &&
            correctSet.size === selectedSet.size &&
            [...correctSet].every((id) => selectedSet.has(id))
        );
    }).length;

    return (
        <div className="flex min-h-screen flex-col bg-paper print:bg-white">
            {/* Top bar */}
            <header className="flex items-center gap-3 border-b border-border bg-white px-8 py-4 print:pb-2">
                <LogoMark size={28} />
                <LogoWordmark size={16} color="#0b0b11" />
                <div className="ml-2 h-4 w-px bg-border" />
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
                    Resultado entregado
                </span>
            </header>

            <main className="mx-auto w-full max-w-2xl px-4 py-10 pb-16">
                {/* Hero card — ink bg */}
                <div
                    className="mb-8 overflow-hidden rounded-[18px] print:hidden"
                    style={{
                        background: [
                            'radial-gradient(ellipse at 15% 50%, rgba(31,46,255,0.4) 0%, transparent 60%)',
                            'radial-gradient(ellipse at 85% 30%, rgba(214,255,31,0.2) 0%, transparent 50%)',
                            '#0b0b11',
                        ].join(', '),
                    }}
                >
                    <div className="grid gap-6 p-8 lg:grid-cols-2 lg:p-10">
                        {/* Left */}
                        <div className="flex flex-col justify-center gap-4">
                            <span className="w-fit rounded-full bg-lime/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-lime">
                                Resultado final
                            </span>
                            <h1 className="font-display text-[30px] font-semibold leading-tight tracking-[-0.025em] text-white">
                                {passing ? '¡Buen trabajo' : 'Examen completado'},{' '}
                                {result.student.name}!
                            </h1>
                            <p className="text-[14px] text-white/50">
                                Completaste el examen <strong className="text-white/80">{result.exam.title}</strong>.
                            </p>
                            <div className="flex gap-3 pt-2 print:hidden">
                                <Button variant="lime" size="sm" asChild>
                                    <Link href="/">Volver al inicio</Link>
                                </Button>
                                <PrintButton />
                            </div>
                        </div>

                        {/* Right — grade */}
                        <div className="flex flex-col items-end justify-center">
                            <div
                                className={cn(
                                    'font-display text-[120px] font-semibold leading-none tracking-[-0.04em]',
                                    passing ? 'text-lime' : 'text-coral',
                                )}
                            >
                                {grade.toFixed(1)}
                            </div>
                            <p className="font-mono text-[12px] text-white/40">
                                {correctCount}/{result.exam.questions.length} correctas · {percentage}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Print-only header */}
                <div className="mb-6 hidden print:block">
                    <h1 className="text-[20px] font-bold text-ink">{result.exam.title}</h1>
                    <p className="text-[14px] text-ink-dim">
                        {result.student.name} {result.student.lastname} · Nota{' '}
                        {grade.toFixed(1)} · {correctCount}/{result.exam.questions.length} correctas
                    </p>
                </div>

                {/* Stat tiles */}
                <div className="mb-8 grid grid-cols-3 gap-3 print:hidden">
                    {[
                        { label: 'Nota final', value: grade.toFixed(1), sub: passing ? 'Aprobado' : 'Reprobado', pass: passing },
                        { label: 'Correctas', value: `${correctCount}/${result.exam.questions.length}`, sub: `${percentage}%` },
                        { label: 'Puntaje', value: `${result.score}/${result.maxScore}`, sub: 'puntos' },
                    ].map((tile) => (
                        <div key={tile.label} className="rounded-[12px] border border-border bg-white p-4 text-center">
                            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
                                {tile.label}
                            </p>
                            <p
                                className={cn(
                                    'font-display text-[32px] font-semibold leading-none tracking-[-0.025em]',
                                    'pass' in tile && tile.pass !== undefined
                                        ? tile.pass
                                            ? 'text-success'
                                            : 'text-destructive'
                                        : 'text-ink',
                                )}
                            >
                                {tile.value}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-mute">{tile.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Question review */}
                <h2 className="mb-4 text-[15px] font-semibold text-ink">Detalle por pregunta</h2>
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
                                    'rounded-[12px] border p-5',
                                    isCorrect
                                        ? 'border-success/25 bg-success/5'
                                        : 'border-destructive/20 bg-danger-wash/50',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {isCorrect ? (
                                        <CheckCircle size={18} className="mt-0.5 shrink-0 text-success" />
                                    ) : (
                                        <XCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
                                    )}
                                    <p className="text-[14px] font-medium leading-relaxed text-ink">
                                        {idx + 1}. {q.text}
                                    </p>
                                </div>

                                {!isCorrect && (
                                    <div className="ml-7 mt-2 flex flex-col gap-1 text-[13px]">
                                        <p className="text-destructive">
                                            <span className="font-semibold">Tu respuesta:</span>{' '}
                                            {selectedOptions.length > 0
                                                ? selectedOptions.map((o) => o.text).join(', ')
                                                : 'Sin respuesta'}
                                        </p>
                                        <p className="text-success">
                                            <span className="font-semibold">
                                                {correctOptions.length > 1 ? 'Correctas:' : 'Correcta:'}
                                            </span>{' '}
                                            {correctOptions.map((o) => o.text).join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-center gap-3 print:hidden">
                    <PrintButton />
                    <Button asChild variant="ink" size="lg">
                        <Link href="/">Volver al inicio</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
