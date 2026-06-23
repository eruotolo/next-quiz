import { prisma } from '@/shared/lib/prisma';
import { getStudentSession } from '@/features/exam-session/lib/session';
import { ExamIntroStart } from '@/features/exam-session/components/ExamIntroStart';
import { LogoMark, LogoWordmark } from '@/shared/components/branding/logo';
import { Avatar } from '@/shared/components/ui/avatar';
import { Check } from 'lucide-react';
import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ examId: string }>;
}

const closesFormatter = new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});
const closesDateFormatter = new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
});

function startOfDay(d: Date): number {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
}

function closesLabel(date: Date, now: Date): string {
    const diff = Math.round((startOfDay(date) - startOfDay(now)) / (24 * 60 * 60 * 1000));
    const time = closesFormatter.format(date);
    if (diff === 0) return `Hoy ${time}`;
    if (diff === 1) return `Mañana ${time}`;
    return `${closesDateFormatter.format(date)} ${time}`;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: arma los datos del examen (vigilancia, tipo, cierre, nota) e instrucciones en una sola vista; separarlo dispersaría la presentación
export default async function ExamIntroPage({ params }: PageProps): Promise<React.JSX.Element> {
    const { examId } = await params;
    const session = await getStudentSession();

    if (!session || session.examId !== examId) redirect('/examen/login');

    const exam = await prisma.exam.findUnique({
        where: { id: examId, active: true },
        select: {
            id: true,
            title: true,
            subject: true,
            unit: true,
            timeLimit: true,
            antiCheatEnabled: true,
            lockTabSwitch: true,
            passingGrade: true,
            passingPercentage: true,
            closesAt: true,
            questions: { select: { questionType: true } },
            createdBy: { select: { name: true, lastname: true } },
            groups: { select: { name: true }, take: 1 },
        },
    });

    if (!exam) redirect('/examen/login');

    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: {
            name: true,
            lastname: true,
            academicInstitution: { select: { name: true } },
        },
    });
    if (!student) redirect('/examen/login');

    const now = new Date();
    const fullName = `${student.name} ${student.lastname}`;
    const groupName = exam.groups[0]?.name ?? null;
    // El nombre del grupo puede traer la institución pegada ("Grupo A — Institución");
    // mostramos solo la parte del grupo y la institución por separado.
    const groupShort = groupName ? (groupName.split('—')[0]?.trim() ?? groupName) : null;
    const subjectUnit = [exam.subject, exam.unit].filter(Boolean).join(' · ');
    const institutionName = student.academicInstitution?.name ?? null;
    const topbarLabel = [institutionName, groupShort, exam.title].filter(Boolean).join(' · ');
    const teacher = exam.createdBy ? `${exam.createdBy.name} ${exam.createdBy.lastname}` : null;
    const hasMultiple = exam.questions.some((q) => q.questionType === 'MULTIPLE');
    const questionTypeLabel = hasMultiple ? 'selección múltiple' : 'selección única';
    const surveillanceLabel = !exam.antiCheatEnabled
        ? 'Libre'
        : exam.lockTabSwitch
          ? 'Restricción total'
          : 'Anti-trampa (3 salidas)';

    const tabInstruction = !exam.antiCheatEnabled
        ? {
              title: 'Responde con tranquilidad',
              text: 'Tus respuestas se guardan automáticamente a medida que avanzas.',
          }
        : exam.lockTabSwitch
          ? {
                title: 'No salgas de la pestaña: una salida cierra el examen',
                text: 'Si cambias de pestaña o de aplicación, aunque sea una vez, el examen se entrega automáticamente al instante con lo que hayas respondido.',
            }
          : {
                title: 'No salgas de la pestaña: 3 salidas cierran el examen',
                text: 'Aulika detecta cada vez que dejas la pestaña. Las dos primeras veces te avisamos; en la tercera, el examen se entrega automáticamente con lo que hayas respondido hasta ese momento.',
            };

    const instructions = [
        {
            title: `Tendrás ${exam.timeLimit} minutos para ${exam.questions.length} preguntas`,
            text: 'El cronómetro empieza al hacer clic en «Comenzar».',
        },
        {
            title: 'Una pregunta a la vez',
            text: 'Puedes avanzar y retroceder. Las respuestas quedan guardadas.',
        },
        tabInstruction,
        {
            title: 'No necesitas internet perfecto',
            text: 'Si te desconectas, retomamos desde donde quedaste.',
        },
    ];

    const examData = [
        institutionName && { label: 'Institución', value: institutionName },
        teacher && { label: 'Profesor/a', value: teacher },
        groupShort && {
            label: 'Curso',
            value: [groupShort, exam.subject].filter(Boolean).join(' · '),
        },
        { label: 'Preguntas', value: `${exam.questions.length} · ${questionTypeLabel}` },
        { label: 'Duración', value: `${exam.timeLimit} minutos` },
        exam.closesAt && { label: 'Cierra', value: closesLabel(exam.closesAt, now) },
        {
            label: 'Nota base',
            value: `${exam.passingGrade.toFixed(1)} al ${exam.passingPercentage}%`,
        },
        { label: 'Vigilancia', value: surveillanceLabel },
    ].filter((row): row is { label: string; value: string } => Boolean(row));

    return (
        <div className="bg-paper flex min-h-screen flex-col">
            {/* Top bar */}
            <header className="border-border flex items-center justify-between border-b bg-white px-8 py-4">
                <div className="flex items-center gap-3">
                    <LogoMark size={28} />
                    <LogoWordmark size={16} color="#0b0b11" />
                    <div className="bg-border ml-1 h-4 w-px" />
                    <span className="text-mute max-w-[420px] truncate font-mono text-[11px] tracking-[0.08em] uppercase">
                        {topbarLabel}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Avatar name={fullName} size={36} />
                    <div className="hidden leading-tight sm:block">
                        <p className="text-ink text-[13px] font-semibold">{fullName}</p>
                        {groupShort && <p className="text-mute text-[11px]">{groupShort}</p>}
                        {institutionName && (
                            <p className="text-mute text-[11px]">{institutionName}</p>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1.4fr_0.6fr]">
                {/* Main card */}
                <div className="border-border overflow-hidden rounded-[18px] border bg-white">
                    {/* Header */}
                    <div className="p-8 lg:p-10">
                        {subjectUnit && (
                            <span className="bg-paper-warm text-ink-dim rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.1em] uppercase">
                                {subjectUnit}
                            </span>
                        )}
                        <h1 className="font-display text-ink mt-3 text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] lg:text-[46px]">
                            Examen {exam.title}
                        </h1>
                        <p className="text-ink-dim mt-4 max-w-lg text-[14px] leading-relaxed">
                            Tómate tu tiempo. Leerás una pregunta a la vez, puedes marcar las que
                            dudes y volver a ellas antes de cerrar.
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="border-border border-t px-8 py-7 lg:px-10">
                        <p className="text-mute mb-4 font-mono text-[10px] tracking-[0.1em] uppercase">
                            Antes de empezar
                        </p>
                        <div className="space-y-4">
                            {instructions.map((item) => (
                                <div key={item.title} className="flex items-start gap-3">
                                    <span className="bg-primary-wash text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                                        <Check size={13} strokeWidth={3} />
                                    </span>
                                    <div>
                                        <p className="text-ink text-[14px] font-semibold">
                                            {item.title}
                                        </p>
                                        <p className="text-mute text-[13px] leading-snug">
                                            {item.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Accept + start */}
                    <div className="border-border border-t px-8 py-6 lg:px-10">
                        <ExamIntroStart />
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="flex flex-col gap-4">
                    {/* Exam data */}
                    <div className="border-border rounded-[16px] border bg-white p-6">
                        <p className="text-ink mb-4 text-[15px] font-semibold">Datos del examen</p>
                        <div className="space-y-3">
                            {examData.map((row) => (
                                <div
                                    key={row.label}
                                    className="border-border flex items-center justify-between border-b border-dashed pb-3 last:border-0 last:pb-0"
                                >
                                    <span className="text-mute text-[13px]">{row.label}</span>
                                    <span className="text-ink text-[13px] font-semibold">
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reminder — ink card */}
                    <div
                        className="rounded-[16px] p-6"
                        style={{
                            background: [
                                'radial-gradient(ellipse at 80% 10%, rgba(214,255,31,0.16) 0%, transparent 55%)',
                                '#0b0b11',
                            ].join(', '),
                        }}
                    >
                        <span className="bg-lime/20 text-lime mb-3 inline-block rounded-full px-2.5 py-0.5 font-mono text-[9px] tracking-[0.1em] uppercase">
                            {student.name.toUpperCase()}, NO OLVIDES
                        </span>
                        <p className="text-[13px] leading-relaxed text-white/60">
                            Si tu equipo se queda sin batería o se cae internet, abrí Aulika de nuevo
                            con tu RUT y retomás donde quedaste. Las respuestas que ya guardaste se
                            quedan ahí.
                        </p>
                    </div>
                </aside>
            </main>
        </div>
    );
}
