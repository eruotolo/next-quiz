import { prisma } from '@/shared/lib/prisma';
import { getStudentSession } from '@/features/exam-session/lib/session';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import { Button } from '@/shared/components/ui/button';
import { Clock, Shield, Wifi, BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ examId: string }>;
}

export default async function ExamIntroPage({ params }: PageProps): Promise<React.JSX.Element> {
    const { examId } = await params;
    const session = await getStudentSession();

    if (!session || session.examId !== examId) redirect('/examen/login');

    const exam = await prisma.exam.findUnique({
        where: { id: examId, active: true },
        select: {
            id: true,
            title: true,
            timeLimit: true,
            antiCheatEnabled: true,
            passingGrade: true,
            questions: { select: { id: true, points: true } },
            groups: { select: { name: true }, take: 1 },
        },
    });

    if (!exam) redirect('/examen/login');

    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: { name: true, lastname: true },
    });

    const instructions = [
        {
            icon: Clock,
            text: `Tenés ${exam.timeLimit} minutos. El cronómetro comienza cuando iniciás.`,
        },
        {
            icon: BookOpen,
            text: `${exam.questions.length} preguntas · ${totalPoints} puntos en total. Podés navegar libremente.`,
        },
        {
            icon: Shield,
            text: exam.antiCheatEnabled
                ? 'Anti-copia activo. Si salís de esta pestaña 3 veces, el examen se envía automáticamente.'
                : 'Respondé con honestidad. Tus respuestas se guardan automáticamente.',
        },
        {
            icon: Wifi,
            text: 'Si perdés conexión, al reconectarte el examen continúa desde donde quedaste.',
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-paper">
            {/* Top bar */}
            <header className="flex items-center gap-3 border-b border-border bg-white px-6 py-3.5">
                <LogoMark size={26} />
                <div className="h-4 w-px bg-border" />
                <LogoWordmark size={14} color="#75716b" />
            </header>

            {/* Content */}
            <div className="flex flex-1 items-center justify-center p-6 py-12">
                <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* Left — main card */}
                    <div className="rounded-[18px] border border-border bg-white p-8 lg:p-10">
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">
                            {exam.groups[0]?.name ?? 'Examen'}
                        </span>
                        <h1 className="mt-2 font-display text-[40px] font-semibold leading-tight tracking-[-0.03em] text-ink lg:text-[48px]">
                            {exam.title}
                        </h1>

                        <div className="mt-8 space-y-4">
                            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mute">
                                Instrucciones
                            </p>
                            {instructions.map((item) => (
                                <div key={item.text} className="flex items-start gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-paper-warm">
                                        <item.icon size={14} className="text-ink-dim" />
                                    </div>
                                    <p className="text-[14px] leading-relaxed text-ink-dim">{item.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 border-t border-border pt-6">
                            <p className="mb-4 text-[13px] text-mute">
                                Al comenzar confirmás que leíste las instrucciones y que realizarás el
                                examen de forma individual.
                            </p>
                            <Button variant="ink" size="lg" asChild>
                                <Link href={`/examen/${examId}`}>
                                    Comenzar examen
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right — info sidebar */}
                    <div className="flex flex-col gap-4">
                        {/* Exam data card */}
                        <div className="rounded-[14px] border border-border bg-white p-5">
                            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.08em] text-mute">
                                Datos del examen
                            </p>
                            <div className="space-y-3">
                                {[
                                    { label: 'Preguntas', value: String(exam.questions.length) },
                                    { label: 'Duración', value: `${exam.timeLimit} min` },
                                    { label: 'Puntaje total', value: String(totalPoints) },
                                    { label: 'Nota de aprobación', value: exam.passingGrade.toFixed(1) },
                                ].map((row) => (
                                    <div
                                        key={row.label}
                                        className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                                    >
                                        <span className="text-[13px] text-ink-dim">{row.label}</span>
                                        <span className="font-mono text-[13px] font-semibold text-ink">
                                            {row.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Student reminder — ink card */}
                        {student && (
                            <div
                                className="rounded-[14px] p-5"
                                style={{
                                    background: [
                                        'radial-gradient(ellipse at 80% 20%, rgba(214,255,31,0.18) 0%, transparent 60%)',
                                        '#0b0b11',
                                    ].join(', '),
                                }}
                            >
                                <span className="mb-3 inline-block rounded-full bg-lime/20 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-lime">
                                    {student.name.toUpperCase()}, NO OLVIDES
                                </span>
                                <p className="text-[13px] leading-relaxed text-white/60">
                                    Tus respuestas se guardan automáticamente. Si la conexión falla,
                                    abrí la misma URL y continuá desde donde estabas.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
