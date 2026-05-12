'use client';

import { autoSubmit, finishExam, submitAnswer } from '@/actions/exam-session';
import type { SafeExam } from '@/types/exam';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { QuestionCard } from './QuestionCard';
import { Timer } from './Timer';

interface ExamCarouselProps {
    exam: SafeExam;
    initialSeconds: number;
}

export function ExamCarousel({ exam, initialSeconds }: ExamCarouselProps) {
    const router = useRouter();
    const submittedRef = useRef(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [direction, setDirection] = useState(1);
    const [isPending, startTransition] = useTransition();

    const totalQuestions = exam.questions.length;
    const currentQuestion = exam.questions[currentIndex];
    const isLastQuestion = currentIndex === totalQuestions - 1;
    const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

    const finalizeAndRedirect = useCallback(
        async (mode: 'manual' | 'auto'): Promise<void> => {
            if (submittedRef.current) return;
            submittedRef.current = true;
            try {
                const res = mode === 'auto' ? await autoSubmit() : await finishExam();
                router.replace(`/examen/resultado/${res.resultId}`);
            } catch (err) {
                submittedRef.current = false;
                toast.error('Error al enviar', {
                    description: 'No se pudo enviar el examen. Intentá de nuevo.',
                });
                console.error(err);
            }
        },
        [router],
    );

    const handleTimeout = useCallback(() => {
        toast.warning('¡Tiempo agotado!', {
            description: 'El examen se envió automáticamente.',
        });
        void finalizeAndRedirect('auto');
    }, [finalizeAndRedirect]);

    const handleNext = (): void => {
        if (!currentQuestion || !selectedOptionId) return;
        const questionId = currentQuestion.id;
        const optionId = selectedOptionId;

        startTransition(async () => {
            try {
                await submitAnswer({ questionId, optionId });
                if (isLastQuestion) {
                    await finalizeAndRedirect('manual');
                    return;
                }
                setDirection(1);
                setCurrentIndex((i) => i + 1);
                setSelectedOptionId(null);
            } catch {
                toast.error('Error al guardar', {
                    description: 'No se pudo guardar la respuesta. Reintentá.',
                });
            }
        });
    };

    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent): void => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);

        history.pushState(null, '', window.location.href);
        const onPopState = (): void => {
            history.pushState(null, '', window.location.href);
            toast.warning('Navegación bloqueada', {
                description: 'No podés salir mientras el examen está en curso.',
            });
        };
        window.addEventListener('popstate', onPopState);

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('popstate', onPopState);
        };
    }, []);

    if (!currentQuestion) return null;

    const variants = {
        enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
    };

    return (
        <div className="flex min-h-screen flex-col bg-muted/30">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-border bg-white/95 px-6 py-3.5 backdrop-blur-sm">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="truncate text-[15px] font-bold text-foreground">
                            {exam.title}
                        </h1>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                            {currentIndex + 1} / {totalQuestions} preguntas
                        </p>
                    </div>
                    <Timer initialSeconds={initialSeconds} onTimeout={handleTimeout} />
                </div>

                {/* Progress bar */}
                <div className="mx-auto mt-2.5 max-w-2xl">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* Question */}
            <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-8">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <QuestionCard
                            question={currentQuestion}
                            questionNumber={currentIndex + 1}
                            totalQuestions={totalQuestions}
                            selectedOptionId={selectedOptionId}
                            onSelect={setSelectedOptionId}
                            disabled={isPending}
                        />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="sticky bottom-0 border-t border-border bg-white px-6 py-3.5">
                <div className="mx-auto flex max-w-2xl justify-end">
                    <Button
                        size="lg"
                        disabled={!selectedOptionId || isPending}
                        onClick={handleNext}
                        className="min-w-[150px] rounded-full font-semibold"
                    >
                        {isPending ? (
                            <Loader2 className="animate-spin" />
                        ) : isLastQuestion ? (
                            'Finalizar'
                        ) : (
                            <>
                                Siguiente
                                <svg
                                    aria-hidden="true"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </>
                        )}
                    </Button>
                </div>
            </footer>
        </div>
    );
}
