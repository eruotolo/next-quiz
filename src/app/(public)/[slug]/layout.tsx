import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { prisma } from '@/shared/lib/prisma';
import { LogoLockup } from '@/shared/components/branding/logo';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

/**
 * Layout público de una institución (`/[slug]`). Solo se renderiza si la
 * institución existe; las páginas internas deciden qué hacer según el flag
 * `isPublic` o el endpoint puntual. Header minimal con logo + breadcrumb.
 */
export default async function PublicInstitutionLayout({ children, params }: Props) {
    const { slug } = await params;
    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true, name: true, active: true },
    });
    if (!inst || !inst.active) notFound();

    return (
        <div className="bg-paper-warm min-h-screen">
            <header className="border-border bg-paper sticky top-0 z-30 border-b">
                <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
                    <Link
                        href="/"
                        className="transition-opacity hover:opacity-70"
                        aria-label="Inicio Aulika"
                    >
                        <LogoLockup size={26} variant="cobalto" />
                    </Link>
                    <nav className="text-ink-dim flex items-center gap-5 text-[13px] font-medium">
                        <Link
                            href={`/${slug}/cursos`}
                            className="hover:text-ink transition-colors"
                        >
                            Cursos
                        </Link>
                        <span className="text-mute hidden text-[12px] sm:inline">
                            {inst.name}
                        </span>
                    </nav>
                </div>
            </header>
            {children}
        </div>
    );
}
