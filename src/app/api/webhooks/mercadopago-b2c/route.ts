import { type NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/shared/lib/prisma';
import { verifyWebhookSignature } from '@/features/subscriptions/lib/mercadopago';
import { USER_ROLE } from '@/shared/lib/roles';
import {
    buildStudentActivationEmail,
    sendEmail,
} from '@/shared/lib/email';

async function saveWebhookEvent(
    topic: string,
    externalId: string,
    rawPayload: unknown,
): Promise<string> {
    const event = await prisma.webhookEvent.create({
        data: { topic, externalId, rawPayload: rawPayload as never },
        select: { id: true },
    });
    return event.id;
}

async function markEventProcessed(id: string, error?: string): Promise<void> {
    await prisma.webhookEvent.update({
        where: { id },
        data: { processed: !error, error: error ?? null },
    });
}

interface PaymentPayload {
    status?: string;
    external_reference?: string;
    preference_id?: string;
    transaction_amount?: number;
    currency_id?: string;
    date_approved?: string;
}

interface FulfillmentResult {
    studentName: string;
    studentEmail: string;
    courseTitle: string;
    activationToken: string;
}

/**
 * Procesa un pago aprobado de un curso B2C. Ejecuta la matriculación atómica:
 * upsert del `User` (con token de activación, sin password), upsert del
 * `LmsEnrollment` (ACTIVO) y aprobación de la `LmsOrder`. Idempotente: si la
 * orden ya está APROBADO, no hace nada.
 */
async function fulfillB2cOrder(orderId: string, mpPaymentId: string): Promise<FulfillmentResult | null> {
    const tokenWindow = 24 * 60 * 60 * 1000;

    return prisma.$transaction(async (tx) => {
        const order = await tx.lmsOrder.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                courseId: true,
                studentRut: true,
                studentName: true,
                studentLastname: true,
                studentEmail: true,
            },
        });
        if (!order || order.status === 'APROBADO') return null;

        const course = await tx.lmsCourse.findUnique({
            where: { id: order.courseId },
            select: { title: true, academicInstitutionId: true },
        });
        if (!course?.academicInstitutionId) {
            throw new Error('Curso sin institución asociada');
        }

        const studentRole = await tx.userRole.findUniqueOrThrow({
            where: { name: USER_ROLE.STUDENT },
            select: { id: true },
        });

        const activationToken = randomBytes(32).toString('hex');
        const activationTokenExp = new Date(Date.now() + tokenWindow);

        // Upsert por RUT. El usuario queda sin password hasta activar; si ya
        // existía (alumno interno), refrescamos su token de activación.
        const user = await tx.user.upsert({
            where: { rut: order.studentRut },
            update: { activationToken, activationTokenExp },
            create: {
                name: order.studentName,
                lastname: order.studentLastname,
                email: order.studentEmail,
                rut: order.studentRut,
                password: null,
                userRoleId: studentRole.id,
                academicInstitutionId: course.academicInstitutionId,
                activationToken,
                activationTokenExp,
            },
            select: { id: true },
        });

        const enrollment = await tx.lmsEnrollment.upsert({
            where: { userId_courseId: { userId: user.id, courseId: order.courseId } },
            update: { status: 'ACTIVO' },
            create: { userId: user.id, courseId: order.courseId, status: 'ACTIVO' },
            select: { id: true },
        });

        await tx.lmsOrder.update({
            where: { id: orderId },
            data: {
                status: 'APROBADO',
                mpPaymentId,
                enrolledUserId: user.id,
                enrollmentId: enrollment.id,
            },
        });

        return {
            studentName: order.studentName,
            studentEmail: order.studentEmail,
            courseTitle: course.title,
            activationToken,
        };
    });
}

async function handleB2cPayment(dataId: string, token: string): Promise<void> {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!mpRes.ok) return;

    const payment = (await mpRes.json()) as PaymentPayload;
    const orderId = payment.external_reference;
    if (!orderId) return;

    if (payment.status !== 'approved') {
        // Pagos no aprobados: marcamos la orden como RECHAZADO para trazabilidad.
        const rejected = payment.status === 'rejected' || payment.status === 'cancelled';
        if (rejected) {
            await prisma.lmsOrder.updateMany({
                where: { id: orderId, status: 'PENDIENTE' },
                data: { status: 'RECHAZADO' },
            });
        }
        return;
    }

    const fulfillment = await fulfillB2cOrder(orderId, dataId);
    if (!fulfillment) return;

    // Email fuera de la transacción (best-effort): no debe fallar el webhook.
    const baseUrl = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://aulika.cl';
    const activationUrl = `${baseUrl}/examen/activar?token=${fulfillment.activationToken}`;
    void sendEmail({
        to: fulfillment.studentEmail,
        toName: fulfillment.studentName,
        subject: 'Bienvenido/a a Aulika — Activá tu cuenta',
        htmlContent: buildStudentActivationEmail(
            fulfillment.studentName,
            fulfillment.courseTitle,
            activationUrl,
        ),
    }).catch((err) => {
        console.error('[Brevo] activation email failed:', err);
    });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const rawBody = await req.text();
        const xSignature = req.headers.get('x-signature') ?? '';
        const xRequestId = req.headers.get('x-request-id') ?? '';

        let payload: { type?: string; data?: { id?: string } };
        try {
            payload = JSON.parse(rawBody) as typeof payload;
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const dataId = payload.data?.id ?? '';
        const topic = payload.type ?? req.nextUrl.searchParams.get('type') ?? '';

        if (!verifyWebhookSignature(rawBody, xSignature, xRequestId, dataId)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Solo procesamos notificaciones de pago (pago único de una preference).
        if (topic !== 'payment') {
            return NextResponse.json({ received: true });
        }

        if (!dataId) {
            return NextResponse.json({ error: 'Missing data.id' }, { status: 400 });
        }

        const token = process.env.MP_ACCESS_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'MP not configured' }, { status: 500 });
        }

        const eventId = await saveWebhookEvent('b2c_payment', dataId, payload);

        try {
            await handleB2cPayment(dataId, token);
            await markEventProcessed(eventId);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            await markEventProcessed(eventId, msg);
        }

        return NextResponse.json({ received: true });
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
