import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { NewProfessorButton } from '@/features/professors/components/NewProfessorButton';
import { ProfessorsClient } from '@/features/professors/components/ProfessorsClient';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

export default async function ProfessorsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { institutionId, institutionName, userRole, isDemo } = await requireInstitutionPageAccess(slug);

    const [professors, groups] = await Promise.all([
        prisma.user.findMany({
            where: {
                academicInstitutionId: institutionId,
                userRole: { name: { in: ['Profesor', 'Administrador'] } },
            },
            include: {
                userRole: true,
                professorGroups: true,
                _count: { select: { taughtSections: true } },
            },
            orderBy: { lastname: 'asc' },
        }),
        prisma.group.findMany({
            where: { academicInstitutionId: institutionId },
            orderBy: { name: 'asc' },
        }),
    ]);

    const canMutate = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN;

    return (
        <>
            <AdminTopBar
                title="Cuerpo Docente"
                breadcrumb={[institutionName, 'Profesores']}
                subtitle={`${professors.length} profesionales registrados en el equipo`}
                actions={canMutate ? <NewProfessorButton slug={slug} isDemo={isDemo} /> : undefined}
            />
            <ProfessorsClient professors={professors} groups={groups} slug={slug} isDemo={isDemo} />
        </>
    );
}
