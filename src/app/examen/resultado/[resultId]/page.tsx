import { prisma } from '@/lib/prisma';
import { Award, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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

    const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

    const grade = percentage >= 90 ? 'A' : percentage >= 75 ? 'B' : percentage >= 60 ? 'C' : 'F';
    const gradeColors: Record<string, string> = {
        A: 'text-success border-success bg-success-50',
        B: 'text-primary border-primary bg-primary-50',
        C: 'text-warning border-warning bg-warning-50',
        F: 'text-danger border-danger bg-danger-50',
    };

    const answerMap = result.answers as Record<string, string>;

    return (
        <div className="from-primary-50 to-secondary-50 min-h-screen bg-gradient-to-br via-white">
            {/* Header */}
            <header className="flex items-center gap-3 px-8 py-6">
                <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-xl text-white">
                    <BookOpen size={18} />
                </div>
                <span className="text-default-900 text-lg font-bold">EduNext Quiz</span>
            </header>

            <main className="mx-auto max-w-2xl px-4 pb-16">
                {/* Score card */}
                <div className="border-default-100 mb-8 overflow-hidden rounded-2xl border bg-white shadow-xl">
                    {/* Top band */}
                    <div className="bg-primary px-8 py-6 text-white">
                        <div className="flex items-center gap-3">
                            <Award size={24} />
                            <div>
                                <p className="text-primary-200 text-sm font-medium">
                                    Resultado del examen
                                </p>
                                <h1 className="text-xl font-bold">{result.exam.title}</h1>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Student */}
                        <p className="text-default-500 mb-6 text-center text-lg">
                            <span className="text-default-800 font-semibold">
                                {result.student.name} {result.student.lastname}
                            </span>
                        </p>

                        {/* Big score */}
                        <div className="mb-8 flex flex-col items-center gap-4">
                            {/* Circle */}
                            <div className="relative">
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
                                        className="stroke-default-100"
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
                                        className={
                                            percentage >= 75
                                                ? 'stroke-success'
                                                : percentage >= 60
                                                  ? 'stroke-warning'
                                                  : 'stroke-danger'
                                        }
                                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-default-900 text-4xl font-bold">
                                        {percentage}%
                                    </span>
                                    <span className="text-default-500 text-sm">
                                        {result.score}/{result.maxScore} pts
                                    </span>
                                </div>
                            </div>

                            {/* Grade badge */}
                            <div
                                className={`rounded-xl border-2 px-6 py-2 text-2xl font-bold ${gradeColors[grade] ?? ''}`}
                            >
                                Nota {grade}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-default-50 mb-6 grid grid-cols-3 gap-4 rounded-2xl p-4">
                            <div className="text-center">
                                <p className="text-default-900 text-2xl font-bold">
                                    {result.score}
                                </p>
                                <p className="text-default-500 text-xs">Puntos obtenidos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-default-900 text-2xl font-bold">
                                    {result.maxScore}
                                </p>
                                <p className="text-default-500 text-xs">Puntos posibles</p>
                            </div>
                            <div className="text-center">
                                <p className="text-default-900 text-2xl font-bold">
                                    {result.exam.questions.length}
                                </p>
                                <p className="text-default-500 text-xs">Preguntas</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question review */}
                <div className="space-y-4">
                    <h2 className="text-default-800 text-lg font-bold">Revisión de respuestas</h2>
                    {result.exam.questions.map((q, idx) => {
                        const selectedId = answerMap[q.id];
                        const correctOption = q.options.find((o) => o.isCorrect);
                        const selectedOption = q.options.find((o) => o.id === selectedId);
                        const isCorrect = selectedId === correctOption?.id;

                        return (
                            <div
                                key={q.id}
                                className={`rounded-xl border-2 p-5 ${
                                    isCorrect
                                        ? 'border-success-200 bg-success-50'
                                        : 'border-danger-200 bg-danger-50'
                                }`}
                            >
                                <div className="mb-3 flex items-start gap-3">
                                    {isCorrect ? (
                                        <CheckCircle
                                            size={20}
                                            className="text-success mt-0.5 shrink-0"
                                        />
                                    ) : (
                                        <XCircle
                                            size={20}
                                            className="text-danger mt-0.5 shrink-0"
                                        />
                                    )}
                                    <p className="text-default-900 font-medium">
                                        {idx + 1}. {q.text}
                                    </p>
                                </div>

                                {!isCorrect && (
                                    <div className="ml-8 space-y-1 text-sm">
                                        {selectedOption && (
                                            <p className="text-danger-700">
                                                <span className="font-medium">Tu respuesta:</span>{' '}
                                                {selectedOption.text}
                                            </p>
                                        )}
                                        {!selectedOption && (
                                            <p className="text-default-500 italic">Sin respuesta</p>
                                        )}
                                        <p className="text-success-700">
                                            <span className="font-medium">Correcta:</span>{' '}
                                            {correctOption?.text}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 text-center">
                    <Link
                        href="/"
                        className="bg-primary inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </main>
        </div>
    );
}
