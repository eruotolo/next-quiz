import { headers } from 'next/headers';
import { prisma } from '@/shared/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface AuditInput {
    action: string;
    status?: 'success' | 'failure';
    actorId?: string | null;
    actorEmail?: string | null;
    actorRole?: string | null;
    academicInstitutionId?: string | null;
    entity?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown> | null;
}

export async function logAudit(input: AuditInput): Promise<void> {
    try {
        const h = await headers();
        const ip =
            h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            h.get('x-real-ip') ??
            null;
        const userAgent = h.get('user-agent') ?? null;

        await prisma.auditLog.create({
            data: {
                action: input.action,
                status: input.status ?? 'success',
                actorId: input.actorId ?? null,
                actorEmail: input.actorEmail ?? null,
                actorRole: input.actorRole ?? null,
                academicInstitutionId: input.academicInstitutionId ?? null,
                entity: input.entity ?? null,
                entityId: input.entityId ?? null,
                ip,
                userAgent,
                metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
            },
        });
    } catch {
        // never break the originating action because of a logging failure
    }
}
