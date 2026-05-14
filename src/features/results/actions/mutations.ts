'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { revalidatePath } from 'next/cache';

export async function deleteResult(id: string): Promise<void> {
    const session = await auth();
    const slug = session?.user.institutionSlug;
    if (!slug) throw new Error('Unauthorized');
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
