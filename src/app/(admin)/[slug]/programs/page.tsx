import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { ProgramsClient, type ProgramRow } from '@/features/programs/components/ProgramsClient';
import { academicLabel } from '@/shared/lib/academic-labels';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

export default async function ProgramsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { institutionId, userRole, isProfesor, coordinatedProgramIds, isDemo } =
        await requireInstitutionPageAccess(slug);

    const institution = await prisma.academicInstitution.findUnique({
        where: { id: institutionId },
        select: { type: true },
    });
    const labels = academicLabel(institution?.type ?? 'OTRO');

    const canMutate = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN;

    const programs = await prisma.program.findMany({
        where: {
            academicInstitutionId: institutionId,
            ...(isProfesor && { id: { in: coordinatedProgramIds } }),
        },
        select: {
            id: true,
            name: true,
            code: true,
            description: true,
            _count: { select: { groups: true, courseSections: true, coordinators: true } },
        },
        orderBy: { name: 'asc' },
    });

    const rows: ProgramRow[] = programs.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        groupsCount: p._count.groups,
        coursesCount: p._count.courseSections,
        coordinatorsCount: p._count.coordinators,
    }));

    return (
        <ProgramsClient
            slug={slug}
            programs={rows}
            canMutate={canMutate}
            label={labels.program}
            labelPlural={labels.programPlural}
            isDemo={isDemo}
        />
    );
}
