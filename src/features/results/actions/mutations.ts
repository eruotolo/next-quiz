'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteResult(id: string): Promise<void> {
    const session = await auth();
    const slug = session?.user.institutionSlug;
    if (!slug) throw new Error('Unauthorized');
    await prisma.result.delete({ where: { id } });
    revalidatePath(`/${slug}/results`);
    revalidatePath(`/${slug}/liveresults`);
}
