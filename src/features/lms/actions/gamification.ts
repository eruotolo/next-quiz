'use server';

import { requireInstitutionAccess } from '@/features/auth/lib/auth-guard';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import {
    awardManualPointsSchema,
    lmsBadgeSchema,
} from '@/features/lms/schemas/lms-phase4-gamification.schemas';
import { awardPointsForEvent, getUserGamificationSummary } from '@/features/lms/lib/points-engine';
import { BADGE_DEFINITIONS } from '@/features/lms/lib/gamification';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { type ActionResult, fail, ok, toActionError } from '@/shared/types/action';
import { revalidatePath } from 'next/cache';

// ─── Award manual (admin otorga puntos a un estudiante) ──────────────────────

export async function awardManualLmsPoints(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ eventId: string | null; totalPoints: number }>> {
    try {
        const parsed = awardManualPointsSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]);

        // Verifica que el estudiante existe y pertenece a la institución.
        const student = await prisma.user.findUnique({
            where: { id: parsed.data.studentId },
            select: { id: true, academicInstitutionId: true, name: true, lastname: true },
        });
        if (!student) return fail('Estudiante no encontrado');
        if (
            ctx.userRole !== USER_ROLE.SUPER_ADMIN &&
            student.academicInstitutionId !== ctx.institutionId
        ) {
            return fail('El estudiante no pertenece a esta institución');
        }

        const result = await awardPointsForEvent({
            userId: student.id,
            sourceType: 'MANUAL',
            amount: parsed.data.amount,
            reason: parsed.data.reason,
            courseId: parsed.data.courseId ?? undefined,
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsPointEvent',
            entityId: result.eventId,
            metadata: {
                studentId: student.id,
                amount: parsed.data.amount,
                reason: parsed.data.reason,
            },
        });

        revalidatePath(`/aula/cursos/${parsed.data.courseId ?? ''}`);
        return ok({ eventId: result.eventId, totalPoints: result.totalPoints });
    } catch (error) {
        return fail<{ eventId: string | null; totalPoints: number }>(
            toActionError(error, 'No se pudieron otorgar los puntos'),
        );
    }
}

// ─── CRUD de insignias ───────────────────────────────────────────────────────

export async function createLmsBadge(
    slug: string,
    data: unknown,
): Promise<ActionResult<{ id: string }>> {
    try {
        const parsed = lmsBadgeSchema.safeParse(data);
        if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos');

        const ctx = await requireInstitutionAccess(slug, [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]);

        const badge = await prisma.lmsBadge.create({
            data: {
                code: parsed.data.code,
                name: parsed.data.name,
                description: parsed.data.description,
                icon: parsed.data.icon,
                pointsReward: parsed.data.pointsReward,
                criteria: parsed.data.criteria,
                active: parsed.data.active,
            },
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_CREATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsBadge',
            entityId: badge.id,
            metadata: { code: badge.code },
        });

        return ok({ id: badge.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo crear la insignia'));
    }
}

export async function updateLmsBadge(
    slug: string,
    badgeId: string,
    data: Partial<{
        name: string;
        description: string;
        icon: string;
        pointsReward: number;
        active: boolean;
    }>,
): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]);

        const existing = await prisma.lmsBadge.findUnique({ where: { id: badgeId } });
        if (!existing) return fail('Insignia no encontrada');

        const updated = await prisma.lmsBadge.update({
            where: { id: badgeId },
            data,
        });

        await logAudit({
            action: AUDIT_ACTION.COURSE_UPDATE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsBadge',
            entityId: badgeId,
            metadata: { changes: data },
        });

        return ok({ id: updated.id });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo actualizar la insignia'));
    }
}

export async function deleteLmsBadge(
    slug: string,
    badgeId: string,
): Promise<ActionResult<{ id: string }>> {
    try {
        const ctx = await requireInstitutionAccess(slug, [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]);

        await prisma.lmsBadge.delete({ where: { id: badgeId } });

        await logAudit({
            action: AUDIT_ACTION.COURSE_DELETE,
            actorId: ctx.userId,
            actorEmail: ctx.userEmail,
            actorRole: ctx.userRole,
            academicInstitutionId: ctx.institutionId,
            entity: 'LmsBadge',
            entityId: badgeId,
        });

        return ok({ id: badgeId });
    } catch (error) {
        return fail<{ id: string }>(toActionError(error, 'No se pudo eliminar la insignia'));
    }
}

// ─── Listado del catálogo ────────────────────────────────────────────────────

export async function listLmsBadges(slug: string): Promise<
    ActionResult<
        Array<{
            id: string;
            code: string;
            name: string;
            description: string;
            icon: string;
            pointsReward: number;
            criteria: unknown;
            active: boolean;
        }>
    >
