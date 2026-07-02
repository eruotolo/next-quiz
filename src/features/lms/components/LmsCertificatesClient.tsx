'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Award, CheckCircle2, Download, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';
import type { CertificateStudent } from '@/features/lms/actions/certificates';
import { issueLmsCertificate, revokeLmsCertificate } from '@/features/lms/actions/certificates';
import { useRouter } from 'next/navigation';

interface Props {
    slug: string;
    courseId: string;
    students: CertificateStudent[];
    certificateEnabled: boolean;
}

function ProgressBar({ pct }: { pct: number }) {
    return (
        <div className="bg-border h-1.5 w-24 overflow-hidden rounded-full">
            <div
                className={cn(
                    'h-full rounded-full',
                    pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400',
                )}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

interface RowProps {
    student: CertificateStudent;
    slug: string;
    courseId: string;
    onRefresh: () => void;
}

function StudentRow({ student, slug, courseId, onRefresh }: RowProps) {
    const [grade, setGrade] = useState<string>(student.certificate?.finalGrade?.toString() ?? '');
    const [isPending, startTransition] = useTransition();

    const cert = student.certificate;
    const hasActiveCert = !!cert && !cert.revokedAt;

    const handleIssue = () => {
        startTransition(async () => {
            const gradeNum = grade ? Number.parseFloat(grade) : null;
            if (gradeNum !== null && (gradeNum < 1 || gradeNum > 7)) {
                toast.error('La nota debe estar entre 1.0 y 7.0.');
                return;
            }
            const result = await issueLmsCertificate(slug, {
                courseId,
                studentId: student.userId,
                finalGrade: gradeNum,
            });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Certificado emitido correctamente.');
            onRefresh();
        });
    };

    const handleRevoke = () => {
        if (!cert) return;
        startTransition(async () => {
            const result = await revokeLmsCertificate(slug, cert.id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Certificado revocado.');
            onRefresh();
        });
    };

    return (
        <TableRow>
            <TableCell>
                <div>
                    <p className="text-ink text-sm font-medium">
                        {student.name} {student.lastname}
                    </p>
                    <p className="text-mute text-xs">{student.email}</p>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <ProgressBar pct={student.progressPct} />
                    <span className="text-mute text-xs">{student.progressPct}%</span>
                </div>
            </TableCell>
            <TableCell>
                {hasActiveCert ? (
                    <Badge className="border-green-200 bg-green-100 text-green-700">
                        <CheckCircle2 size={11} className="mr-1" />
                        Emitido
                    </Badge>
                ) : cert?.revokedAt ? (
                    <Badge variant="outline" className="border-red-200 text-red-500">
                        <XCircle size={11} className="mr-1" />
                        Revocado
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-mute">
                        Sin certificado
                    </Badge>
                )}
            </TableCell>
            <TableCell>
                {hasActiveCert ? (
                    <span className="text-ink text-sm font-bold">
                        {cert?.finalGrade?.toFixed(1) ?? '—'}
                    </span>
                ) : (
                    <Input
                        type="number"
                        min={1}
                        max={7}
                        step={0.1}
                        placeholder="1.0–7.0"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="h-7 w-24 text-sm"
                        disabled={isPending}
                    />
                )}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                    {hasActiveCert && (
                        <>
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" asChild>
                                <a
                                    href={`/certificado/${cert?.verificationCode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink size={12} />
                                    Ver
                                </a>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" asChild>
                                <a
                                    href={cert?.pdfUrl ?? `/certificado/${cert?.verificationCode}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download size={12} />
                                    Ver diploma
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs text-red-600 hover:text-red-700"
                                onClick={handleRevoke}
                                disabled={isPending}
                            >
                                <XCircle size={12} />
                                Revocar
                            </Button>
                        </>
                    )}
                    {!hasActiveCert && (
                        <Button
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={handleIssue}
                            disabled={isPending}
                        >
                            <Award size={12} />
                            {cert ? 'Re-emitir' : 'Emitir'}
                        </Button>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}

export function LmsCertificatesClient({ slug, courseId, students, certificateEnabled }: Props) {
    const router = useRouter();
    const [search, setSearch] = useState('');

    const filtered = students.filter(
        (s) =>
            `${s.name} ${s.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase()),
    );

    const issued = students.filter((s) => s.certificate && !s.certificate.revokedAt).length;

    const refresh = () => router.refresh();

    return (
        <div className="flex flex-col gap-4 p-6">
            {!certificateEnabled && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <Award size={16} />
                    Los certificados están deshabilitados en este curso. Actívalos desde la
                    configuración del curso para poder emitirlos.
                </div>
            )}

            <div className="flex items-center justify-between">
                <p className="text-mute text-sm">
                    <span className="text-ink font-bold">{issued}</span> de{' '}
                    <span className="text-ink font-bold">{students.length}</span> estudiantes con
                    certificado activo
                </p>
                <div className="flex items-center gap-3">
                    <Input
                        placeholder="Buscar estudiante..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 w-56 text-sm"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refresh}
                        className="h-8 gap-1.5 text-xs"
                    >
                        <RefreshCw size={13} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed py-16">
                    <Award size={40} className="text-mute/30 mb-4" />
                    <p className="text-ink font-medium">
                        {search ? 'Sin coincidencias' : 'Sin estudiantes inscriptos'}
                    </p>
                </Card>
            ) : (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Estudiante</TableHead>
                                <TableHead>Progreso</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Nota final</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((s) => (
                                <StudentRow
                                    key={s.userId}
                                    student={s}
                                    slug={slug}
                                    courseId={courseId}
                                    onRefresh={refresh}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
