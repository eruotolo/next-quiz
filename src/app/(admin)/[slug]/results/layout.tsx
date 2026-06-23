import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { examProfessorFilter } from '@/shared/lib/scoping';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

export default async function ResultsLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionId, institutionName, isProfesor, userId } =
        await requireInstitutionPageAccess(slug);

    const count = await prisma.result.count({
        where: {
            exam: {
                academicInstitutionId: institutionId,
                ...(isProfesor && examProfessorFilter(userId)),
            },
        },
    });

    return (
        <>
            <AdminTopBar
                title="Historial de Resultados"
                breadcrumb={[institutionName, 'Resultados']}
                subtitle={`${count} evaluaciones completadas y procesadas`}
            />
            {children}
        </>
    );
}
