import { Button } from '@/shared/components/ui/button';
import { calcGrade } from '@/shared/lib/grade';
import { cn } from '@/shared/lib/utils';
import { prisma } from '@/shared/lib/prisma';
import { getResultSession } from '@/features/exam-session/lib/session';
import { auth } from '@/features/auth/auth';
import { USER_ROLE } from '@/shared/lib/roles';
import { StudentTopBar } from '@/features/exam-session/components/StudentTopBar';
import { StatTile } from '@/shared/components/ui/stat-tile';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/features/results/components/PrintButton';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

interface PageProps {
    params: Promise<{ resultId: string }>;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: chequeo de acceso por rol (owner, SuperAdmin, Admin, Profesor) en un solo lugar
export default async function ResultadoPage({ params }: PageProps) {
    const { resultId } = await params;

    const result = await prisma.result.findUnique({
        where: { id: resultId },
        include: {
            student: {
                select: {
                    name: true,
                    lastname: true,
                    academicInstitutionId: true,
                    groupId: true,
                    group: { select: { name: true } },
                    academicInstitution: { select: { name: true } },
                },
            },
            exam: {
                select: {
                    title: true,
                    maxGrade: true,
                    passingGrade: true,
                    passingPercentage: true,
                    questions: {
                        orderBy: { order: 'asc' },
                        include: {
                            options: {
                                select: { id: true, text: true, isCorrect: true },
                                orderBy: { createdAt: 'asc' },
                            },
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

    // Acceso del panel por rol: SuperAdmin todo; Admin su institución;
    // Profesor solo estudiantes de sus grupos.
    let panelAccess = false;
    if (adminSession?.user) {
        const role = adminSession.user.userRoleName;
        if (role === USER_ROLE.SUPER_ADMIN) {
            panelAccess = true;
        } else if (
            adminSession.user.academicInstitutionId !== null &&
            adminSession.user.academicInstitutionId === result.student.academicInstitutionId
        ) {
            if (role === USER_ROLE.ADMIN) {
                panelAccess = true;
            } else if (role === USER_ROLE.PROFESOR && result.student.groupId) {
                const ownGroup = await prisma.group.findFirst({
                    where: {
                        id: result.student.groupId,
                        professors: { some: { id: adminSession.user.id } },
                    },
                    select: { id: true },
                });
                panelAccess = !!ownGroup;
            }
        }
    }

    if (!isOwner && !panelAccess) notFound();

    const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

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

    const totalQuestions = result.exam.questions.length;

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

    const answeredCount = result.exam.questions.filter(
        (q) => getSelectedIds(answerMap[q.id]).length > 0,
    ).length;
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    const fullName = `${result.student.name} ${result.student.lastname}`;
    const groupName = result.student.group?.name ?? null;
    const institutionName = result.student.academicInstitution?.name ?? null;
    const topbarLabel = [institutionName, result.exam.title, 'entregado']
        .filter(Boolean)
        .join(' · ');

    return (
        <div className="bg-paper flex min-h-screen flex-col print:bg-white">
            <StudentTopBar
                topbarLabel={topbarLabel}
                fullName={fullName}
                groupName={groupName}
                showLogout={false}
                className="print:pb-2"
            />

            <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-16">
                {/* Hero card — ink bg */}
                <div
                    className="mb-8 overflow-hidden rounded-[18px] [background:var(--result-hero-bg)] print:hidden"
                    style={
                        {
                            '--result-hero-bg':
                                'radial-gradient(ellipse at 85% 40%, rgba(214,255,31,0.22) 0%, transparent 55%), radial-gradient(ellipse at 15% 50%, rgba(31,46,255,0.35) 0%, transparent 60%), #0b0b11',
                        } as React.CSSProperties
                    }
                >
                    <div className="grid gap-6 p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
                        {/* Left */}
                        <div className="flex flex-col justify-center gap-4">
                            <span className="bg-lime/20 text-lime w-fit rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.1em] uppercase">
                                Resultado final
                            </span>
                            <h1 className="font-display text-[34px] leading-tight font-semibold tracking-[-0.025em] text-white">
                                {passing
                                    ? `¡Buen trabajo, ${result.student.name}!`
                                    : `Examen completado, ${result.student.name}`}
                            </h1>
                            <p className="max-w-md text-[14px] text-white/50">
                                {passing
                                    ? 'Aprobaste con margen. Te dejamos abajo el detalle para que repases las que fallaste.'
                                    : 'Revisa abajo el detalle de cada pregunta y la opción correcta para reforzar.'}
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <PrintButton
                                    label="Descargar certificado"
                                    variant="lime"
                                    className="rounded-full"
                                />
                                <Button
                                    variant="ghost-dark"
                                    size="lg"
                                    className="rounded-full"
                                    asChild
                                >
                                    <Link href="/examen/seleccion">Volver al inicio</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Right — grade */}
                        <div className="flex flex-col items-start justify-center lg:items-end">
                            <span className="font-mono text-[10px] tracking-[0.12em] text-white/40 uppercase">
                                Nota
                            </span>
                            <div
                                className={cn(
                                    'font-display text-[110px] leading-none font-semibold tracking-[-0.04em]',
                                    passing ? 'text-lime' : 'text-coral',
                                )}
                            >
                                {grade.toFixed(1)}
                            </div>
                            <p className="font-mono text-[12px] text-white/40">
                                {correctCount}/{totalQuestions} correctas · {accuracy}% precisión
                            </p>
                        </div>
                    </div>
                </div>

                {/* Print-only header */}
                <div className="mb-6 hidden print:block">
                    <h1 className="text-ink text-[20px] font-bold">{result.exam.title}</h1>
                    <p className="text-ink-dim text-[14px]">
                        {fullName} · Nota {grade.toFixed(1)} · {correctCount}/{totalQuestions}{' '}
                        correctas
                    </p>
                </div>

                {/* Stat tiles */}
                <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 print:hidden">
                    <StatTile
                        label="Correctas"
                        value={`${correctCount}/${totalQuestions}`}
                        sub={`${percentage}% del examen`}
                    />
                    <StatTile
                        label="Puntaje"
                        value={`${result.score}/${result.maxScore}`}
                        sub="puntos obtenidos"
                    />
                    <StatTile label="Precisión" value={`${accuracy}%`} sub="de las respondidas" />
                    <StatTile
                        label="Nota mínima"
                        value={result.exam.passingGrade.toFixed(1)}
                        sub={passing ? 'Aprobaste' : 'No alcanzada'}
                        tone={passing ? 'lime' : 'default'}
                    />
                </div>

                {/* Question review */}
                <div className="border-border rounded-[14px] border bg-white p-5 lg:p-6 print:border-0 print:p-0">
                    <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-ink text-[15px] font-semibold">
                                Detalle por pregunta
                            </h2>
                            <p className="text-mute text-[12px]">
                                Las preguntas con error tienen el detalle de la opción correcta.
                            </p>
                        </div>
                        <PrintButton label="Exportar" variant="ghost" size="sm" />
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">N°</TableHead>
                                <TableHead>Pregunta</TableHead>
                                <TableHead className="w-32">Tu respuesta</TableHead>
                                <TableHead className="w-28">Correcta</TableHead>
                                <TableHead className="w-20 text-right">Puntos</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {result.exam.questions.map((q, idx) => {
                                const selectedIds = getSelectedIds(answerMap[q.id]);
                                const selectedSet = new Set(selectedIds);
                                const correctSet = new Set(
                                    q.options.filter((o) => o.isCorrect).map((o) => o.id),
                                );
                                const isCorrect =
                                    selectedSet.size > 0 &&
                                    correctSet.size === selectedSet.size &&
                                    [...correctSet].every((id) => selectedSet.has(id));

                                const selectedLetters = q.options
                                    .map((o, i) => (selectedSet.has(o.id) ? LABELS[i] : null))
                                    .filter((l): l is (typeof LABELS)[number] => Boolean(l));
                                const correctLetters = q.options
                                    .map((o, i) => (o.isCorrect ? LABELS[i] : null))
                                    .filter((l): l is (typeof LABELS)[number] => Boolean(l));

                                return (
                                    <TableRow
                                        key={q.id}
                                        className={cn(!isCorrect && 'bg-danger-wash/30')}
                                    >
                                        <TableCell className="text-mute font-mono text-[12px]">
                                            {idx + 1}
                                        </TableCell>
                                        <TableCell className="text-ink text-[13px] leading-relaxed">
                                            {q.text}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedLetters.length > 0 ? (
                                                    selectedLetters.map((l) => (
                                                        <span
                                                            key={l}
                                                            className={cn(
                                                                'inline-flex size-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold',
                                                                isCorrect
                                                                    ? 'bg-success-wash text-success'
                                                                    : 'bg-danger-wash text-destructive',
                                                            )}
                                                        >
                                                            {l}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-mute text-[12px]">—</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {correctLetters.map((l) => (
                                                    <span
                                                        key={l}
                                                        className="bg-paper-warm text-ink inline-flex size-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold"
                                                    >
                                                        {l}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                'text-right font-mono text-[13px] font-semibold',
                                                isCorrect ? 'text-success' : 'text-destructive',
                                            )}
                                        >
                                            {isCorrect ? q.points : 0}/{q.points}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-center gap-3 print:hidden">
                    <PrintButton />
                    <Button asChild variant="ink" size="lg" className="rounded-full">
                        <Link href="/examen/seleccion">Volver al inicio</Link>
                    </Button>
                </div>
            </main>
        </div>
    );
}
