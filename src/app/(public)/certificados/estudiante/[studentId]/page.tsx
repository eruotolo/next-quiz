import { listStudentCertificates } from '@/features/lms/actions/certificates';
import { LogoLockup } from '@/shared/components/branding/logo';
import { Award, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
    params: Promise<{ studentId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { studentId } = await params;
    const result = await listStudentCertificates(studentId);
    if (result.error || !result.data) {
        return { title: 'Certificados no encontrados — Aulika' };
    }
    const { student } = result.data;
    return {
        title: `Certificados de ${student.name} ${student.lastname} · Aulika`,
        robots: { index: false, follow: false },
    };
}

export default async function StudentCertificatesPage({ params }: Props) {
    const { studentId } = await params;
    const result = await listStudentCertificates(studentId);
    if (result.error || !result.data) notFound();

    const { student, certificates } = result.data;

    return (
        <div className="bg-paper flex min-h-screen flex-col">
            <header className="border-border border-b bg-white px-6 py-3">
                <Link href="/">
                    <LogoLockup size={28} />
                </Link>
            </header>

            <main className="flex flex-1 flex-col items-center px-4 py-12">
                <div className="w-full max-w-2xl">
                    <div className="mb-8 text-center">
                        <p className="text-mute text-xs font-medium tracking-wider uppercase">
                            Certificados de finalización
                        </p>
                        <h1 className="text-ink font-display mt-1 text-2xl font-bold">
                            {student.name} {student.lastname}
                        </h1>
                    </div>

                    {certificates.length === 0 ? (
                        <div className="border-border rounded-xl border border-dashed bg-white p-12 text-center">
                            <Award size={32} className="text-mute/30 mx-auto mb-3" />
                            <p className="text-mute text-sm">
                                Este estudiante todavía no tiene certificados emitidos.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {certificates.map((cert) => (
                                <div
                                    key={cert.id}
                                    className="border-border rounded-xl border bg-white p-6 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/8 rounded-lg p-2">
                                                <Award size={22} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-ink text-sm font-semibold">
                                                    {cert.course.title}
                                                </p>
                                                <p className="text-mute text-xs">
                                                    {cert.course.institution}
                                                </p>
                                            </div>
                                        </div>
                                        {cert.finalGrade !== null && (
                                            <span
                                                className={
                                                    cert.finalGrade >= 4
                                                        ? 'text-lg font-bold text-green-600'
                                                        : 'text-lg font-bold text-red-500'
                                                }
                                            >
                                                {cert.finalGrade.toFixed(1)}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-mute mt-3 text-xs">
                                        Emitido el{' '}
                                        {new Date(cert.issuedAt).toLocaleDateString('es-CL', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}{' '}
                                        · Código {cert.verificationCode}
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <a
                                            href={`/certificado/${cert.verificationCode}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="border-border text-ink flex items-center gap-1.5 rounded-[8px] border bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
                                        >
                                            <ExternalLink size={13} />
                                            Ver certificado
                                        </a>
                                        <a
                                            href={
                                                cert.pdfUrl ??
                                                `/certificado/${cert.verificationCode}/pdf`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="border-border text-ink flex items-center gap-1.5 rounded-[8px] border bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
                                        >
                                            <Download size={13} />
                                            Descargar diploma
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-mute mt-6 text-center text-xs">
                        Verificación proporcionada por{' '}
                        <Link href="/" className="text-primary underline">
                            Aulika
                        </Link>
                        .
                    </p>
                </div>
            </main>
        </div>
    );
}
