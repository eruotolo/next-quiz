'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteResult(id: string): Promise<void> {
    await prisma.result.delete({ where: { id } });
    revalidatePath('/admin/results');
    revalidatePath('/admin/liveresults');
}
