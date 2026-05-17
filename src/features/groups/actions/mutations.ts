'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { groupSchema } from '@/features/groups/schemas/group.schemas';
import { USER_ROLE } from '@/shared/lib/roles';
import { assertQuota } from '@/features/subscriptions/lib/quota';
import { revalidatePath } from 'next/cache';

async function getSessionUser() {
    const session = await auth();
    const slug = session?.user.institutionSlug;
    if (!slug) throw new Error('Unauthorized');
    const userRole = session?.user.userRoleName;
    if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.SUPER_ADMIN) {
        throw new Error('Forbidden');
    }
    return {
        slug,
        userId: session?.user.id,
        userEmail: session?.user.email,
        userRole,
        institutionId: session?.user.academicInstitutionId,
    };
}

export async function createGroup(data: unknown): Promise<void> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    const parsed = groupSchema.parse(data);

    await assertQuota(institutionId, 'group', userRole);

    const group = await prisma.group.create({
        data: { ...parsed, academicInstitutionId: institutionId ?? undefined },
        select: { id: true },
    });
    await logAudit({
        action: AUDIT_ACTION.GROUP_CREATE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Group',
        entityId: group.id,
    });
    revalidatePath(`/${slug}/groups`);
}

export async function updateGroup(id: string, data: unknown): Promise<void> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    const parsed = groupSchema.parse(data);
    await prisma.group.update({ where: { id }, data: parsed });
    await logAudit({
        action: AUDIT_ACTION.GROUP_UPDATE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Group',
        entityId: id,
    });
    revalidatePath(`/${slug}/groups`);
}

export async function deleteGroup(id: string): Promise<void> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    await prisma.group.delete({ where: { id } });
    await logAudit({
        action: AUDIT_ACTION.GROUP_DELETE,
        actorId: userId,
        actorEmail: userEmail,
        actorRole: userRole,
        academicInstitutionId: institutionId,
        entity: 'Group',
        entityId: id,
    });
    revalidatePath(`/${slug}/groups`);
    revalidatePath(`/${slug}/students`);
}
