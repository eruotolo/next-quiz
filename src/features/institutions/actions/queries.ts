'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import type { PaginatedResult, PaginationParams } from '@/shared/types/pagination';

export interface InstitutionRow {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    phone: string;
    address: string;
    campus: string | null;
    active: boolean;
    _count: { users: number };
}

export async function getInstitutions(
    params: PaginationParams,
): Promise<PaginatedResult<InstitutionRow>> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');

    // biome-ignore lint/suspicious/noExplicitAny: dynamic where
    const where: Record<string, any> = params.q
        ? { OR: [{ name: { contains: params.q, mode: 'insensitive' } }, { slug: { contains: params.q, mode: 'insensitive' } }] }
        : {};

    const skip = (params.page - 1) * params.perPage;

    const [items, total] = await prisma.$transaction([
        prisma.academicInstitution.findMany({
            where,
            orderBy: { name: 'asc' },
            skip,
            take: params.perPage,
            select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                country: true,
                phone: true,
                address: true,
                campus: true,
                active: true,
                _count: { select: { users: true } },
            },
        }),
        prisma.academicInstitution.count({ where }),
    ]);

    return { items, total, page: params.page, perPage: params.perPage };
}

export async function getInstitutionById(id: string): Promise<InstitutionRow | null> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');

    return prisma.academicInstitution.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true,
            phone: true,
            address: true,
            campus: true,
            active: true,
            _count: { select: { users: true } },
        },
    });
}
