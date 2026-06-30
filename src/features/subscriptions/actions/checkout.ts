'use server';

import { prisma } from '@/shared/lib/prisma';
import { normalizeRut } from '@/shared/lib/rut';
import { createPreference } from '@/features/subscriptions/lib/mercadopago';
import { b2cCheckoutSchema } from '@/features/subscriptions/schemas/b2c-checkout.schemas';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';

export interface LmsCheckoutResult {
    orderId: string;
    initPoint: string | null;
}

/**
 * Procesa el pre-checkout B2C de un curso público: valida los datos del
 * estudiante, comprueba que el curso sea vendible (público, publicado, con
 * precio y LMS habilitado en la institución), verifica que el RUT no esté
 * asociado a otra institución ni ya matriculado, crea una `LmsOrder` PENDIENTE
 * y devuelve el `init_point` de MercadoPago (pago único).
 *
 * La matriculación atómica (creación de usuario inactivo + enrollment + token
 * de activación) ocurre en el webhook `/api/webhooks/mercadopago-b2c` al
 * aprobarse el pago.
 */
export async function createLmsCheckoutPreference(
    slug: string,
    rawInput: unknown,
): Promise<ActionResult<LmsCheckoutResult>> {
    try {
        const parsed = b2cCheckoutSchema.safeParse(rawInput);
        if (!parsed.success) return fail('Datos inválidos. Revisa el formulario.');
        const input = parsed.data;
        const studentRut = normalizeRut(input.studentRut);
        const studentEmail = input.studentEmail.toLowerCase();

        const institution = await prisma.academicInstitution.findUnique({
            where: { slug },
            select: { id: true, lmsEnabled: true },
        });
        if (!institution) return fail('Institución no encontrada.');
        if (!institution.lmsEnabled) return fail('Esta institución no ofrece cursos públicos.');

        const course = await prisma.lmsCourse.findFirst({
            where: {
                id: input.courseId,
                academicInstitutionId: institution.id,
                isPublic: true,
                published: true,
            },
            select: { id: true, title: true, price: true },
        });
        if (!course) return fail('El curso no está disponible para compra.');
        const amount = course.price ?? 0;
        if (amount <= 0) return fail('Este curso es gratuito, no requiere compra.');

        // Anti-abuso: si el RUT ya es usuario de OTRA institución, bloquear.
        const existingUser = await prisma.user.findUnique({
            where: { rut: studentRut },
            select: { id: true, academicInstitutionId: true },
        });
        if (existingUser && existingUser.academicInstitutionId !== institution.id) {
            return fail('Ya tienes una cuenta asociada a otra institución.');
        }

        // Ya matriculado (activo o completado) en este curso.
        if (existingUser) {
            const enrolled = await prisma.lmsEnrollment.findFirst({
                where: {
                    userId: existingUser.id,
                    courseId: course.id,
                    status: { in: ['ACTIVO', 'COMPLETADO'] },
                },
                select: { id: true },
            });
            if (enrolled) return fail('Ya estás inscrito en este curso.');
        }

        // Orden aprobada previa para el mismo (curso, RUT).
        const priorOrder = await prisma.lmsOrder.findFirst({
            where: { courseId: course.id, studentRut, status: 'APROBADO' },
            select: { id: true },
        });
        if (priorOrder) return fail('Ya tienes una compra aprobada para este curso.');

        const order = await prisma.lmsOrder.create({
            data: {
                studentRut,
                studentName: input.studentName,
                studentLastname: input.studentLastname,
                studentEmail,
                courseId: course.id,
                amount,
                status: 'PENDIENTE',
            },
            select: { id: true },
        });

        const backUrlBase = process.env.MP_BACK_URL_BASE ?? 'https://www.aulika.cl';
        const orderBackUrl = `${backUrlBase}/${slug}/checkout/${course.id}?order=${order.id}`;
        const { preferenceId, initPoint } = await createPreference({
            item: { title: course.title, unitPrice: amount },
            payerEmail: studentEmail,
            payerName: input.studentName,
            payerSurname: input.studentLastname,
            externalReference: order.id,
            backUrls: {
                success: `${orderBackUrl}&status=ok`,
                pending: `${orderBackUrl}&status=pending`,
                failure: `${orderBackUrl}&status=fail`,
            },
            notificationUrl: `${backUrlBase}/api/webhooks/mercadopago-b2c`,
        });

        await prisma.lmsOrder.update({
            where: { id: order.id },
            data: { mpPreferenceId: preferenceId },
        });

        return ok({ orderId: order.id, initPoint });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo iniciar el pago. Intenta de nuevo.'));
    }
}
