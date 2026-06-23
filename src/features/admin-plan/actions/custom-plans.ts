'use server';

import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { requireSuperAdmin } from '@/features/auth/lib/auth-guard';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

const customPlanSchema = z.object({
    name: z.string().min(2, 'Nombre requerido').max(100),
    maxGroups: z.number().int().positive().nullable(),
    maxAdmins: z.number().int().positive().nullable(),
    maxProfessors: z.number().int().positive().nullable(),
    maxStudents: z.number().int().positive().nullable(),
    maxExamsPerYear: z.number().int().positive().nullable(),
    description: z.string().max(200).optional().or(z.literal('')),
});

interface NormalizedCustomPlan {
    name: string;
    maxGroups: number | null;
    maxAdmins: number | null;
    maxProfessors: number | null;
    maxStudents: number | null;
    maxExamsPerYear: number | null;
    description: string | null;
}

function normalize(data: z.infer<typeof customPlanSchema>): NormalizedCustomPlan {
    return {
        name: data.name,
        maxGroups: data.maxGroups,
        maxAdmins: data.maxAdmins,
        maxProfessors: data.maxProfessors,
        maxStudents: data.maxStudents,
        maxExamsPerYear: data.maxExamsPerYear,
        description: data.description && data.description !== '' ? data.description : null,
    };
}

export async function createCustomPlan(data: unknown): Promise<ActionResult<{ id: string }>> {
    try {
        await requireSuperAdmin();
        const parsed = customPlanSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const created = await prisma.customPlan.create({
            data: normalize(parsed.data),
            select: { id: true },
        });
        revalidatePath('/config/plan-limits');
        return ok({ id: created.id });
    } catch (err) {
        return fail(toActionError(err, 'Error al crear el plan interno.'));
    }
}

export async function updateCustomPlan(id: string, data: unknown): Promise<ActionResult> {
    try {
        await requireSuperAdmin();
        const parsed = customPlanSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

        const res = await prisma.customPlan.updateMany({
            where: { id },
            data: normalize(parsed.data),
        });
        if (res.count === 0) return fail('Plan interno no encontrado.');

        revalidatePath('/config/plan-limits');
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al actualizar el plan interno.'));
    }
}

export async function deleteCustomPlan(id: string): Promise<ActionResult> {
    try {
        await requireSuperAdmin();
        // onDelete: SetNull desvincula automáticamente a las instituciones que lo usaban.
        const res = await prisma.customPlan.deleteMany({ where: { id } });
        if (res.count === 0) return fail('Plan interno no encontrado.');

        revalidatePath('/config/plan-limits');
        revalidatePath('/config/institutions');
        return ok(null);
    } catch (err) {
        return fail(toActionError(err, 'Error al eliminar el plan interno.'));
    }
}
