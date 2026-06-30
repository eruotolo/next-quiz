'use server';

import { revalidatePath } from 'next/cache';
import { randomBytes } from 'node:crypto';
import type {
    LiveAttendanceRole,
    LiveSessionStatus,
} from '@prisma/client';
import { USER_ROLE } from '@/shared/lib/roles';
import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import {
    type ActionResult,
    fail,
    ok,
    toActionError,
} from '@/shared/types/action';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { logAudit } from '@/shared/lib/audit';
import {
    buildDailyRoomName,
    canTransition,
    computeJoinWindow,
    isValidDailyRoomName,
} from '@/features/lms/lib/live-session-state';
import { notifyLiveSessionScheduledBackground } from '@/features/lms/lib/live-notifications';
import {
    createDailyMeetingToken,
    createDailyRoom,
    deleteDailyRoom,
    startDailyRecording,
} from '@/shared/lib/daily';
import {
    createLiveSessionSchema,
    endLiveSessionSchema,
    joinLiveSessionSchema,
    leaveLiveSessionSchema,
    liveSessionIdSchema,
    cancelLiveSessionSchema,
    startLiveSessionSchema,
    updateLiveSessionSchema,
    type CreateLiveSessionInput,
    type JoinLiveSessionInput,
} from '@/features/lms/schemas/lms-phase6-live.schemas';

type LiveSessionRole = (typeof USER_ROLE)['ADMIN' | 'PROFESOR' | 'SUPER_ADMIN'];

async function requireLiveManager(slug: string): Promise<{
    userId: string;
    userEmail: string;
    userRole: string;
    institutionId: string;
}> {
    const allowed: LiveSessionRole[] = [
        USER_ROLE.ADMIN,
        USER_ROLE.PROFESOR,
        USER_ROLE.SUPER_ADMIN,
    ];
    const ctx = await requireInstitutionAccess(slug, allowed);
    return {
        userId: ctx.userId,
        userEmail: ctx.userEmail,
        userRole: ctx.userRole,
        institutionId: ctx.institutionId,
    };
}

async function assertCourseBelongsToInstitution(
    courseId: string,
    institutionId: string,
    userId: string,
    userRole: string,
): Promise<void> {
    const course = await prisma.lmsCourse.findUnique({
        where: { id: courseId },
        select: {
            id: true,
            academicInstitutionId: true,
            createdById: true,
            courseSectionId: true,
        },
    });
    if (!course) throw new Error('Curso no encontrado');

    if (userRole === USER_ROLE.SUPER_ADMIN) return;

    if (course.academicInstitutionId !== institutionId) {
        throw new Error('El curso pertenece a otra institución');
    }

    if (userRole === USER_ROLE.PROFESOR && course.createdById && course.createdById !== userId) {
        const teaching = course.courseSectionId
            ? await prisma.courseSection.findFirst({
                  where: {
                      id: course.courseSectionId,
                      professors: { some: { id: userId } },
                  },
                  select: { id: true },
              })
            : null;
        if (!teaching) {
            throw new Error('No tiene acceso a este curso');
        }
    }
}

async function assertSessionEditableByManager(
    sessionId: string,
    institutionId: string,
    userId: string,
    userRole: string,
): Promise<NonNullable<Awaited<ReturnType<typeof prisma.lmsLiveSession.findUnique>>>> {
    const session = await prisma.lmsLiveSession.findUnique({
        where: { id: sessionId },
        include: { course: { select: { academicInstitutionId: true, createdById: true } } },
    });
    if (!session) throw new Error('Sesión no encontrada');

    if (userRole === USER_ROLE.SUPER_ADMIN) return session;
    if (session.course.academicInstitutionId !== institutionId) {
        throw new Error('La sesión pertenece a otra institución');
    }
    if (userRole === USER_ROLE.PROFESOR && session.createdById !== userId) {
        throw new Error('No puede editar sesiones de otros profesores');
    }
    return session;
}

