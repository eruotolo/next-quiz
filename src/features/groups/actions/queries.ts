'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

interface ProfessorOption {
    id: string;
    name: string;
    lastname: string;
}

export async function getProfessorsForSlug(slug: string): Promise<ProfessorOption[]> {
    const { institutionId } = await requireInstitutionAccess(slug);
    return prisma.user.findMany({
        where: { academicInstitutionId: institutionId, userRole: { name: USER_ROLE.PROFESOR } },
        select: { id: true, name: true, lastname: true },
        orderBy: { lastname: 'asc' },
    });
}
