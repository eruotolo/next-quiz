import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { StudentsClient } from './_components/StudentsClient';

export default async function StudentsPage() {
    const [students, groups] = await Promise.all([
        prisma.user.findMany({
            where: { role: Role.STUDENT },
            include: { group: true },
            orderBy: [{ group: { name: 'asc' } }, { lastname: 'asc' }],
        }),
        prisma.group.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return <StudentsClient students={students} groups={groups} />;
}
