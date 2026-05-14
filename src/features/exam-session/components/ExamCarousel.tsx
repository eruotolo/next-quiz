'use client';

import { autoSubmit, finishExam, submitAnswer } from '@/features/exam-session/actions/mutations';
import type { SafeExam } from '@/features/exam-session/types/exam.types';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
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
    const lastStrikeAtRef = useRef(0);
    const [strikes, setStrikes] = useState(0);
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

    useEffect(() => {
        if (!exam.antiCheatEnabled) return;

        const STORAGE_KEY = `exam:${exam.id}:strikes`;
        const saved = Number(sessionStorage.getItem(STORAGE_KEY) ?? '0');
        if (saved > 0 && saved <= 3) setStrikes(saved);

        const mountedAt = Date.now();
        const DEBOUNCE_MS = 800;
        const INITIAL_GRACE_MS = 500;

        const registerStrike = (): void => {
            if (submittedRef.current) return;
            if (Date.now() - mountedAt < INITIAL_GRACE_MS) return;
            if (Date.now() - lastStrikeAtRef.current < DEBOUNCE_MS) return;
            lastStrikeAtRef.current = Date.now();

            setStrikes((prev) => {
                const next = prev + 1;
                sessionStorage.setItem(STORAGE_KEY, String(next));
                if (next === 1) {
                    toast.warning('1/3 — Volvé al examen ya', {
                        description: 'Si salís 3 veces el examen se envía automáticamente.',
                    });
                } else if (next === 2) {
                    toast.warning('2/3 — Último aviso', {
                        description: 'El próximo strike envía el examen.',
                    });
                } else if (next >= 3) {
                    toast.error('Excediste los intentos permitidos. Examen enviado.');
                    void finalizeAndRedirect('auto');
                }
                return next;
            });
        };

        const onVisibility = (): void => {
            if (document.hidden) registerStrike();
        };
        const onBlur = (): void => registerStrike();

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('blur', onBlur);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('blur', onBlur);
        };
    }, [exam.antiCheatEnabled, exam.id, finalizeAndRedirect]);

    if (!currentQuestion) {
        return (
            <div className="bg-muted/30 flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Este examen no tiene preguntas disponibles.</p>
            </div>
        );
    }

    const variants = {
        enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
    };

    return (
        <div className="bg-muted/30 flex min-h-screen flex-col">
            {/* Header */}
            <header className="border-border sticky top-0 z-10 border-b bg-white/95 px-6 py-3.5 backdrop-blur-sm">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-foreground truncate text-[15px] font-bold">
                            {exam.title}
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-[13px]">
                            {currentIndex + 1} / {totalQuestions} preguntas
                        </p>
                        {exam.antiCheatEnabled && strikes > 0 && (
                            <span
                                className={cn(
                                    'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                    strikes === 1 && 'bg-amber-100 text-amber-700',
                                    strikes === 2 && 'bg-orange-100 text-orange-700',
                                    strikes >= 3 && 'bg-destructive/10 text-destructive',
                                )}
                            >
                                Strikes {strikes}/3
                            </span>
                        )}
                    </div>
                    <Timer initialSeconds={initialSeconds} onTimeout={handleTimeout} />
                </div>

                {/* Progress bar */}
                <div className="mx-auto mt-2.5 max-w-2xl">
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
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
            <footer className="border-border sticky bottom-0 border-t bg-white px-6 py-3.5">
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
