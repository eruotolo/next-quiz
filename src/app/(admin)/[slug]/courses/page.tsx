import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { CoursesClient } from '@/features/courses/components/CoursesClient';
import { academicLabel } from '@/shared/lib/academic-labels';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

interface Props {
    params: Promise<{ slug: string }>;
}

export default async function CoursesPage({ params }: Props) {
    const { slug } = await params;
    const { institutionId, institutionName, userRole, userId, isProfesor, coordinatedProgramIds, isDemo } =
        await requireInstitutionPageAccess(slug);

    const institution = await prisma.academicInstitution.findUnique({
        where: { id: institutionId },
        select: { type: true },
    });
    const labels = academicLabel(institution?.type ?? 'OTRO');
    const label = labels.course;

    // Admin/SuperAdmin mutan todo; el Jefe de Carrera muta dentro de sus programas.
    const canMutate =
        userRole === USER_ROLE.ADMIN ||
        userRole === USER_ROLE.SUPER_ADMIN ||
        (isProfesor && coordinatedProgramIds.length > 0);

    // D8 — unión de alcances: un profesor ve las materias donde dicta O las de los
    // programas que coordina (Jefe de Carrera).
    const professorScope = isProfesor
        ? {
              OR: [
                  { professors: { some: { id: userId } } },
                  ...(coordinatedProgramIds.length > 0
                      ? [{ programId: { in: coordinatedProgramIds } }]
                      : []),
              ],
          }
        : {};

    const [courses, programs, periods, groups] = await Promise.all([
        prisma.courseSection.findMany({
            where: {
                period: { academicInstitutionId: institutionId },
                ...professorScope,
            },
            include: {
                program: true,
                period: true,
                group: { include: { professors: true } },
                professors: true,
                _count: { select: { exams: true } },
            },
            orderBy: { name: 'asc' },
        }),
        prisma.program.findMany({
            where: { academicInstitutionId: institutionId },
            orderBy: { name: 'asc' },
        }),
        // Solo períodos activos al crear/editar materia (no tiene sentido asignar
        // una materia a un período ya cerrado).
        prisma.academicPeriod.findMany({
            where: { academicInstitutionId: institutionId, isActive: true },
            orderBy: { year: 'desc' },
        }),
        prisma.group.findMany({
            where: { academicInstitutionId: institutionId },
            orderBy: { name: 'asc' },
        }),
    ]);

    // Conteo real de estudiantes por grupo (los alumnos del grupo de cada materia).
    const groupIds = courses.map((c) => c.groupId).filter((id): id is string => !!id);
    const studentCounts =
        groupIds.length > 0
            ? await prisma.user.groupBy({
                  by: ['groupId'],
                  where: { groupId: { in: groupIds }, userRole: { name: USER_ROLE.STUDENT } },
                  _count: { _all: true },
              })
            : [];
    const countByGroup = new Map(studentCounts.map((r) => [r.groupId, r._count._all]));

    const mappedCourses = courses.map((c) => ({
        ...c,
        studentsCount: c.groupId ? (countByGroup.get(c.groupId) ?? 0) : 0,
    }));

    return (
        <>
            <AdminTopBar
                title={labels.coursePlural}
                breadcrumb={[institutionName, labels.coursePlural]}
                subtitle={`${mappedCourses.length} registradas`}
            />
            <CoursesClient
                slug={slug}
                courses={mappedCourses}
                programs={programs}
                periods={periods}
                groups={groups}
                canMutate={canMutate}
                courseLabel={label}
                isDemo={isDemo}
            />
        </>
    );
}
