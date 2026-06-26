'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';

export interface ProfessorOption {
    id: string;
    name: string;
    lastname: string;
}

/** Profesores de la institución, para elegir Jefes de Carrera de un programa. */
export async function getInstitutionProfessors(slug: string): Promise<ProfessorOption[]> {
    const { institutionId } = await requireInstitutionAccess(slug);
    return prisma.user.findMany({
        where: { academicInstitutionId: institutionId, userRole: { name: { in: [USER_ROLE.PROFESOR, USER_ROLE.ADMIN] } } },
        select: { id: true, name: true, lastname: true },
        orderBy: { lastname: 'asc' },
    });
}
