'use server';

import type { ChatRateLimitState } from '@/features/lms/lib/live-chat';
import { cleanChatContent, evaluateChatRateLimit } from '@/features/lms/lib/live-chat';
import {
    type ActionResult,
    fail,
    ok,
    toActionError,
} from '@/shared/types/action';
import {
    listLiveChatSchema,
    sendLiveChatSchema,
} from '@/features/lms/schemas/lms-phase6-live.schemas';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { revalidatePath } from 'next/cache';

interface RateLimitStoreEntry {
    state: ChatRateLimitState;
    expiresAt: number;
}

const RATE_LIMIT_TTL_MS = 30 * 60_000;
const rateLimitStore = new Map<string, RateLimitStoreEntry>();

function readRateLimitState(userId: string, sessionId: string): ChatRateLimitState {
    const key = `${userId}::${sessionId}`;
    const entry = rateLimitStore.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
        return { lastSentAt: null, windowStart: 0, windowCount: 0 };
    }
    return entry.state;
}

function writeRateLimitState(
    userId: string,
    sessionId: string,
    state: ChatRateLimitState,
): void {
    const key = `${userId}::${sessionId}`;
    rateLimitStore.set(key, { state, expiresAt: Date.now() + RATE_LIMIT_TTL_MS });
}

export interface PublicLiveChatMessage {
    id: string;
    userId: string;
    userName: string;
    role: string;
    content: string;
    sentAt: Date;
}

export async function sendLiveChatMessage(
    rawInput: unknown,
): Promise<ActionResult<{ id: string }>> {
    const parsed = sendLiveChatSchema.safeParse(rawInput);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');
    const data = parsed.data;

    const { auth } = await import('@/features/auth/auth');
    const session = await auth();
    if (!session?.user?.id) return fail('No autenticado');
    const userId = session.user.id;

    const liveSession = await prisma.lmsLiveSession.findUnique({
        where: { id: data.sessionId },
        select: {
            id: true,
            status: true,
            course: { select: { academicInstitutionId: true } },
        },
    });
    if (!liveSession) return fail('Sesión no encontrada');
    if (liveSession.status === 'CANCELED' || liveSession.status === 'ENDED') {
        return fail('La sesión no acepta mensajes');
    }

    const userRoleName = session.user.userRoleName;
    let allowed = userRoleName === USER_ROLE.SUPER_ADMIN;
    if (!allowed) {
        const membership = await prisma.user.findUnique({
            where: { id: userId },
            select: { academicInstitutionId: true },
        });
        if (
            (userRoleName === USER_ROLE.ADMIN || userRoleName === USER_ROLE.PROFESOR) &&
            membership?.academicInstitutionId === liveSession.course.academicInstitutionId
        ) {
            allowed = true;
        } else if (userRoleName === USER_ROLE.STUDENT) {
            const enrollment = await prisma.lmsEnrollment.findFirst({
                where: { userId },
                select: { courseId: true },
            });
            const session = await prisma.lmsLiveSession.findUnique({
                where: { id: data.sessionId },
                select: { courseId: true },
            });
            if (enrollment && session && enrollment.courseId === session.courseId) {
                allowed = true;
            }
        }
    }
    if (!allowed) return fail('No autorizado');

    const cleaned = cleanChatContent({ content: data.content });
    if (!cleaned.ok) {
        return fail(
            cleaned.reason === 'empty'
                ? 'Mensaje vacío'
                : cleaned.reason === 'too_long'
                    ? 'Mensaje demasiado largo'
                    : 'Mensaje no permitido',
        );
    }

    const current = readRateLimitState(userId, data.sessionId);
    const evaluation = evaluateChatRateLimit(current, Date.now());
    if (!evaluation.allowed) {
        return fail(
            evaluation.reason === 'too_fast'
                ? 'Esperá un momento antes de enviar otro mensaje'
                : 'Estás enviando mensajes demasiado rápido',
        );
    }
    writeRateLimitState(userId, data.sessionId, evaluation.nextState);

    try {
        const message = await prisma.lmsLiveChatMessage.create({
            data: {
                sessionId: data.sessionId,
                userId,
                content: cleaned.content,
            },
        });
        revalidatePath(`/aula/clases/${data.sessionId}`);
        return ok({ id: message.id });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo enviar el mensaje'));
    }
}

export async function listLiveChatMessages(
    rawInput: unknown,
): Promise<ActionResult<{ messages: PublicLiveChatMessage[]; nextCursor: Date | null }>> {
    const parsed = listLiveChatSchema.safeParse(rawInput);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');
    const data = parsed.data;
    const since = data.since ?? null;

    const messages = await prisma.lmsLiveChatMessage.findMany({
        where: {
            sessionId: data.sessionId,
            deletedAt: null,
            ...(since ? { sentAt: { gt: since } } : {}),
        },
        orderBy: { sentAt: 'asc' },
        take: 200,
        select: {
            id: true,
            userId: true,
            content: true,
            sentAt: true,
            user: { select: { name: true, email: true, userRole: { select: { name: true } } } },
        },
    });

    const publicMessages: PublicLiveChatMessage[] = messages.map((m) => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name ?? m.user.email,
        role: m.user.userRole?.name ?? 'Estudiante',
        content: m.content,
        sentAt: m.sentAt,
    }));

    const nextCursor = publicMessages.length > 0
        ? publicMessages[publicMessages.length - 1]!.sentAt
        : since;
    return ok({ messages: publicMessages, nextCursor });
}
