import { ConfigProgramsClient } from '@/features/config/components/ConfigProgramsClient';
import { prisma } from '@/shared/lib/prisma';

export default async function ConfigProgramsPage() {
    const programs = await prisma.program.findMany({
        include: {
            academicInstitution: { select: { name: true, slug: true } },
            _count: { select: { groups: true, courseSections: true, coordinators: true } },
        },
        orderBy: [{ academicInstitution: { name: 'asc' } }, { name: 'asc' }],
    });

    return <ConfigProgramsClient programs={programs} />;
}
