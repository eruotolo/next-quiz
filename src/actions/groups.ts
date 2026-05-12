'use server';

import { prisma } from '@/lib/prisma';
import { groupSchema } from '@/schemas/group';
import { revalidatePath } from 'next/cache';

export async function createGroup(data: unknown): Promise<void> {
    const parsed = groupSchema.parse(data);
    await prisma.group.create({ data: parsed });
    revalidatePath('/admin/groups');
}

export async function updateGroup(id: string, data: unknown): Promise<void> {
    const parsed = groupSchema.parse(data);
    await prisma.group.update({ where: { id }, data: parsed });
    revalidatePath('/admin/groups');
}

export async function deleteGroup(id: string): Promise<void> {
    await prisma.group.delete({ where: { id } });
    revalidatePath('/admin/groups');
    revalidatePath('/admin/students');
}
