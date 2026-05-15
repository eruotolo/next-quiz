import { prisma } from '@/shared/lib/prisma';

export async function getProfessorGroupIds(professorId: string): Promise<string[]> {
    const professor = await prisma.user.findUnique({
        where: { id: professorId },
        select: { professorGroups: { select: { id: true } } },
    });
    return professor?.professorGroups.map((g) => g.id) ?? [];
}
