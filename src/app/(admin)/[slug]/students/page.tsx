import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { StudentsClient } from '@/features/students/components/StudentsClient';
import { redirect } from 'next/navigation';

export default async function StudentsPage({ params }: { params: Promise<{ slug: string }> }) {
    const [{ slug }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    let institutionId: string;
    if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
        const inst = await prisma.academicInstitution.findUnique({ where: { slug }, select: { id: true } });
        if (!inst) redirect('/config');
        institutionId = inst.id;
    } else {
        if (!session.user.academicInstitutionId) redirect('/login');
        institutionId = session.user.academicInstitutionId;
    }

    const isAdminOrSuper =
        session.user.userRoleName === USER_ROLE.SUPER_ADMIN ||
        session.user.userRoleName === USER_ROLE.ADMIN;
    const isProfesor = session.user.userRoleName === USER_ROLE.PROFESOR;

    const canCreate = isAdminOrSuper;
    const canEdit = isAdminOrSuper || isProfesor;
    const canDelete = isAdminOrSuper;
    const canToggleActive = isAdminOrSuper || isProfesor;

    const [students, groups] = await Promise.all([
        prisma.user.findMany({
            where: {
                userRole: { name: USER_ROLE.STUDENT },
                academicInstitutionId: institutionId,
                ...(isProfesor && {
                    group: { professors: { some: { id: session.user.id } } },
                }),
            },
            include: { group: true },
            orderBy: [{ group: { name: 'asc' } }, { lastname: 'asc' }],
        }),
        isProfesor
            ? prisma.group.findMany({
                  where: { professors: { some: { id: session.user.id } } },
                  orderBy: { name: 'asc' },
              })
            : prisma.group.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return (
        <StudentsClient
            students={students}
            groups={groups}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            canToggleActive={canToggleActive}
        />
    );
}
