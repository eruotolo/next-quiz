import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionPageAccess } from '@/shared/lib/auth-guard';
import { groupProfessorFilter, studentProfessorFilter } from '@/shared/lib/scoping';
import { USER_ROLE } from '@/shared/lib/roles';
import { StudentsClient } from '@/features/students/components/StudentsClient';

export default async function StudentsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { institutionId, institutionName, userId, isProfesor } =
        await requireInstitutionPageAccess(slug);

    // Profesor: ve, edita y crea (individual + import) solo en sus grupos; no elimina.
    const canCreate = true;
    const canEdit = true;
    const canDelete = !isProfesor;
    const canToggleActive = true;

    const [students, groups] = await Promise.all([
        prisma.user.findMany({
            where: {
                userRole: { name: USER_ROLE.STUDENT },
                academicInstitutionId: institutionId,
                ...(isProfesor && studentProfessorFilter(userId)),
            },
            include: { group: true },
            orderBy: [{ group: { name: 'asc' } }, { lastname: 'asc' }],
        }),
        prisma.group.findMany({
            where: {
                academicInstitutionId: institutionId,
                ...(isProfesor && groupProfessorFilter(userId)),
            },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <StudentsClient
            slug={slug}
            institutionName={institutionName}
            students={students}
            groups={groups}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            canToggleActive={canToggleActive}
        />
    );
}
