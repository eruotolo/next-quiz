import { verifyCertificate } from '@/features/lms/actions/certificates';
import { LogoLockup } from '@/shared/components/branding/logo';
import { Award, CheckCircle2, Download, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
    params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params;
    const result = await verifyCertificate(code);
    if (result.error || !result.data) {
        return { title: 'Certificado no encontrado — Aulika' };
    }
    const { student, course } = result.data;
    return {
        title: `Certificado de ${student.name} ${student.lastname} — ${course.title} · Aulika`,
        robots: { index: false, follow: false },
    };
}

export default async function CertificadoVerificacionPage({ params }: Props) {
    const { code } = await params;
    const result = await verifyCertificate(code);

    const isValid = !result.error && !!result.data && !result.data.revokedAt;
    const cert = result.data;

    return (
        <div className="bg-paper flex min-h-screen flex-col">
            <header className="border-border border-b bg-white px-6 py-3">
                <Link href="/">
                    <LogoLockup size={28} />
                </Link>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg">
                    {/* Verificación badge */}
                    <div
                        className={cn(
                            'mb-6 flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center',
                            isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50',
                        )}
                    >
                        {isValid ? (
                            <CheckCircle2 size={40} className="text-green-500" />
                        ) : (
                            <XCircle size={40} className="text-red-500" />
                        )}
                        <div>
                            <p
                                className={cn(
                                    'text-lg font-bold',
                                    isValid ? 'text-green-700' : 'text-red-700',
                                )}
                            >
                                {isValid
                                    ? 'Certificado válido'
                                    : cert?.revokedAt
                                      ? 'Certificado revocado'
                                      : 'Certificado no encontrado'}
                            </p>
                            {cert?.revokedAt && (
                                <p className="mt-1 text-sm text-red-600">
                                    Este certificado fue revocado el{' '}
                                    {new Date(cert.revokedAt).toLocaleDateString('es-CL', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                    .
                                </p>
                            )}
                            {!cert && (
                                <p className="mt-1 text-sm text-red-600">
                                    No existe un certificado con el código proporcionado.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Detalle del certificado */}
                    {cert && (
                        <div className="border-border rounded-xl border bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="bg-primary/8 rounded-lg p-2">
                                    <Award size={24} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-ink text-xs font-medium tracking-wider uppercase">
                                        Certificado de finalización
                                    </p>
                                    <p className="text-mute font-mono text-xs">
                                        Código: {cert.verificationCode}
                                    </p>
                                </div>
                            </div>

                            <dl className="flex flex-col gap-3">
                                <div>
                                    <dt className="text-mute text-xs">Estudiante</dt>
                                    <dd className="text-ink mt-0.5 text-base font-semibold">
                                        {cert.student.name} {cert.student.lastname}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-mute text-xs">Curso completado</dt>
                                    <dd className="text-ink mt-0.5 text-sm font-medium">
                                        {cert.course.title}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-mute text-xs">Institución</dt>
                                    <dd className="text-ink mt-0.5 text-sm">
                                        {cert.course.institution}
                                    </dd>
                                </div>
                                {cert.finalGrade !== null && (
                                    <div>
                                        <dt className="text-mute text-xs">Nota final</dt>
                                        <dd
                                            className={cn(
                                                'mt-0.5 text-2xl font-bold',
                                                cert.finalGrade >= 4
                                                    ? 'text-green-600'
                                                    : 'text-red-500',
                                            )}
                                        >
                                            {cert.finalGrade.toFixed(1)}
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-mute text-xs">Fecha de emisión</dt>
                                    <dd className="text-ink mt-0.5 text-sm">
                                        {new Date(cert.issuedAt).toLocaleDateString('es-CL', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </dd>
                                </div>
                            </dl>

                            {isValid && cert.pdfUrl && (
                                <a
                                    href={cert.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="bg-primary hover:bg-primary/90 mt-6 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
                                >
                                    <Download size={16} />
                                    Descargar certificado PDF
                                </a>
                            )}
                        </div>
                    )}

                    <p className="text-mute mt-6 text-center text-xs">
                        Verificación proporcionada por{' '}
                        <Link href="/" className="text-primary underline">
                            Aulika
                        </Link>
                        . Esta página confirma la autenticidad del certificado.
                    </p>
                </div>
            </main>
        </div>
    );
}
