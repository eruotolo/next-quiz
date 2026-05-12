import { prisma } from '@/lib/prisma';
import { GroupsClient } from './_components/GroupsClient';

export default async function GroupsPage() {
    const groups = await prisma.group.findMany({
        include: { _count: { select: { users: true, exams: true } } },
        orderBy: { name: 'asc' },
    });
    return <GroupsClient groups={groups} />;
}
