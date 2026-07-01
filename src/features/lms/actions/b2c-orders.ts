'use server';

import { prisma } from '@/shared/lib/prisma';
import { normalizeRut } from '@/shared/lib/rut';
import { createPreference } from '@/features/subscriptions/lib/mercadopago';
import {
    b2cCheckoutSchema,
    type B2cCheckoutInput,
} from '@/features/subscriptions/schemas/b2c-checkout.schemas';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';

interface CheckoutResult {
    initPoint: string | null;
    orderId: string;
}

/**
 * Crea una `LmsOrder` en estado PENDIENTE y devuelve el `init_point` de
 * MercadoPago para redirigir al comprador. La matriculación real (crear
 * `User`, `LmsEnrollment`, token de activación, email) la dispara el
 * webhook `/api/webhooks/mercadopago-b2c` al confirmarse el pago.
 *
 * Acepta órdenes de curso individual (`kind=COURSE`) o de pack por categoría
 * (`kind=CATEGORY_BUNDLE`). El backend solo valida; la UI de checkout es la
 * responsable de elegir el `kind` correcto según el producto.
 */
export async function createLmsCheckoutPreference(
    slug: string,
    data: unknown,
): Promise<{ data: CheckoutResult | null; error: string | null }> {
    const parsed = b2cCheckoutSchema.safeParse(data);
    if (!parsed.success) {
        return { data: null, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
    }
    const input: B2cCheckoutInput = parsed.data;
    const rut = normalizeRut(input.studentRut);
    const email = input.studentEmail.toLowerCase();

    const inst = await prisma.academicInstitution.findUnique({
        where: { slug },
        select: { id: true, name: true, active: true },
    });
    if (!inst || !inst.active) {
        return { data: null, error: 'Institución no encontrada.' };
    }

    // Resolver el producto (curso o pack) y el monto a cobrar.
    let productTitle: string;
    let price: number;
    let kind: 'COURSE' | 'CATEGORY_BUNDLE';
    let courseId: string | null = null;
    let categoryId: string | null = null;

    if (input.kind === 'CATEGORY_BUNDLE') {
        if (!input.categoryId) {
            return { data: null, error: 'Falta el ID de categoría.' };
        }
        const category = await prisma.lmsCategory.findFirst({
            where: {
                id: input.categoryId,
                academicInstitutionId: inst.id,
                isBundle: true,
                isPublic: true,
                bundlePrice: { not: null },
            },
            select: {
                id: true,
                name: true,
                bundlePrice: true,
                _count: { select: { courses: true } },
            },
        });
        if (!category || category.bundlePrice === null) {
            return { data: null, error: 'Pack no disponible para inscripción.' };
        }
        if (category._count.courses === 0) {
            return {
                data: null,
                error: 'Este pack no tiene cursos asociados. Contactá al administrador.',
            };
        }
        productTitle = `Pack Completo: ${category.name}`;
        price = category.bundlePrice;
        kind = 'CATEGORY_BUNDLE';
        categoryId = category.id;
    } else {
        if (!input.courseId) {
            return { data: null, error: 'Falta el ID de curso.' };
        }
        const course = await prisma.lmsCourse.findFirst({
            where: {
                id: input.courseId,
                academicInstitutionId: inst.id,
                isPublic: true,
                published: true,
            },
            select: { id: true, title: true, price: true },
        });
        if (!course) {
            return { data: null, error: 'Curso no disponible para inscripción.' };
        }
        productTitle = course.title;
        price = course.price ?? 0;
        kind = 'COURSE';
        courseId = course.id;
    }

    if (price <= 0) {
        return {
            data: null,
            error: 'Este producto es gratuito. Inscribite desde la página del curso.',
        };
    }

    // Anti-IDOR: el RUT/email no debe pertenecer a otra institución.
    const existing = await prisma.user.findFirst({
        where: {
            OR: [{ rut }, { email }],
            academicInstitutionId: { not: inst.id },
        },
        select: { id: true },
    });
    if (existing) {
        return {
            data: null,
            error: 'Tu RUT o email ya está registrado en otra institución.',
        };
    }

    // Si ya compró este producto y está aprobado, error claro.
    const priorOrder = await prisma.lmsOrder.findFirst({
        where: {
            studentRut: rut,
            ...(kind === 'COURSE' ? { courseId } : { categoryId }),
            status: 'APROBADO',
        },
        select: { id: true },
    });
    if (priorOrder) {
        return {
            data: null,
            error: 'Ya compraste este producto. Revisá tu email para activar la cuenta.',
        };
    }

    const order = await prisma.lmsOrder.create({
        data: {
            studentRut: rut,
            studentName: input.studentName.trim(),
            studentLastname: input.studentLastname.trim(),
            studentEmail: email,
            kind,
            courseId,
            categoryId,
            amount: price,
            status: 'PENDIENTE',
        },
        select: { id: true },
    });

    // BackURLs: distinguimos entre curso y pack para volver al lugar correcto.
    const backUrlBase = process.env.MP_BACK_URL_BASE ?? 'https://www.aulika.cl';
    const backPath =
        kind === 'COURSE' && courseId
            ? `/checkout/${courseId}/exito?order=${order.id}`
            : `/checkout/category/${categoryId}/exito?order=${order.id}`;
    const backUrl = `${backUrlBase}/${slug}${backPath}`;

    try {
        const { initPoint, preferenceId } = await createPreference({
            item: {
                title: `${productTitle} · ${inst.name}`,
                unitPrice: price,
            },
            payerEmail: email,
            payerName: input.studentName.trim(),
            payerSurname: input.studentLastname.trim(),
            externalReference: order.id,
            backUrls: {
                success: `${backUrl}&status=approved`,
                pending: `${backUrl}&status=pending`,
                failure: `${backUrl}&status=rejected`,
            },
        });

        await prisma.lmsOrder.update({
            where: { id: order.id },
            data: { mpPreferenceId: preferenceId },
        });

        await logAudit({
            action: AUDIT_ACTION.SUBSCRIPTION_CREATE,
            actorEmail: email,
            actorRole: 'Estudiante',
            academicInstitutionId: inst.id,
            entity: 'LmsOrder',
            entityId: order.id,
            metadata: { kind, courseId, categoryId, slug, source: 'b2c-checkout' },
        });

        return { data: { initPoint, orderId: order.id }, error: null };
    } catch (err) {
        // Si MP falla, marcamos la orden como RECHAZADO para no dejar PENDIENTE huérfana.
        await prisma.lmsOrder.update({
            where: { id: order.id },
            data: { status: 'RECHAZADO' },
        });
        const msg = err instanceof Error ? err.message : 'No se pudo iniciar el pago.';
        return { data: null, error: msg };
    }
}

/**
 * Estado público de una orden B2C (sin auth: la URL ya trae el `orderId`).
 * Lo consume el `OrderStatusPoller` en la pantalla de éxito.
 */
export interface LmsOrderStatus {
    status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    activationToken: string | null;
    activationTokenExp: Date | null;
    productTitle: string;
    courseId: string | null;
    categoryId: string | null;
    studentEmail: string;
}

export async function getLmsOrderStatus(
    orderId: string,
): Promise<{ data: LmsOrderStatus | null; error: string | null }> {
    const order = await prisma.lmsOrder.findUnique({
        where: { id: orderId },
        select: {
            status: true,
            studentEmail: true,
            kind: true,
            courseId: true,
            categoryId: true,
            course: { select: { title: true } },
            category: { select: { name: true } },
            enrolledUserId: true,
        },
    });
    if (!order) return { data: null, error: 'Orden no encontrada.' };

    let activationToken: string | null = null;
    let activationTokenExp: Date | null = null;
    if (order.enrolledUserId) {
        const user = await prisma.user.findUnique({
            where: { id: order.enrolledUserId },
            select: { activationToken: true, activationTokenExp: true },
        });
        activationToken = user?.activationToken ?? null;
        activationTokenExp = user?.activationTokenExp ?? null;
    }

    const productTitle =
        order.kind === 'CATEGORY_BUNDLE'
            ? order.category
                ? `Pack Completo: ${order.category.name}`
                : 'Pack'
            : (order.course?.title ?? 'Curso');

    return {
        data: {
            status: order.status,
            activationToken,
            activationTokenExp,
            productTitle,
            courseId: order.courseId,
            categoryId: order.categoryId,
            studentEmail: order.studentEmail,
        },
        error: null,
    };
}