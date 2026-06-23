'use server';

import { requireInstitutionAccess } from '@/shared/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import type { Group } from '@prisma/client';

export async function getGroupsForSlug(slug: string): Promise<Group[]> {
    const { institutionId } = await requireInstitutionAccess(slug);
    return prisma.group.findMany({
        where: { academicInstitutionId: institutionId },
        orderBy: { name: 'asc' },
    });
}
