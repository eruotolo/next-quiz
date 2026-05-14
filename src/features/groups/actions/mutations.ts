'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { groupSchema } from '@/features/groups/schemas/group.schemas';
import { revalidatePath } from 'next/cache';

async function getSessionUser() {
    const session = await auth();
    const slug = session?.user.institutionSlug;
    if (!slug) throw new Error('Unauthorized');
    return {
        slug,
        userId: session!.user.id,
        userEmail: session!.user.email,
        userRole: session!.user.userRoleName,
        institutionId: session!.user.academicInstitutionId,
    };
}

export async function createGroup(data: unknown): Promise<void> {
    const { slug, userId, userEmail, userRole, institutionId } = await getSessionUser();
    const parsed = groupSchema.parse(data);
    const group = await prisma.group.create({ data: parsed, select: { id: true } });
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