> {
    try {
        await requireInstitutionAccess(slug, [
            USER_ROLE.ADMIN,
            USER_ROLE.SUPER_ADMIN,
            USER_ROLE.PROFESOR,
        ]);

        const badges = await prisma.lmsBadge.findMany({
            orderBy: { createdAt: 'asc' },
        });

        return ok(
            badges.map((b) => ({
                id: b.id,
                code: b.code,
                name: b.name,
                description: b.description,
                icon: b.icon,
                pointsReward: b.pointsReward,
                criteria: b.criteria,
                active: b.active,
            })),
        );
    } catch (error) {
        return fail<
            Array<{
                id: string;
                code: string;
                name: string;
                description: string;
                icon: string;
                pointsReward: number;
                criteria: unknown;
                active: boolean;
            }>
        >(toActionError(error, 'No se pudo listar las insignias'));
    }
}

// ─── Resumen del estudiante (racha, puntos, insignias) ──────────────────────

export interface AchievementBadge {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    pointsReward: number;
    awardedAt: Date;
}

export interface RecentPointEvent {
    id: string;
    amount: number;
    reason: string;
    sourceType: string;
    createdAt: Date;
}

export interface MyAchievements {
    totalPoints: number;
    currentStreak: number;
    longestStreak: number;
    badges: AchievementBadge[];
    recentEvents: RecentPointEvent[];
}

export async function getMyAchievements(): Promise<ActionResult<MyAchievements>> {
    try {
        const { getStudentAuthSession } = await import('@/features/exam-session/lib/session');
        const session = await getStudentAuthSession();
        if (!session) return fail<MyAchievements>('No estás autenticado como estudiante');

        const [summary, recentEvents] = await Promise.all([
            getUserGamificationSummary(session.studentId),
            prisma.lmsPointEvent.findMany({
                where: { userId: session.studentId },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true,
                    amount: true,
                    reason: true,
                    sourceType: true,
                    createdAt: true,
                },
            }),
        ]);

        return ok({
            totalPoints: summary.totalPoints,
            currentStreak: summary.streak.current,
            longestStreak: summary.streak.longest,
            badges: summary.badges.map((b) => ({
                id: b.id,
                code: b.code,
                name: b.name,
                description: b.description,
                icon: b.icon,
                pointsReward: BADGE_DEFINITIONS.find((d) => d.code === b.code)?.pointsReward ?? 0,
                awardedAt: b.awardedAt,
            })),
            recentEvents,
        });
    } catch (error) {
        return fail<MyAchievements>(toActionError(error, 'No se pudo leer tu progreso'));
    }
}

// Wrapper retrocompatible: devuelve el mismo shape que getUserGamificationSummary.
export async function getMyGamificationSummary(): Promise<
    ActionResult<{
        totalPoints: number;
        streak: {
            current: number;
            longest: number;
            lastActiveOn: Date | null;
            freezeTokens: number;
        };
        badges: Array<{
            id: string;
            code: string;
            name: string;
            description: string;
            icon: string;
            awardedAt: Date;
        }>;
        pointsBySource: Array<{ sourceType: string; total: number }>;
    }>
> {
    try {
        const { getStudentAuthSession } = await import('@/features/exam-session/lib/session');
        const session = await getStudentAuthSession();
        if (!session) return fail('No estás autenticado como estudiante');

        const summary = await getUserGamificationSummary(session.studentId);
        return ok(summary);
    } catch (error) {
        return fail<{
            totalPoints: number;
            streak: {
                current: number;
                longest: number;
                lastActiveOn: Date | null;
                freezeTokens: number;
            };
            badges: Array<{
                id: string;
                code: string;
                name: string;
                description: string;
                icon: string;
                awardedAt: Date;
            }>;
            pointsBySource: Array<{ sourceType: string; total: number }>;
        }>(toActionError(error, 'No se pudo leer tu progreso'));
    }
}

// Insignias ganadas que el estudiante no ha visto todavía (sin BADGE_ACK).
// Usado por BadgeUnlockProvider para mostrar la animación de insignia nueva.
export async function getUnseenBadges(): Promise<AchievementBadge[]> {
    try {
        const { getStudentAuthSession } = await import('@/features/exam-session/lib/session');
        const session = await getStudentAuthSession();
        if (!session) return [];

        const [owned, acked] = await Promise.all([
            prisma.lmsUserBadge.findMany({
                where: { userId: session.studentId },
                include: { badge: true },
                orderBy: { awardedAt: 'asc' },
            }),
            prisma.lmsNotification.findMany({
                where: { userId: session.studentId, type: 'BADGE_ACK' },
                select: { message: true },
            }),
        ]);

        const ackedCodes = new Set(acked.map((n) => n.message));
        const badgeDefs = BADGE_DEFINITIONS;

        return owned
            .filter((ub) => !ackedCodes.has(ub.badge.code))
            .map((ub) => ({
                id: ub.badge.id,
                code: ub.badge.code,
                name: ub.badge.name,
                description: ub.badge.description,
                icon: ub.badge.icon,
                pointsReward:
                    badgeDefs.find((d) => d.code === ub.badge.code)?.pointsReward ??
                    ub.badge.pointsReward,
                awardedAt: ub.awardedAt,
            }));
    } catch {
        return [];
    }
}

