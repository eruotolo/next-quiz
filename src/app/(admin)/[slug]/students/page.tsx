import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { StudentsClient } from '@/features/students/components/StudentsClient';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { groupProfessorFilter } from '@/shared/lib/scoping';

export default async function StudentsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { institutionId, institutionName, userId, isProfesor, coordinatedProgramIds } =
        await requireInstitutionPageAccess(slug);

    // Profesor: ve, edita y crea (individual + import) solo en sus grupos; no elimina.
    const canCreate = true;
    const canEdit = true;
    const canDelete = !isProfesor;
    const canToggleActive = true;

    // Filtro compuesto: Group.professors (legacy) OR CourseSection.professors (nuevo)
    // OR coordinator (grupos del programa que coordina).
    const professorStudentWhere = isProfesor ? {
        OR: [
            { group: { professors: { some: { id: userId } } } },
            { group: { courseSections: { some: { professors: { some: { id: userId } } } } } },
            ...(coordinatedProgramIds.length > 0
                ? [{ group: { programId: { in: coordinatedProgramIds } } }]
                : []),
        ],
    } : {};

    const professorGroupWhere = isProfesor ? {
        OR: [
            groupProfessorFilter(userId),
            { courseSections: { some: { professors: { some: { id: userId } } } } },
            ...(coordinatedProgramIds.length > 0
                ? [{ programId: { in: coordinatedProgramIds } }]
                : []),
        ],
    } : {};

    const [students, groups] = await Promise.all([
        prisma.user.findMany({
            where: {
                userRole: { name: USER_ROLE.STUDENT },
                academicInstitutionId: institutionId,
                ...professorStudentWhere,
            },
            include: {
                group: { include: { program: { select: { id: true, name: true } } } },
            },
            orderBy: [{ group: { name: 'asc' } }, { lastname: 'asc' }],
        }),
        prisma.group.findMany({
            where: {
                academicInstitutionId: institutionId,
                ...professorGroupWhere,
            },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <>
            <AdminTopBar
                title="Estudiantes"
                breadcrumb={[institutionName, 'Estudiantes']}
                subtitle={`${students.length} registrados`}
            />
            <StudentsClient
                slug={slug}
                students={students}
                groups={groups}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                canToggleActive={canToggleActive}
            />
        </>
    );
}
