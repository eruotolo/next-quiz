'use client';

import { autoSubmit, finishExam, submitAnswer } from '@/actions/exam-session';
import type { SafeExam } from '@/types/exam';
import { Button, addToast } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
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
                addToast({
                    title: 'Error al enviar',
                    description: 'No se pudo enviar el examen. Intentá de nuevo.',
                    color: 'danger',
                });
                console.error(err);
            }
        },
        [router],
    );

    const handleTimeout = useCallback(() => {
        addToast({
            title: '¡Tiempo agotado!',
            description: 'El examen se envió automáticamente.',
            color: 'warning',
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
                addToast({
                    title: 'Error al guardar',
                    description: 'No se pudo guardar la respuesta. Reintentá.',
                    color: 'danger',
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
            addToast({
                title: 'Navegación bloqueada',
                description: 'No podés salir mientras el examen está en curso.',
                color: 'warning',
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
        <div className="bg-default-50 flex min-h-screen flex-col">
            {/* Header */}
            <header className="border-default-200 sticky top-0 z-10 border-b bg-white/90 px-6 py-4 backdrop-blur-sm">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-default-900 truncate text-base font-bold">
                            {exam.title}
                        </h1>
                        <p className="text-default-400 text-sm">
                            {currentIndex + 1} / {totalQuestions} preguntas
                        </p>
                    </div>
                    <Timer initialSeconds={initialSeconds} onTimeout={handleTimeout} />
                </div>

                {/* Progress bar */}
                <div className="mx-auto mt-3 max-w-2xl">
                    <div className="bg-default-100 h-2 overflow-hidden rounded-full">
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
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
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
            <footer className="border-default-200 sticky bottom-0 border-t bg-white px-6 py-4">
                <div className="mx-auto flex max-w-2xl justify-end">
                    <Button
                        color="primary"
                        size="lg"
                        radius="full"
                        isDisabled={!selectedOptionId || isPending}
                        isLoading={isPending}
                        onPress={handleNext}
                        className="min-w-36 font-semibold"
                        endContent={
                            !isPending && (
                                <svg
                                    aria-hidden="true"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            )
                        }
                    >
                        {isLastQuestion ? 'Finalizar' : 'Siguiente'}
                    </Button>
                </div>
            </footer>
        </div>
    );
}
