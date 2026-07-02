'use client';

import { useState, useTransition } from 'react';
import {
    CheckCircle2,
    ArrowLeft,
    FileText,
    Link2,
    ClipboardList,
    PlayCircle,
    Sparkles,
    Lock,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { VideoEmbed } from '@/features/lms/components/VideoEmbed';
import { LiveSessionLinkCard } from '@/features/lms/components/LiveSessionLinkCard';
import { renderLessonHtml } from '@/features/lms/components/TiptapEditor';
import { markLessonProgress } from '@/features/lms/actions/progress';
import { LmsTaskSubmissionForm } from '@/features/lms/components/LmsTaskSubmissionForm';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { LessonType } from '@prisma/client';

interface Assignment {
    id: string;
    instructions: string | null;
    dueAt: Date | null;
    maxScore: number;
}

interface Submission {
    id: string;
    textContent: string | null;
    fileUrl: string | null;
    status: string;
    score: number | null;
    feedback: string | null;
    submittedAt: Date | null;
}

interface Props {
    institutionSlug: string | null;
    courseId: string;
    lesson: {
        id: string;
        title: string;
        type: LessonType;
        contentJson: unknown | null;
        summaryJson: unknown | null;
        fileUrl: string | null;
        externalLink: string | null;
        examId: string | null;
    };
    completed: boolean;
    examCompleted?: boolean;
    nextLessonId: string | null;
    prevLessonId: string | null;
    assignment?: Assignment | null;
    mySubmission?: Submission | null;
}

function DocumentPreview({ fileUrl, title }: { fileUrl: string; title: string }) {
    const isPdf = /\.pdf(\?|$)/i.test(fileUrl);
    if (isPdf) {
        return (
            <div className="border-border overflow-hidden rounded-[12px] border bg-white shadow-sm">
                <iframe src={`${fileUrl}#toolbar=0`} title={title} className="h-[70vh] w-full" />
            </div>
        );
    }
    return (
        <Card className="border-border flex flex-col items-center gap-3 bg-white p-8 text-center">
            <FileText size={28} className="text-primary" />
            <p className="text-ink font-display text-lg font-bold">{title}</p>
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground rounded-[10px] px-5 py-2.5 text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
            >
                Abrir documento
            </a>
        </Card>
    );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: switch de 7 tipos de lección, dividirlo perjudica la lectura
export function LmsLessonViewer({
    institutionSlug,
    courseId,
    lesson,
    completed: initialCompleted,
    examCompleted = false,
    nextLessonId,
    prevLessonId,
    assignment = null,
    mySubmission = null,
}: Props) {
    const router = useRouter();
    const [completed, setCompleted] = useState(initialCompleted);
    const [isPending, startTransition] = useTransition();

    const handleComplete = (value: boolean) => {
        setCompleted(value);
        startTransition(async () => {
            const result = await markLessonProgress(institutionSlug, courseId, {
                lessonId: lesson.id,
                completed: value,
            });
            if (result.error) {
                toast.error(result.error);
                setCompleted(!value);
                return;
            }
            toast.success(value ? 'Lección completada' : 'Lección marcada como pendiente');
            router.refresh();
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href={`/students/aula/cursos/${courseId}`}>
                        <ArrowLeft size={14} className="mr-1" /> Volver al curso
                    </Link>
                </Button>
            </div>

            <Card className="border-border overflow-hidden bg-white shadow-sm">
                <div className="border-border flex items-start justify-between gap-4 border-b p-6">
                    <div className="flex-1">
                        <p className="text-mute font-mono text-[10px] tracking-[0.1em] uppercase">
                            {lessonTypeLabel(lesson.type)}
                        </p>
                        <h1 className="text-ink font-display mt-1 text-2xl font-bold">
                            {lesson.title}
                        </h1>
                    </div>
                    {lesson.type === 'EXAMEN' && !completed && !examCompleted ? (
                        <Button variant="ghost" size="md" disabled>
                            <Lock size={16} className="mr-1" />
                            Rendí el examen primero
                        </Button>
                    ) : (
                        <Button
                            variant={completed ? 'ghost' : 'primary'}
                            size="md"
                            onClick={() => handleComplete(!completed)}
                            disabled={isPending}
                        >
                            <CheckCircle2 size={16} className="mr-1" />
                            {completed ? 'Completada' : 'Marcar como vista'}
                        </Button>
                    )}
                </div>

                <div className="p-6">
                    {lesson.type === 'VIDEO' && <VideoEmbed externalLink={lesson.externalLink} />}

                    {lesson.type === 'DOCUMENTO' && lesson.fileUrl && (
                        <DocumentPreview fileUrl={lesson.fileUrl} title={lesson.title} />
                    )}

                    {lesson.type === 'TEXTO' && (
                        <>
                            <RichTextContent contentJson={lesson.contentJson} />
                            {lesson.summaryJson && (
                                <LessonAiSummary summaryJson={lesson.summaryJson} />
                            )}
                        </>
                    )}

                    {lesson.type === 'ENLACE' && lesson.externalLink && (
                        <Card className="border-border flex flex-col items-center gap-3 bg-white p-8 text-center">
                            <Link2 size={28} className="text-primary" />
                            <p className="text-ink font-display text-lg font-bold">
                                Recurso externo
                            </p>
                            <a
                                href={lesson.externalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-primary text-primary-foreground rounded-[10px] px-5 py-2.5 text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
                            >
                                Abrir enlace
                            </a>
                        </Card>
                    )}

                    {lesson.type === 'EXAMEN' && (
                        <Card className="border-border flex flex-col items-center gap-3 bg-white p-8 text-center">
                            <ClipboardList size={28} className="text-primary" />
                            <p className="text-ink font-display text-lg font-bold">
                                Examen Aulika embebido
                            </p>
                            <p className="text-mute text-sm">
                                Esta lección rinde un examen del motor de Aulika.
                            </p>
                            {lesson.examId && (
                                <Button asChild variant="primary" size="md">
                                    <Link href={`/students/examen/seleccion?lmsLessonId=${lesson.id}`}>
                                        Ir al examen
                                    </Link>
                                </Button>
                            )}
                        </Card>
                    )}

                    {lesson.type === 'TAREA' && assignment && (
                        <LmsTaskSubmissionForm
                            assignmentId={assignment.id}
                            courseId={courseId}
                            instructions={assignment.instructions}
                            dueAt={assignment.dueAt}
                            maxScore={assignment.maxScore}
                            existingSubmission={mySubmission}
                        />
                    )}

                    {lesson.type === 'TAREA' && !assignment && (
                        <Card className="border-border flex flex-col items-center gap-3 bg-white p-8 text-center">
                            <FileText size={28} className="text-primary" />
                            <p className="text-ink font-display text-lg font-bold">
                                Tarea no configurada
                            </p>
                            <p className="text-mute text-sm">
                                El docente aún no ha configurado esta tarea.
                            </p>
                        </Card>
                    )}

                    {lesson.type === 'EN_VIVO' && (
                        <LiveSessionLinkCard externalLink={lesson.externalLink} />
                    )}
                </div>
            </Card>

            <div className="flex items-center justify-between">
                {prevLessonId ? (
                    <Button asChild variant="ghost" size="sm">
                        <Link href={`/students/aula/cursos/${courseId}/leccion/${prevLessonId}`}>
                            <ArrowLeft size={14} className="mr-1" /> Lección anterior
                        </Link>
                    </Button>
                ) : (
                    <span />
                )}
                {nextLessonId ? (
                    <Button asChild variant="primary" size="sm">
                        <Link href={`/students/aula/cursos/${courseId}/leccion/${nextLessonId}`}>
                            Siguiente lección <PlayCircle size={14} className="ml-1" />
                        </Link>
                    </Button>
                ) : (
                    <span />
                )}
            </div>
        </div>
    );
}

function RichTextContent({ contentJson }: { contentJson: unknown | null }) {
    if (!contentJson) {
        return (
            <p className="text-mute py-12 text-center text-sm">
                Esta lección no tiene contenido de texto todavía.
            </p>
        );
    }
    const html = renderLessonHtml(contentJson);
    if (!html) {
        return (
            <p className="text-mute py-12 text-center text-sm">
                Esta lección no tiene contenido de texto todavía.
            </p>
        );
    }
    // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML generado por el schema cerrado de Tiptap (sin scripts ni nodos crudos)
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}

interface LessonSummaryData {
    summary: string;
    keyPoints: string[];
}

function parseSummaryJson(raw: unknown): LessonSummaryData | null {
    if (!raw || typeof raw !== 'object') return null;
    const data = raw as Record<string, unknown>;
    if (typeof data.summary !== 'string') return null;
    const keyPoints = Array.isArray(data.keyPoints)
        ? data.keyPoints.filter((k): k is string => typeof k === 'string')
        : [];
    return { summary: data.summary, keyPoints };
}

function LessonAiSummary({ summaryJson }: { summaryJson: unknown }) {
    const data = parseSummaryJson(summaryJson);
    if (!data) return null;

    return (
        <div className="mt-8 rounded-[12px] border border-violet-200 bg-violet-50 p-5">
            <div className="mb-3 flex items-center gap-2">
                <Sparkles size={15} className="text-violet-600" />
                <p className="text-sm font-semibold text-violet-800">Resumen generado por IA</p>
            </div>
            <p className="text-sm leading-relaxed text-violet-900">{data.summary}</p>
            {data.keyPoints.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                    {data.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-violet-800">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                            {point}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function lessonTypeLabel(t: LessonType): string {
    switch (t) {
        case 'VIDEO':
            return 'Video';
        case 'DOCUMENTO':
            return 'Documento';
        case 'TEXTO':
            return 'Lectura';
        case 'ENLACE':
            return 'Enlace externo';
        case 'EXAMEN':
            return 'Examen Aulika';
        case 'TAREA':
            return 'Tarea';
        case 'EN_VIVO':
            return 'Clase en vivo';
    }
}
