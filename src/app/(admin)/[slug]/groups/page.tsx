import { auth } from '@/features/auth/auth';
import { GroupsClient } from '@/features/groups/components/GroupsClient';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { redirect } from 'next/navigation';

export default async function GroupsPage({ params }: { params: Promise<{ slug: string }> }) {
    const [{ slug: _slug }, session] = await Promise.all([params, auth()]);
    if (!session) redirect('/login');

    const canMutate =
        session.user.userRoleName === USER_ROLE.SUPER_ADMIN ||
        session.user.userRoleName === USER_ROLE.ADMIN;

    const isProfesor = session.user.userRoleName === USER_ROLE.PROFESOR;

    const groups = await prisma.group.findMany({
        where: isProfesor ? { professors: { some: { id: session.user.id } } } : undefined,
        include: {
            _count: { select: { users: true, exams: true } },
            users: {
                where: { userRole: { name: USER_ROLE.STUDENT } },
                select: { id: true, name: true, lastname: true, rut: true, active: true },
                orderBy: { lastname: 'asc' },
            },
        },
        orderBy: { name: 'asc' },
    });

    return <GroupsClient groups={groups} canMutate={canMutate} />;
}