export async function markBadgesSeen(
    badgeCodes: string[],
): Promise<ActionResult<{ marked: number }>> {
    try {
        const { getStudentAuthSession } = await import('@/features/exam-session/lib/session');
        const session = await getStudentAuthSession();
        if (!session) return fail<{ marked: number }>('No estás autenticado');

        if (badgeCodes.length === 0) return ok({ marked: 0 });

        // Las insignias no tienen campo `seen` propio; persistimos el "último
        // visto" en una entrada de LmsNotification (tipo BADGE_ACK) para que
        // el provider de animación no las muestre de nuevo al refrescar.
        await prisma.lmsNotification.createMany({
            data: badgeCodes.map((code) => ({
                userId: session.studentId,
                type: 'BADGE_ACK',
                message: code,
                link: '/aula/logros',
            })),
        });

        return ok({ marked: badgeCodes.length });
    } catch (error) {
        return fail<{ marked: number }>(
            toActionError(error, 'No se pudo registrar la confirmación'),
        );
    }
}

// ─── Leaderboard + privacidad ────────────────────────────────────────────────

export interface LeaderboardEntry {
    userId: string;
    name: string;
    lastname: string;
    totalPoints: number;
    rank: number;
    isCurrentUser: boolean;
    isAnonymous: boolean;
}

export interface LeaderboardData {
    courseId: string;
    entries: LeaderboardEntry[];
    currentUserRank: number | null;
    currentUserOptedOut: boolean;
}

export async function getCourseLeaderboard(
    courseId: string,
): Promise<ActionResult<LeaderboardData>> {
    try {
        const { getStudentAuthSession } = await import('@/features/exam-session/lib/session');
        const session = await getStudentAuthSession();
        if (!session) return fail('No estás autenticado como estudiante');

        // Verifica inscripción activa.
        const enrollment = await prisma.lmsEnrollment.findUnique({
            where: {
                userId_courseId: { userId: session.studentId, courseId },
            },
        });
        if (!enrollment || enrollment.status !== 'ACTIVO') {
            return fail('No estás inscripto en este curso');
        }

        // Suma de puntos por estudiante inscripto en el curso (incluye puntos
        // globales del estudiante: el motor acredita a nivel User, no Course).
        const enrollments = await prisma.lmsEnrollment.findMany({
            where: { courseId, status: 'ACTIVO' },
            select: { userId: true },
        });
        const studentIds = enrollments.map((e) => e.userId);

        const aggregates = await prisma.lmsPointEvent.groupBy({
            by: ['userId'],
            where: { userId: { in: studentIds } },
            _sum: { amount: true },
        });
        const pointsByStudent = new Map<string, number>(
            aggregates.map((a) => [a.userId, a._sum.amount ?? 0]),
        );

        // Estudiantes sin puntos también aparecen (con 0), para que el
        // ranking inicial no se vea vacío.
        const allUsers = await prisma.user.findMany({
            where: { id: { in: studentIds } },
            select: { id: true, name: true, lastname: true },
        });

        const optOuts = await prisma.lmsLeaderboardOptOut.findMany({
            where: { courseId },
            select: { userId: true },
        });
        const optedOutSet = new Set(optOuts.map((o) => o.userId));

        const sorted = allUsers
            .map((u) => ({
                userId: u.id,
                name: u.name,
                lastname: u.lastname,
                totalPoints: pointsByStudent.get(u.id) ?? 0,
                isAnonymous: optedOutSet.has(u.id) && u.id !== session.studentId,
            }))
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((entry, idx) => ({
                ...entry,
                rank: idx + 1,
                isCurrentUser: entry.userId === session.studentId,
            }));

        const currentUserRank = sorted.find((e) => e.isCurrentUser)?.rank ?? null;
        const currentUserOptedOut = optedOutSet.has(session.studentId);

        return ok({
            courseId,
            entries: sorted,
            currentUserRank,
            currentUserOptedOut,
        });
    } catch (error) {
        return fail<LeaderboardData>(toActionError(error, 'No se pudo cargar el ranking'));
    }
}

export async function toggleLeaderboardOptOut(
    courseId: string,
): Promise<ActionResult<{ optedOut: boolean }>> {
    try {
        const { getStudentAuthSession } = await import('@/features/exam-session/lib/session');
        const session = await getStudentAuthSession();
        if (!session) return fail<{ optedOut: boolean }>('No estás autenticado');

        // Verifica inscripción activa.
        const enrollment = await prisma.lmsEnrollment.findUnique({
            where: {
                userId_courseId: { userId: session.studentId, courseId },
            },
            select: { status: true },
        });
        if (!enrollment || enrollment.status !== 'ACTIVO') {
            return fail<{ optedOut: boolean }>('No estás inscripto en este curso');
        }

        const existing = await prisma.lmsLeaderboardOptOut.findUnique({
            where: {
                userId_courseId: { userId: session.studentId, courseId },
            },
        });

        if (existing) {
            await prisma.lmsLeaderboardOptOut.delete({
                where: { id: existing.id },
            });
            return ok({ optedOut: false });
        }

        await prisma.lmsLeaderboardOptOut.create({
            data: { userId: session.studentId, courseId },
        });
        return ok({ optedOut: true });
    } catch (error) {
        return fail<{ optedOut: boolean }>(
            toActionError(error, 'No se pudo cambiar la privacidad del ranking'),
        );
    }
}
