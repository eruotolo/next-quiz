'use client';

import { useState, useTransition } from 'react';
import { gradeLmsSubmission } from '@/features/lms/actions/assignments';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
    ClipboardList,
    ExternalLink,
    CheckCircle2,
    Loader2,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';

type SubmissionStatus = 'PENDIENTE' | 'ENTREGADO' | 'ATRASADO' | 'CALIFICADO';

interface Submission {
    id: string;
    studentId: string;
    studentName: string;
    studentRut: string | null;
    fileUrl: string | null;
    textContent: string | null;
    status: string;
    score: number | null;
    feedback: string | null;
    submittedAt: Date | null;
    gradedAt: Date | null;
}

interface Props {
    slug: string;
    assignmentId: string | null;
    maxScore: number;
    submissions: Submission[];
}

const STATUS_LABEL: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    ENTREGADO: 'Entregado',
    ATRASADO: 'Atrasado',
    CALIFICADO: 'Calificado',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PENDIENTE: 'outline',
    ENTREGADO: 'secondary',
    ATRASADO: 'destructive',
    CALIFICADO: 'default',
};

const FILTER_OPTIONS: { label: string; value: SubmissionStatus | 'TODAS' }[] = [
    { label: 'Todas', value: 'TODAS' },
    { label: 'Por calificar', value: 'ENTREGADO' },
    { label: 'Atrasadas', value: 'ATRASADO' },
    { label: 'Calificadas', value: 'CALIFICADO' },
    { label: 'Pendientes', value: 'PENDIENTE' },
];

function SubmissionRow({
    sub,
    slug,
    assignmentId,
}: {
    sub: Submission;
    slug: string;
    assignmentId: string | null;
}) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [score, setScore] = useState(sub.score?.toFixed(1) ?? '');
    const [feedback, setFeedback] = useState(sub.feedback ?? '');
    const [isPending, startTransition] = useTransition();

    const canGrade =
        assignmentId &&
        (sub.status === 'ENTREGADO' || sub.status === 'ATRASADO' || sub.status === 'CALIFICADO');

    const handleGrade = () => {
        const parsed = Number.parseFloat(score);
        if (Number.isNaN(parsed) || parsed < 1 || parsed > 7) {
            toast.error('La nota debe estar entre 1.0 y 7.0');
            return;
        }
        startTransition(async () => {
            const result = await gradeLmsSubmission(slug, {
                submissionId: sub.id,
                score: parsed,
                feedback: feedback.trim() || null,
            });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Entrega calificada');
            router.refresh();
        });
    };

    return (
        <div className="border-border border-b last:border-0">
            <button
                type="button"
                className="hover:bg-paper flex w-full cursor-pointer items-center gap-4 px-6 py-4 text-left transition-colors"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="min-w-0 flex-1">
                    <p className="text-ink text-sm font-semibold">{sub.studentName}</p>
                    {sub.studentRut && (
                        <p className="text-mute font-mono text-xs">{sub.studentRut}</p>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {sub.submittedAt && (
                        <span className="text-mute text-xs">
                            {new Date(sub.submittedAt).toLocaleDateString('es-CL')}
                        </span>
                    )}
                    <Badge variant={STATUS_VARIANT[sub.status] ?? 'outline'}>
                        {STATUS_LABEL[sub.status] ?? sub.status}
                    </Badge>
                    {sub.score !== null && (
                        <span className="text-primary font-mono text-sm font-bold">
                            {sub.score.toFixed(1)}
                        </span>
                    )}
                    {expanded ? (
                        <ChevronUp size={16} className="text-mute" />
                    ) : (
                        <ChevronDown size={16} className="text-mute" />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="border-border bg-paper border-t px-6 pb-5 pt-4">
                    {/* Student content */}
                    {sub.textContent && (
                        <div className="mb-4">
                            <p className="text-mute mb-1 text-xs font-bold uppercase tracking-wider">
                                Respuesta escrita
                            </p>
                            <p className="text-ink bg-white border-border rounded-[10px] border p-3 text-sm leading-relaxed whitespace-pre-wrap">
                                {sub.textContent}
                            </p>
                        </div>
                    )}

                    {sub.fileUrl && (
                        <div className="mb-4">
                            <p className="text-mute mb-1 text-xs font-bold uppercase tracking-wider">
                                Archivo adjunto
                            </p>
                            <a
                                href={sub.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink size={13} /> Ver archivo
                            </a>
                        </div>
                    )}

                    {!sub.textContent && !sub.fileUrl && sub.status === 'PENDIENTE' && (
                        <p className="text-mute mb-4 text-sm">Sin entrega aún.</p>
                    )}

                    {/* Grade form */}
                    {canGrade && (
                        <div className="border-border mt-2 border-t pt-4">
                            <p className="text-mute mb-3 text-xs font-bold uppercase tracking-wider">
                                Calificación (1.0 – 7.0)
                            </p>
                            <div className="flex items-start gap-3">
                                <Input
                                    type="number"
                                    min={1}
                                    max={7}
                                    step={0.5}
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                    className="h-10 w-24 rounded-[10px] text-center font-mono font-bold"
                                    placeholder="4.0"
                                    disabled={isPending}
                                />
                                <div className="min-w-0 flex-1">
                                    <Textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Retroalimentación para el estudiante (opcional)…"
                                        rows={2}
                                        disabled={isPending}
                                    />
                                </div>
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleGrade();
                                    }}
                                    disabled={isPending || !score}
                                >
                                    {isPending ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={14} />
                                    )}
                                    <span className="ml-1">Guardar</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function LmsSubmissionsClient({ slug, assignmentId, submissions }: Props) {
    const [filter, setFilter] = useState<SubmissionStatus | 'TODAS'>('TODAS');

    const filtered =
        filter === 'TODAS'
            ? submissions
            : submissions.filter((s) => s.status === filter);

    const counts: Record<string, number> = {};
    for (const s of submissions) {
        counts[s.status] = (counts[s.status] ?? 0) + 1;
    }

    if (!assignmentId) {
        return (
            <Card className="border-border flex flex-col items-center justify-center border-dashed py-24">
                <ClipboardList size={40} className="text-mute/30 mb-4" />
                <p className="text-ink text-lg font-medium">Tarea sin configurar</p>
                <p className="text-mute mt-1 text-sm">
                    Esta lección no tiene asignación. Configúrala desde el editor de curso.
                </p>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFilter(opt.value)}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                            filter === opt.value
                                ? 'bg-primary text-white'
                                : 'bg-paper text-mute hover:text-ink',
                        )}
                    >
                        {opt.label}
                        {opt.value !== 'TODAS' && counts[opt.value] !== undefined && (
                            <span className="ml-1.5 opacity-70">({counts[opt.value]})</span>
                        )}
                        {opt.value === 'TODAS' && (
                            <span className="ml-1.5 opacity-70">({submissions.length})</span>
                        )}
                    </button>
                ))}
            </div>

            <Card className="border-border overflow-hidden bg-white shadow-sm">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <ClipboardList size={36} className="text-mute/30 mb-3" />
                        <p className="text-mute text-sm">No hay entregas en esta categoría.</p>
                    </div>
                ) : (
                    filtered.map((sub) => (
                        <SubmissionRow
                            key={sub.id}
                            sub={sub}
                            slug={slug}
                            assignmentId={assignmentId}
                        />
                    ))
                )}
            </Card>
        </div>
    );
}
