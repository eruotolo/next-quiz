import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    params: Promise<{ slug: string }>;
}

function getCourseLabel(type: string): string {
    if (type === 'COLEGIO' || type === 'LICEO_TECNICO') return 'Asignatura';
    if (type === 'UNIVERSIDAD' || type === 'INSTITUTO_PROFESIONAL' || type === 'CFT') return 'Ramo';
    return 'Materia';
}

export default async function CoursesLayout({ children, params }: Props) {
    const { slug } = await params;
    const { institutionId, institutionName, userId, isProfesor } = await requireInstitutionPageAccess(slug);

    const institution = await prisma.academicInstitution.findUnique({
        where: { id: institutionId },
        select: { type: true }
    });

    const label = getCourseLabel(institution?.type ?? 'OTRO');
    const labelPlural = `${label}s`;

    const count = await prisma.courseSection.count({
        where: {
            period: { academicInstitutionId: institutionId },
            ...(isProfesor && { professors: { some: { id: userId } } }),
        },
    });

    return (
        <>
            <AdminTopBar
                breadcrumb={[institutionName, labelPlural]}
                title={labelPlural}
                subtitle={`${count} registradas`}
            />
            {children}
        </>
    );
}
