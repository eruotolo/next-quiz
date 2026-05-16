'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { USER_ROLE } from '@/shared/lib/roles';
import { revalidatePath } from 'next/cache';

export async function deleteResult(slug: string, id: string): Promise<void> {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    if (!isSuperAdmin) {
        const sessionSlug = session.user.institutionSlug;
        if (!sessionSlug || sessionSlug !== slug) throw new Error('Unauthorized');
    }
    await prisma.result.delete({ where: { id } });
    await logAudit({
        action: AUDIT_ACTION.RESULT_DELETE,
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorRole: session.user.userRoleName,
        academicInstitutionId: session.user.academicInstitutionId,
        entity: 'Result',
        entityId: id,
    });
    revalidatePath(`/${slug}/results`);
    revalidatePath(`/${slug}/liveresults`);
}