function computeRoomExpiration(scheduledAt: Date, durationMin: number): Date {
    return new Date(scheduledAt.getTime() + (durationMin + 30) * 60_000);
}

export async function createLiveSession(
    slug: string,
    input: CreateLiveSessionInput,
): Promise<ActionResult<{ id: string }>> {
    const parsed = createLiveSessionSchema.safeParse(input);
    if (!parsed.success) {
        return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');
    }
    const data = parsed.data;

    const manager = await requireLiveManager(slug).catch(() => null);
    if (!manager) return fail('No autorizado');

    try {
        await assertCourseBelongsToInstitution(
            data.courseId,
            manager.institutionId,
            manager.userId,
            manager.userRole,
        );

        const roomExpiresAt = computeRoomExpiration(data.scheduledAt, data.durationMin);
        const roomName = buildDailyRoomName({
            courseId: data.courseId,
            scheduledAt: data.scheduledAt,
            randomSuffix: () => randomBytes(4).toString('hex'),
        });
        if (!isValidDailyRoomName(roomName)) {
            return fail('No se pudo generar un nombre válido para la sala');
        }

        const roomResult = await createDailyRoom({
            name: roomName,
            expiresAt: roomExpiresAt,
            maxParticipants: data.maxParticipants ?? undefined,
        });
        if (!roomResult.ok) return fail(roomResult.error);

        const session = await prisma.lmsLiveSession.create({
            data: {
                courseId: data.courseId,
                title: data.title,
                description: data.description,
                scheduledAt: data.scheduledAt,
                durationMin: data.durationMin,
                dailyRoomName: roomName,
                dailyRoomUrl: roomResult.room.url,
                dailyRoomExpiresAt: roomExpiresAt,
                maxParticipants: data.maxParticipants ?? null,
                createdById: manager.userId,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.LMS_LIVE_SESSION_CREATE,
            actorId: manager.userId,
            actorEmail: manager.userEmail,
            actorRole: manager.userRole,
            academicInstitutionId: manager.institutionId,
            entity: 'LmsLiveSession',
            entityId: session.id,
            metadata: { title: session.title, scheduledAt: session.scheduledAt.toISOString() },
        });
        notifyLiveSessionScheduledBackground({
            sessionId: session.id,
            courseId: data.courseId,
        });
        revalidatePath(`/${slug}/aula/${data.courseId}/clases`);
        return ok({ id: session.id });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo crear la sesión en vivo'));
    }
}

export async function updateLiveSession(
    slug: string,
    input: unknown,
): Promise<ActionResult<{ id: string }>> {
    const parsed = updateLiveSessionSchema.safeParse(input);
    if (!parsed.success) {
        return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');
    }
    const data = parsed.data;
    const manager = await requireLiveManager(slug).catch(() => null);
    if (!manager) return fail('No autorizado');

    try {
        const session = await assertSessionEditableByManager(
            data.sessionId,
            manager.institutionId,
            manager.userId,
            manager.userRole,
        );

        if (session.status !== 'SCHEDULED') {
            return fail('Solo se pueden editar sesiones aún no iniciadas');
        }

        const nextScheduledAt = data.scheduledAt ?? session.scheduledAt;
        const nextDuration = data.durationMin ?? session.durationMin;
        const nextExpiresAt = computeRoomExpiration(nextScheduledAt, nextDuration);

        await prisma.lmsLiveSession.update({
            where: { id: session.id },
            data: {
                title: data.title ?? session.title,
                description: data.description ?? session.description,
                scheduledAt: nextScheduledAt,
                durationMin: nextDuration,
                maxParticipants: data.maxParticipants === undefined ? undefined : data.maxParticipants,
                dailyRoomExpiresAt: nextExpiresAt,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.LMS_LIVE_SESSION_UPDATE,
            actorId: manager.userId,
            actorEmail: manager.userEmail,
            actorRole: manager.userRole,
            academicInstitutionId: manager.institutionId,
            entity: 'LmsLiveSession',
            entityId: session.id,
        });
        revalidatePath(`/${slug}/aula/${session.courseId}/clases`);
        return ok({ id: session.id });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo actualizar la sesión'));
    }
}

export async function cancelLiveSession(
    slug: string,
    input: unknown,
): Promise<ActionResult<{ id: string; canceled: true }>> {
    const parsed = cancelLiveSessionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');
    const manager = await requireLiveManager(slug).catch(() => null);
    if (!manager) return fail('No autorizado');

    try {
        const session = await assertSessionEditableByManager(
            parsed.data.sessionId,
            manager.institutionId,
            manager.userId,
            manager.userRole,
        );

        if (!canTransition(session.status, 'CANCELED')) {
            return fail('La sesión ya no puede cancelarse');
        }

        await prisma.$transaction(async (tx) => {
            await tx.lmsLiveSession.update({
                where: { id: session.id },
                data: { status: 'CANCELED' as LiveSessionStatus, endedAt: new Date() },
            });
            await tx.lmsLiveAttendance.updateMany({
                where: { sessionId: session.id, leftAt: null },
                data: { leftAt: new Date() },
            });
        });
        // Borrar la room en Daily es best-effort: si falla, la sala expira sola.
        await deleteDailyRoom(session.dailyRoomName).catch(() => undefined);

        await logAudit({
            action: AUDIT_ACTION.LMS_LIVE_SESSION_CANCEL,
            actorId: manager.userId,
            actorEmail: manager.userEmail,
            actorRole: manager.userRole,
            academicInstitutionId: manager.institutionId,
            entity: 'LmsLiveSession',
            entityId: session.id,
        });
        revalidatePath(`/${slug}/aula/${session.courseId}/clases`);
        return ok({ id: session.id, canceled: true });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo cancelar la sesión'));
    }
}

export async function startLiveSession(
    slug: string,
    input: unknown,
): Promise<ActionResult<{ id: string; joinUrl: string; token: string | null }>> {
    const parsed = startLiveSessionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');
    const manager = await requireLiveManager(slug).catch(() => null);
    if (!manager) return fail('No autorizado');

    try {
        const session = await assertSessionEditableByManager(
            parsed.data.sessionId,
            manager.institutionId,
            manager.userId,
            manager.userRole,
        );

        if (!canTransition(session.status, 'LIVE')) {
            return fail('La sesión ya no puede iniciarse');
        }

        await prisma.lmsLiveSession.update({
            where: { id: session.id },
            data: { status: 'LIVE' as LiveSessionStatus, startedAt: new Date() },
        });

        const tokenResult = await createDailyMeetingToken({
            roomName: session.dailyRoomName,
            userName: `${manager.userEmail} (host)`,
            isOwner: true,
            expiresAt: session.dailyRoomExpiresAt,
        });

        await logAudit({
            action: AUDIT_ACTION.LMS_LIVE_SESSION_START,
            actorId: manager.userId,
            actorEmail: manager.userEmail,
            actorRole: manager.userRole,
            academicInstitutionId: manager.institutionId,
            entity: 'LmsLiveSession',
            entityId: session.id,
        });
        revalidatePath(`/${slug}/aula/${session.courseId}/clases`);
        return ok({
            id: session.id,
            joinUrl: session.dailyRoomUrl,
            token: tokenResult.ok ? tokenResult.token : null,
        });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo iniciar la sesión'));
    }
}

export async function endLiveSession(
    slug: string,
    input: unknown,
): Promise<ActionResult<{ id: string }>> {
    const parsed = endLiveSessionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');
    const manager = await requireLiveManager(slug).catch(() => null);
    if (!manager) return fail('No autorizado');

    try {
        const session = await assertSessionEditableByManager(
            parsed.data.sessionId,
            manager.institutionId,
            manager.userId,
            manager.userRole,
        );

        if (!canTransition(session.status, 'ENDED')) {
            return fail('La sesión ya está finalizada o cancelada');
        }

        const endedAt = new Date();
        await prisma.$transaction(async (tx) => {
            await tx.lmsLiveSession.update({
                where: { id: session.id },
                data: { status: 'ENDED' as LiveSessionStatus, endedAt },
            });
            await tx.lmsLiveAttendance.updateMany({
                where: { sessionId: session.id, leftAt: null },
                data: { leftAt: endedAt },
            });
        });
        await deleteDailyRoom(session.dailyRoomName).catch(() => undefined);

        await logAudit({
            action: AUDIT_ACTION.LMS_LIVE_SESSION_END,
            actorId: manager.userId,
            actorEmail: manager.userEmail,
            actorRole: manager.userRole,
            academicInstitutionId: manager.institutionId,
            entity: 'LmsLiveSession',
            entityId: session.id,
        });
        revalidatePath(`/${slug}/aula/${session.courseId}/clases`);
        return ok({ id: session.id });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo finalizar la sesión'));
    }
}

export async function joinLiveSession(
    input: JoinLiveSessionInput,
): Promise<ActionResult<{ joinUrl: string; token: string | null; attendanceId: string }>> {
    const parsed = joinLiveSessionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

    const { auth } = await import('@/features/auth/auth');
    const session = await auth();
    if (!session?.user?.id) return fail('No autenticado');
    const userId = session.user.id;
    const displayName = session.user.name ?? session.user.email ?? 'Participante';

    const liveSession = await prisma.lmsLiveSession.findUnique({
        where: { id: parsed.data.sessionId },
        select: {
            id: true,
            courseId: true,
            course: { select: { academicInstitutionId: true } },
            dailyRoomName: true,
            dailyRoomUrl: true,
            dailyRoomExpiresAt: true,
            scheduledAt: true,
            durationMin: true,
            status: true,
            maxParticipants: true,
        },
    });
    if (!liveSession) return fail('Sesión no encontrada');
    if (liveSession.status === 'CANCELED') return fail('La sesión fue cancelada');
    if (liveSession.status === 'ENDED') return fail('La sesión ya terminó');

    const window = computeJoinWindow({
        scheduledAt: liveSession.scheduledAt,
        durationMin: liveSession.durationMin,
        now: new Date(),
    });
    if (!window.isJoinable && liveSession.status !== 'LIVE') {
        return fail('La sala aún no está abierta. Vuelve más cerca del horario.');
    }

    // Validar acceso al curso según rol.
    const userRoleName = session.user.userRoleName;
    const institutionId = liveSession.course.academicInstitutionId;
    let role: LiveAttendanceRole = 'STUDENT';
    let allowed = false;

    if (userRoleName === USER_ROLE.SUPER_ADMIN) {
        allowed = true;
        role = 'ASSISTANT';
    } else if (
        (userRoleName === USER_ROLE.ADMIN || userRoleName === USER_ROLE.PROFESOR) &&
        institutionId
    ) {
        const membership = await prisma.user.findUnique({
            where: { id: userId },
            select: { academicInstitutionId: true },
        });
        if (membership?.academicInstitutionId === institutionId) {
            allowed = true;
            role = userRoleName === USER_ROLE.ADMIN ? 'TEACHER' : 'TEACHER';
        }
    } else if (userRoleName === USER_ROLE.STUDENT) {
        const enrollment = await prisma.lmsEnrollment.findFirst({
            where: { userId, courseId: liveSession.courseId },
            select: { id: true },
        });
        if (enrollment) allowed = true;
    }

    if (!allowed) return fail('No tienes acceso a este curso');

    if (liveSession.maxParticipants) {
        const activeCount = await prisma.lmsLiveAttendance.count({
            where: { sessionId: liveSession.id, leftAt: null },
        });
        if (activeCount >= liveSession.maxParticipants) {
            return fail('La sala está llena');
        }
    }

    try {
        const attendance = await prisma.lmsLiveAttendance.create({
            data: {
                sessionId: liveSession.id,
                userId,
                role,
                displayName,
                joinedAt: new Date(),
                dailyParticipantId: parsed.data.dailyParticipantId ?? null,
            },
        });

        const tokenResult = await createDailyMeetingToken({
            roomName: liveSession.dailyRoomName,
            userName: displayName,
            isOwner: false,
            expiresAt: liveSession.dailyRoomExpiresAt,
        });

        return ok({
            joinUrl: liveSession.dailyRoomUrl,
            token: tokenResult.ok ? tokenResult.token : null,
            attendanceId: attendance.id,
        });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo registrar tu asistencia'));
    }
}

export async function leaveLiveSession(
    input: unknown,
): Promise<ActionResult<{ id: string }>> {
    const parsed = leaveLiveSessionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Datos inválidos');

    const { auth } = await import('@/features/auth/auth');
    const session = await auth();
    if (!session?.user?.id) return fail('No autenticado');

    try {
        const attendance = await prisma.lmsLiveAttendance.findUnique({
            where: { id: parsed.data.attendanceId },
            select: {
                id: true,
                sessionId: true,
                userId: true,
                joinedAt: true,
                leftAt: true,
            },
        });
        if (!attendance) return fail('Asistencia no encontrada');
        if (attendance.userId !== session.user.id) return fail('No autorizado');
        if (attendance.leftAt) return ok({ id: attendance.id });

        const leftAt = new Date();
        const durationSec = Math.max(
            0,
            Math.floor((leftAt.getTime() - attendance.joinedAt.getTime()) / 1000),
        );
        await prisma.lmsLiveAttendance.update({
            where: { id: attendance.id },
            data: { leftAt, durationSec },
        });
        return ok({ id: attendance.id });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo registrar la salida'));
    }
}

export async function toggleLiveSessionRecording(
    slug: string,
    input: unknown,
): Promise<ActionResult<{ recording: boolean }>> {
    try {
        const parsed = liveSessionIdSchema.safeParse(input);
        if (!parsed.success) return fail('Datos inválidos');
        const { sessionId } = parsed.data;

        const ctx = await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const session = await prisma.lmsLiveSession.findFirst({
            where: {
                id: sessionId,
                course: { academicInstitutionId: ctx.institutionId },
            },
            select: {
                id: true,
                status: true,
                dailyRoomName: true,
                recordingStatus: true,
                courseId: true,
            },
        });

        if (!session) return fail('Sesión no encontrada.');
        if (session.status !== 'LIVE') return fail('La sesión debe estar en curso para grabar.');

        const isRecording = session.recordingStatus === 'PENDING';

        if (isRecording) {
            // Stop recording — just mark as NONE (Daily stops automatically when meeting ends)
            await prisma.lmsLiveSession.update({
                where: { id: sessionId },
                data: { recordingStatus: 'NONE' },
            });
            revalidatePath(`/${slug}/aula/${session.courseId}/clases/${sessionId}`);
            return ok({ recording: false });
        }
            // Start recording via Daily API
            const result = await startDailyRecording(session.dailyRoomName);
            if (!result.ok) return fail(result.error);

            await prisma.lmsLiveSession.update({
                where: { id: sessionId },
                data: { recordingStatus: 'PENDING' },
            });
            revalidatePath(`/${slug}/aula/${session.courseId}/clases/${sessionId}`);
            return ok({ recording: true });
    } catch (err) {
        return fail(toActionError(err, 'Error al cambiar estado de grabación.'));
    }
}

export async function getLiveSessionById(input: unknown) {
    const parsed = liveSessionIdSchema.safeParse(input);
    if (!parsed.success) return { data: null, error: 'Datos inválidos' as string | null };

    const session = await prisma.lmsLiveSession.findUnique({
        where: { id: parsed.data.sessionId },
        include: {
            course: { select: { id: true, title: true } },
            createdBy: { select: { id: true, name: true } },
            _count: { select: { attendances: true, chatMessages: true, whiteboardSnapshots: true } },
        },
    });
    return { data: session, error: null as string | null };
}
