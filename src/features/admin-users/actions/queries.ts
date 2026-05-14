'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import type { PaginatedResult, PaginationParams } from '@/shared/types/pagination';

export interface AdminUserRow {
    id: string;
    name: string;
    lastname: string;
    email: string;
    rut: string;
    role: string;
    institution: { id: string; name: string } | null;
}

export async function getAdminUsers(
    params: PaginationParams & { institutionId?: string },
): Promise<PaginatedResult<AdminUserRow>> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');

    // biome-ignore lint/suspicious/noExplicitAny: dynamic where
    const where: Record<string, any> = {
        userRole: { name: { in: [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] } },
    };

    if (params.institutionId) {
        where.academicInstitutionId = params.institutionId;
    }

    if (params.q) {
        where.OR = [
            { name: { contains: params.q, mode: 'insensitive' } },
            { lastname: { contains: params.q, mode: 'insensitive' } },
            { email: { contains: params.q, mode: 'insensitive' } },
            { rut: { contains: params.q, mode: 'insensitive' } },
        ];
    }

    const skip = (params.page - 1) * params.perPage;

    const [items, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            orderBy: [{ userRole: { name: 'asc' } }, { name: 'asc' }, { lastname: 'asc' }],
            skip,
            take: params.perPage,
            select: {
                id: true,
                name: true,
                lastname: true,
                email: true,
                rut: true,
                userRole: { select: { name: true } },
                academicInstitution: { select: { id: true, name: true } },
            },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        items: items.map((u) => ({
            id: u.id,
            name: u.name,
            lastname: u.lastname,
            email: u.email,
            rut: u.rut,
            role: u.userRole?.name ?? '',
            institution: u.academicInstitution,
        })),
        total,
        page: params.page,
        perPage: params.perPage,
    };
}
