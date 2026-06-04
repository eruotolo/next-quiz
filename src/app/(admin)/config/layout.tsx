import { auth } from '@/features/auth/auth';
import { USER_ROLE } from '@/shared/lib/roles';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { prisma } from '@/shared/lib/prisma';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default async function ConfigLayout({ children }: Props): Promise<React.JSX.Element> {
    const session = await auth();
    if (!session || session.user.userRoleName !== USER_ROLE.SUPER_ADMIN) redirect('/login');

    const [institutionList, admins, students] = await Promise.all([
        prisma.academicInstitution.findMany({
            select: { name: true, slug: true },
            orderBy: { name: 'asc' },
        }),
        prisma.user.count({
            where: { userRole: { name: { in: [USER_ROLE.ADMIN, USER_ROLE.PROFESOR] } } },
        }),
        prisma.user.count({
            where: { userRole: { name: USER_ROLE.STUDENT } },
        }),
    ]);

    return (
        <div className="bg-paper flex min-h-screen">
            <Sidebar
                isSuper
                userName={session.user?.name}
                userEmail={session.user?.email}
                userRole="SuperAdministrador"
                counts={{ institutions: institutionList.length, admins, students }}
                institutionList={institutionList}
            />
            <main className="ml-60 flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}
