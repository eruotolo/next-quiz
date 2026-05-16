'use server';

import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { logAudit } from '@/shared/lib/audit';
import { USER_ROLE } from '@/shared/lib/roles';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { institutionSettingsSchema } from '@/features/institutions/schemas/institution.schemas';
import { revalidatePath } from 'next/cache';

export async function updateInstitutionSettings(
    slug: string,
    data: unknown,
): Promise<{ data: null; error: string | null }> {
    const session = await auth();
    if (!session?.user) return { data: null, error: 'No autorizado' };

    const isSuperAdmin = session.user.userRoleName === USER_ROLE.SUPER_ADMIN;
    const isAdmin = session.user.userRoleName === USER_ROLE.ADMIN;

    if (!isSuperAdmin && !isAdmin) return { data: null, error: 'Sin permisos' };
    if (isAdmin && session.user.institutionSlug !== slug) return { data: null, error: 'Sin permisos' };

    const parsed = institutionSettingsSchema.safeParse(data);
    if (!parsed.success) return { data: null, error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    const { email, ...rest } = parsed.data;

    try {
        const institution = await prisma.academicInstitution.update({
            where: { slug },
            data: {
                ...rest,
                email: email === '' ? null : (email ?? null),
            },
            select: { id: true },
        });

        await logAudit({
            action: AUDIT_ACTION.INSTITUTION_UPDATE,
            actorId: session.user.id,
            actorEmail: session.user.email ?? '',
            actorRole: session.user.userRoleName,
            entity: 'AcademicInstitution',
            entityId: institution.id,
        });

        revalidatePath(`/${slug}/settings`);
        return { data: null, error: null };
    } catch (err) {
        const msg =
            err instanceof Error && err.message.includes('Unique')
                ? 'El nombre ya está en uso por otra institución.'
                : 'Error al guardar la configuración.';
        return { data: null, error: msg };
    }
}
