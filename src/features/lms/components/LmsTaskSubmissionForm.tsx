'use client';

import { useRef, useState, useTransition } from 'react';
import type { ChangeEvent } from 'react';
import { submitLmsAssignment } from '@/features/lms/actions/assignments';
import { uploadStudentSubmissionFile } from '@/features/lms/actions/student-uploads';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { CheckCircle2, Clock, FileText, Loader2, Paperclip, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
    assignmentId: string;
    courseId: string;
    instructions: string | null;
    dueAt: Date | null;
    maxScore: number;
    existingSubmission: Submission | null;
}

const STATUS_LABEL: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    ENTREGADO: 'Entregado',
    ATRASADO: 'Entregado con atraso',
    CALIFICADO: 'Calificado',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PENDIENTE: 'outline',
    ENTREGADO: 'secondary',
    ATRASADO: 'destructive',
    CALIFICADO: 'default',
};

function formatDueDate(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0) return `Venció el ${date.toLocaleDateString('es-CL')}`;
    const days = Math.floor(diff / 86400000);
    if (days > 0)
        return `Vence en ${days} día${days !== 1 ? 's' : ''} (${date.toLocaleDateString('es-CL')})`;
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `Vence en ${hours} hora${hours !== 1 ? 's' : ''}`;
    return 'Vence pronto';
}

function filenameFromUrl(url: string): string {
    try {
        const parts = new URL(url).pathname.split('/');
        return decodeURIComponent(parts[parts.length - 1] ?? url);
    } catch {
        return url;
    }
}

export function LmsTaskSubmissionForm({
    assignmentId,
    courseId,
    instructions,
    dueAt,
    maxScore,
    existingSubmission,
}: Props) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [text, setText] = useState(existingSubmission?.textContent ?? '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(
        existingSubmission?.fileUrl ?? null,
    );
    const [isPending, startTransition] = useTransition();

    const isGraded = existingSubmission?.status === 'CALIFICADO';
    const isLate = dueAt ? new Date() > dueAt : false;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
        if (!file) setUploadedFileUrl(existingSubmission?.fileUrl ?? null);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadedFileUrl(existingSubmission?.fileUrl ?? null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = () => {
        startTransition(async () => {
            let fileUrl = uploadedFileUrl;

            if (selectedFile) {
                const fd = new FormData();
                fd.append('file', selectedFile);
                const uploadResult = await uploadStudentSubmissionFile(fd);
                if (uploadResult.error) {
                    toast.error(uploadResult.error);
                    return;
                }
                fileUrl = uploadResult.data?.url ?? null;
                setUploadedFileUrl(fileUrl);
                setSelectedFile(null);
            }

            const result = await submitLmsAssignment({
                assignmentId,
                fileUrl,
                textContent: text.trim() || null,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success('Tarea entregada correctamente');
            router.refresh();
        });
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Assignment details */}
            <Card className="border-border bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-primary shrink-0" />
                        <span className="text-ink text-sm font-semibold">Detalle de la tarea</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {existingSubmission && (
                            <Badge variant={STATUS_VARIANT[existingSubmission.status] ?? 'outline'}>
                                {STATUS_LABEL[existingSubmission.status] ??
                                    existingSubmission.status}
                            </Badge>
                        )}
                        <span className="text-mute text-xs">Nota máx. {maxScore}</span>
                    </div>
                </div>

                {dueAt && (
                    <div className="mt-3 flex items-center gap-1.5">
                        <Clock size={14} className={isLate ? 'text-destructive' : 'text-mute'} />
                        <span
                            className={`text-xs ${isLate ? 'text-destructive font-medium' : 'text-mute'}`}
                        >
                            {formatDueDate(dueAt)}
                        </span>
                    </div>
                )}

                {instructions && (
                    <p className="text-mute border-border mt-3 border-t pt-3 text-sm leading-relaxed">
                        {instructions}
                    </p>
                )}
            </Card>

            {/* Grade panel (when graded) */}
            {isGraded && existingSubmission?.score !== null && (
                <Card className="border-border bg-white p-5">
                    <div className="flex items-center gap-2">
                        <Star size={16} className="text-primary" />
                        <span className="text-ink text-sm font-semibold">Tu calificación</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-primary font-display text-4xl font-bold">
                            {existingSubmission.score?.toFixed(1)}
                        </span>
                        <span className="text-mute text-sm">/ {maxScore}</span>
                    </div>
                    {existingSubmission.feedback && (
                        <p className="text-ink border-border mt-3 border-t pt-3 text-sm leading-relaxed">
                            {existingSubmission.feedback}
                        </p>
                    )}
                </Card>
            )}

            {/* Submission form */}
            <Card className="border-border bg-white p-5">
                <p className="text-ink mb-3 text-sm font-semibold">
                    {existingSubmission ? 'Tu entrega' : 'Entregar tarea'}
                </p>

                {/* Existing file */}
                {uploadedFileUrl && !selectedFile && (
                    <div className="border-border bg-paper mb-3 flex items-center gap-2 rounded-[10px] border px-3 py-2">
                        <Paperclip size={14} className="text-mute shrink-0" />
                        <a
                            href={uploadedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary min-w-0 flex-1 truncate text-xs hover:underline"
                        >
                            {filenameFromUrl(uploadedFileUrl)}
                        </a>
                        {!isGraded && (
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="text-mute hover:text-ink shrink-0"
                                aria-label="Quitar archivo"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}

                {/* New file selected */}
                {selectedFile && (
                    <div className="border-primary bg-primary/5 mb-3 flex items-center gap-2 rounded-[10px] border px-3 py-2">
                        <Paperclip size={14} className="text-primary shrink-0" />
                        <span className="text-ink min-w-0 flex-1 truncate text-xs">
                            {selectedFile.name}
                        </span>
                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-mute hover:text-ink shrink-0"
                            aria-label="Quitar archivo"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe tu respuesta aquí…"
                    rows={5}
                    disabled={isGraded || isPending}
                    className="mb-3"
                />

                <div className="flex items-center justify-between gap-3">
                    {!isGraded && (
                        <>
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isPending}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isPending}
                                >
                                    <Paperclip size={14} className="mr-1" />
                                    {uploadedFileUrl ? 'Cambiar archivo' : 'Adjuntar archivo'}
                                </Button>
                            </div>
                            <Button
                                type="button"
                                variant="primary"
                                size="md"
                                onClick={handleSubmit}
                                disabled={
                                    isPending || (!text.trim() && !uploadedFileUrl && !selectedFile)
                                }
                            >
                                {isPending ? (
                                    <Loader2 size={14} className="mr-1 animate-spin" />
                                ) : (
                                    <CheckCircle2 size={14} className="mr-1" />
                                )}
                                {existingSubmission ? 'Actualizar entrega' : 'Entregar'}
                            </Button>
                        </>
                    )}

                    {isGraded && (
                        <p className="text-mute text-xs">
                            Esta entrega ya fue calificada y no puede modificarse.
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
}
