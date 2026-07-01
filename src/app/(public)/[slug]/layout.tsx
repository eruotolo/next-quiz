import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { prisma } from '@/shared/lib/prisma';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

/**
 * Layout público de una institución (`/[slug]`). Solo se renderiza si la
 * institución existe; las páginas internas deciden qué hacer según el flag
 * `isPublic` o el endpoint puntual. El header global ya lo provee
 * `(public)/layout.tsx` (`PublicNav`), por eso este layout no agrega uno propio.
 */
export default async function PublicInstitutionLayout({ children, params }: Props) {
    const { slug } = await params;
    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true, active: true },
    });
    if (!inst || !inst.active) notFound();

    return <div className="bg-paper-warm min-h-screen">{children}</div>;
}
