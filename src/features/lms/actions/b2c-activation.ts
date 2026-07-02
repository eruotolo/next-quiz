'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/shared/lib/prisma';
import { b2cActivatePasswordSchema } from '@/features/subscriptions/schemas/b2c-checkout.schemas';
import { createStudentAuthSession } from '@/features/exam-session/lib/session';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { getInstitutionFlags } from '@/features/auth/lib/institution-flags';

export interface ActivateResult {
    studentId: string;
    institutionSlug: string;
}

/**
 * Activa una cuenta B2C: valida el token, hashea la contraseña, marca el User
 * como activo, limpia los tokens, crea el `LmsEnrollment` (si el webhook aún
 * no lo hizo) y abre la sesión jose del estudiante.
 *
 * Idempotente: si el User ya está activo, solo actualiza la contraseña.
 */
export async function activateB2cAccount(
    data: unknown,
): Promise<{ data: ActivateResult | null; error: string | null }> {
    const parsed = b2cActivatePasswordSchema.safeParse(data);
    if (!parsed.success) {
        return { data: null, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
    }
    const { token, password } = parsed.data;

    const user = await prisma.user.findFirst({
        where: { activationToken: token },
        select: {
            id: true,
            email: true,
            academicInstitutionId: true,
            activationTokenExp: true,
        },
    });
    if (!user) return { data: null, error: 'Token inválido o expirado.' };
    if (!user.activationTokenExp || user.activationTokenExp < new Date()) {
        return {
            data: null,
            error: 'El enlace de activación expiró. Contactá a soporte para pedir uno nuevo.',
        };
    }
    if (!user.academicInstitutionId) {
        return { data: null, error: 'Tu cuenta no tiene una institución asociada.' };
    }

    const institution = await prisma.academicInstitution.findUnique({
        where: { id: user.academicInstitutionId },
        select: { id: true, slug: true, plan: true },
    });
    if (!institution) {
        return { data: null, error: 'Institución no encontrada.' };
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: user.id },
            data: {
                password: hashed,
                active: true,
                activationToken: null,
                activationTokenExp: null,
            },
        });

        // Vincular el User a las LmsOrder aprobadas que no tengan enrolledUserId.
        // (El webhook de Fase 5 ya habrá creado los LmsEnrollment cuando hay
        // un courseId; acá solo aseguramos el backref LmsOrder.enrolledUserId.)
        await tx.lmsOrder.updateMany({
            where: { enrolledUserId: null, status: 'APROBADO' },
            data: { enrolledUserId: user.id },
        });
    });

    await logAudit({
        action: AUDIT_ACTION.STUDENT_LOGIN_SUCCESS,
        actorId: user.id,
        actorEmail: user.email,
        actorRole: 'Estudiante',
        academicInstitutionId: institution.id,
        status: 'success',
        metadata: { source: 'b2c-activation' },
    });

    // Abrir sesión de estudiante para que aterrice en /students/dashboard ya logueado.
    const student = await prisma.user.findUnique({
        where: { id: user.id },
        select: { groupId: true },
    });
    if (student?.groupId) {
        await createStudentAuthSession({ studentId: user.id, groupId: student.groupId });
    }

    // Habilitación de flags (no bloqueante si falla).
    await getInstitutionFlags(institution.id, institution.plan).catch(() => null);

    return {
        data: { studentId: user.id, institutionSlug: institution.slug },
        error: null,
    };
}
