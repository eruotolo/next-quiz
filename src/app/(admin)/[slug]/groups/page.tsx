import { auth } from '@/features/auth/auth';
import { GroupsClient } from '@/features/groups/components/GroupsClient';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';

export default async function GroupsPage({ params }: { params: Promise<{ slug: string }> }) {
    const [{ slug }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true, name: true },
    });
    if (!inst) redirect(session.user.userRoleName === USER_ROLE.SUPER_ADMIN ? '/config' : '/login');

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    const isAdmin = session.user.userRoleName === USER_ROLE.ADMIN;
    const isProfesor = session.user.userRoleName === USER_ROLE.PROFESOR;

    if (!isSuperAdmin && session.user.academicInstitutionId !== inst.id) redirect('/login');

    const canMutate = isSuperAdmin || isAdmin;

    const [groups, professors] = await Promise.all([
        prisma.group.findMany({
            where: {
                academicInstitutionId: inst.id,
                ...(isProfesor ? { professors: { some: { id: session.user.id } } } : {}),
            },
            include: {
                _count: { select: { users: true, exams: true } },
                tutor: { select: { id: true, name: true, lastname: true } },
                users: {
                    where: { userRole: { name: USER_ROLE.STUDENT } },
                    select: { id: true, name: true, lastname: true, rut: true, active: true },
                    orderBy: { lastname: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        }),
        prisma.user.findMany({
            where: { academicInstitutionId: inst.id, userRole: { name: USER_ROLE.PROFESOR } },
            select: { id: true, name: true, lastname: true },
            orderBy: { lastname: 'asc' },
        }),
    ]);

    return (
        <GroupsClient
            slug={slug}
            institutionName={inst.name}
            groups={groups}
            professors={professors}
            canMutate={canMutate}
        />
    );
}
