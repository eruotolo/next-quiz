'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { groupSchema } from '@/features/groups/schemas/group.schemas';
import { revalidatePath } from 'next/cache';

async function getSlug(): Promise<string> {
    const session = await auth();
    const slug = session?.user.institutionSlug;
    if (!slug) throw new Error('Unauthorized');
    return slug;
}

export async function createGroup(data: unknown): Promise<void> {
    const slug = await getSlug();
    const parsed = groupSchema.parse(data);
    await prisma.group.create({ data: parsed });
    revalidatePath(`/${slug}/groups`);
}

export async function updateGroup(id: string, data: unknown): Promise<void> {
    const slug = await getSlug();
    const parsed = groupSchema.parse(data);
    await prisma.group.update({ where: { id }, data: parsed });
    revalidatePath(`/${slug}/groups`);
}

export async function deleteGroup(id: string): Promise<void> {
    const slug = await getSlug();
    await prisma.group.delete({ where: { id } });
    revalidatePath(`/${slug}/groups`);
    revalidatePath(`/${slug}/students`);
}
