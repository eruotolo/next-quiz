import { PaesExamCarousel } from '@/features/paes/components/PaesExamCarousel';
import { PAES_CATALOG, getSubjectMeta } from '@/features/paes/lib/catalog';
import type { PaesExam, PaesSubject } from '@/features/paes/types/paes.types';
import { LogoMark } from '@/shared/components/branding/logo';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const DATA_LOADERS: Record<PaesSubject, () => Promise<PaesExam>> = {
    lectora: () =>
        import('@/features/paes/data/lectora-invierno-2026.json').then(
            (m) => m.default as unknown as PaesExam,
        ),
    m1: () =>
        import('@/features/paes/data/m1-invierno-2026.json').then(
            (m) => m.default as unknown as PaesExam,
        ),
    m2: () =>
        import('@/features/paes/data/m2-invierno-2026.json').then(
            (m) => m.default as unknown as PaesExam,
        ),
    historia: () =>
        import('@/features/paes/data/historia-invierno-2026.json').then(
            (m) => m.default as unknown as PaesExam,
        ),
    ciencias: () =>
        import('@/features/paes/data/ciencias-invierno-2026.json').then(
            (m) => m.default as unknown as PaesExam,
        ),
};

interface PageProps {
    params: Promise<{ subject: string }>;
}

export async function generateStaticParams(): Promise<Array<{ subject: string }>> {
    return PAES_CATALOG.map((s) => ({ subject: s.subject }));
}

export async function generateMetadata({ params }: PageProps) {
    const { subject } = await params;
    const meta = getSubjectMeta(subject as PaesSubject);
    if (!meta) return {};
    return {
        title: `${meta.label} — Simulador PAES · Aulika`,
        description: `Practica ${meta.label} con un ensayo cronometrado de ${meta.practiceQuestionCount} preguntas.`,
    };
}

export default async function PaesSubjectPage({ params }: PageProps): Promise<React.JSX.Element> {
    const { subject } = await params;
    const meta = getSubjectMeta(subject as PaesSubject);

    if (!meta) notFound();

    const loader = DATA_LOADERS[meta.subject as PaesSubject];
    if (!loader) notFound();

    const exam = await loader();
    const initialSeconds = meta.timeLimitMinutes * 60;

    return (
        <main className="min-h-screen">
            <PaesExamCarousel exam={exam} initialSeconds={initialSeconds} backUrl="/paes" />
        </main>
    );
}

// Shown if subject param is valid but something else fails (shouldn't happen)
export function generateNotFound() {
    return (
        <div className="bg-paper flex min-h-screen flex-col items-center justify-center px-4 text-center">
            <LogoMark size={32} className="mb-6 opacity-40" />
            <h1 className="font-display text-ink mb-4 text-[28px] font-semibold">
                Prueba no encontrada
            </h1>
            <Link
                href="/paes"
                className="bg-primary hover:bg-primary/90 rounded-[10px] px-5 py-2.5 font-mono text-[13px] font-semibold text-white transition-colors"
            >
                ← Ver todas las pruebas
            </Link>
        </div>
    );
}
