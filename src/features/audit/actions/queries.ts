'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import type { AuditQuery } from '@/features/audit/schemas/audit.schemas';
import type { AuditActionKey } from '@/features/audit/lib/actions';
import type { AuditLogsResult } from '@/features/audit/types/audit.types';

async function requireSuperAdmin(): Promise<void> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) {
        throw new Error('Unauthorized');
    }
}

export async function getAuditLogs(params: AuditQuery): Promise<AuditLogsResult> {
    await requireSuperAdmin();

    // biome-ignore lint/suspicious/noExplicitAny: Prisma type generated after migration
    const where: Record<string, any> = {};

    if (params.action) where.action = params.action;
    if (params.institutionId) where.academicInstitutionId = params.institutionId;
    if (params.status) where.status = params.status;

    if (params.from || params.to) {
        where.createdAt = {};
        if (params.from) where.createdAt.gte = new Date(params.from);
        if (params.to) {
            const to = new Date(params.to);
            to.setHours(23, 59, 59, 999);
            where.createdAt.lte = to;
        }
    }

    if (params.q) {
        const q = params.q;
        where.OR = [
            { actorEmail: { contains: q, mode: 'insensitive' } },
            { entity: { contains: q, mode: 'insensitive' } },
            { ip: { contains: q, mode: 'insensitive' } },
        ];
    }

    const skip = (params.page - 1) * params.perPage;

    const [items, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: params.perPage,
            include: {
                actor: { select: { name: true, lastname: true, email: true } },
                institution: { select: { name: true, slug: true } },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return { items, total, page: params.page, perPage: params.perPage };
}

export async function getDistinctActionsUsed(): Promise<AuditActionKey[]> {
    await requireSuperAdmin();

    const rows = await prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
    });

    return rows.map((r: { action: string }) => r.action as AuditActionKey);
}
