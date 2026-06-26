import { notFound } from 'next/navigation';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { ProgramDetail } from '@/features/programs/components/ProgramDetail';
import { academicLabel } from '@/shared/lib/academic-labels';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

interface Props {
    params: Promise<{ slug: string; programId: string }>;
}

export default async function ProgramDetailPage({ params }: Props) {
    const { slug, programId } = await params;
    const { institutionId, userRole, isProfesor, coordinatedProgramIds } =
        await requireInstitutionPageAccess(slug);

    // El Profesor solo accede al detalle de los programas que coordina.
    if (isProfesor && !coordinatedProgramIds.includes(programId)) notFound();

    // Solo Admin/SuperAdmin pueden asignar/quitar Jefes de Carrera.
    const canMutate = userRole === USER_ROLE.ADMIN || userRole === USER_ROLE.SUPER_ADMIN;

    const program = await prisma.program.findFirst({
        where: { id: programId, academicInstitutionId: institutionId },
        select: {
            id: true,
            name: true,
            code: true,
            academicInstitution: { select: { type: true } },
            groups: {
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: { users: { where: { userRole: { name: USER_ROLE.STUDENT } } } },
                    },
                },
                orderBy: { name: 'asc' },
            },
            courseSections: {
                select: {
                    id: true,
                    name: true,
                    period: { select: { name: true } },
                    group: { select: { name: true } },
                    professors: { select: { name: true, lastname: true } },
                },
                orderBy: { name: 'asc' },
            },
            coordinators: {
                select: {
                    id: true,
                    userId: true,
                    user: { select: { name: true, lastname: true } },
                },
            },
        },
    });
    if (!program) notFound();

    const labels = academicLabel(program.academicInstitution.type);

    const studentsTotal = program.groups.reduce((sum, g) => sum + g._count.users, 0);

    // Profesores elegibles como Jefes de Carrera (solo se usan si canMutate).
    const professors = canMutate
        ? await prisma.user.findMany({
              where: {
                  academicInstitutionId: institutionId,
                  userRole: { name: { in: [USER_ROLE.PROFESOR, USER_ROLE.ADMIN] } },
              },
              select: { id: true, name: true, lastname: true },
              orderBy: { lastname: 'asc' },
          })
        : [];

    return (
        <ProgramDetail
            slug={slug}
            programId={program.id}
            canMutate={canMutate}
            professors={professors}
            programName={program.name}
            programCode={program.code}
            programLabel={labels.program}
            programLabelPlural={labels.programPlural}
            courseLabelPlural={labels.coursePlural}
            stats={{
                groups: program.groups.length,
                courses: program.courseSections.length,
                students: studentsTotal,
            }}
            courses={program.courseSections.map((c) => ({
                id: c.id,
                name: c.name,
                periodName: c.period.name,
                groupName: c.group?.name ?? null,
                professors: c.professors.map((p) => `${p.name} ${p.lastname}`),
            }))}
            groups={program.groups.map((g) => ({
                id: g.id,
                name: g.name,
                studentsCount: g._count.users,
            }))}
            coordinators={program.coordinators.map((c) => ({
                id: c.id,
                userId: c.userId,
                name: `${c.user.name} ${c.user.lastname}`,
            }))}
        />
    );
}
