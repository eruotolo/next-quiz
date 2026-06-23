'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import type { Plan } from '@prisma/client';
import type { PaginatedResult, PaginationParams } from '@/shared/types/pagination';

export interface InstitutionSettings {
    id: string;
    slug: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    campus: string | null;
    country: string;
    email: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string[];
}

export async function getInstitutionSettings(slug: string): Promise<InstitutionSettings | null> {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    const isAdmin = session.user.userRoleName === USER_ROLE.ADMIN;

    if (!isSuperAdmin && !isAdmin) throw new Error('Unauthorized');
    if (isAdmin && session.user.institutionSlug !== slug) throw new Error('Unauthorized');

    return prisma.academicInstitution.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            name: true,
            phone: true,
            address: true,
            city: true,
            campus: true,
            country: true,
            email: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
        },
    });
}

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
    plan: Plan;
    planExpiresAt: Date | null;
    customPlan: { id: string; name: string } | null;
    _count: { users: number };
}

export async function getInstitutions(
    params: PaginationParams,
): Promise<PaginatedResult<InstitutionRow>> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');

    // biome-ignore lint/suspicious/noExplicitAny: dynamic where
    const where: Record<string, any> = params.q
        ? {
              OR: [
                  { name: { contains: params.q, mode: 'insensitive' } },
                  { slug: { contains: params.q, mode: 'insensitive' } },
              ],
          }
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
                plan: true,
                planExpiresAt: true,
                customPlan: { select: { id: true, name: true } },
                _count: { select: { users: true } },
            },
        }),
        prisma.academicInstitution.count({ where }),
    ]);

    return { items, total, page: params.page, perPage: params.perPage };
}

