// Motor de puntos, rachas e insignias del Aula Virtual (Fase 4).
//
// Decisiones de arquitectura:
// - No usamos event-bus ni middleware: este módulo se invoca **explícitamente**
//   desde los server actions que generan actividad del estudiante. Es la forma
//   más simple y testeable de asegurar que cada acción tiene un único punto de
//   entrada para puntos.
// - Todos los enganches en server actions usan fire-and-forget
//   (`void awardPointsForEvent(...).catch(console.error)`) para que un fallo
//   en el motor de puntos no rompa el flujo principal del action.
// - El total de puntos se calcula al vuelo con `SUM(amount) WHERE userId` en
//   vez de mantener un contador denormalizado: evitamos drift a cambio de una
//   query agregada barata (índice `[userId, createdAt]`).
// - `dedupeKey` UNIQUE garantiza idempotencia: si el mismo evento se otorga
//   dos veces (reintentos, webhooks duplicados), el segundo `create` falla con
//   P2002 y se ignora silenciosamente.
// - La acreditación de puntos, actualización de racha y desbloqueo de badges
//   ocurre en una sola transacción para garantizar consistencia.

import {
    type BadgeCriterion,
    evaluateCriterion,
    isBadgeCriterion,
} from './badges';
import { computeStreakUpdate, type StreakState } from './streak';
import type { UserStats } from './user-stats';
import { prisma } from '@/shared/lib/prisma';
import type { LmsPointSource } from '@prisma/client';

export interface AwardPointsInput {
    userId: string;
    sourceType: LmsPointSource;
    amount: number;
    reason: string;
    sourceId?: string;
    courseId?: string;
    dedupeKey?: string;
}

export interface AwardPointsResult {
    awarded: boolean;
    eventId: string | null;
    newBadges: Array<{ id: string; code: string; name: string }>;
    totalPoints: number;
    streak: { current: number; longest: number } | null;
}

interface AwardPointsDeps {
    prismaClient: typeof prisma;
}

const DEFAULT_DEPS: AwardPointsDeps = { prismaClient: prisma };

export async function awardPointsForEvent(
    input: AwardPointsInput,
    deps: AwardPointsDeps = DEFAULT_DEPS,
): Promise<AwardPointsResult> {
    const empty: AwardPointsResult = {
        awarded: false,
        eventId: null,
        newBadges: [],
        totalPoints: 0,
        streak: null,
    };

    if (!Number.isFinite(input.amount)) return empty;
    if (input.amount < 0) {
        // Nunca permitimos puntos negativos — usar `dedupeKey` con `amount: 0`
        // si se necesita un evento marcador sin puntuar.
        return empty;
    }

    // Si no hay puntos y no hay dedupeKey, no hay nada que registrar.
    if (input.amount === 0 && !input.dedupeKey) return empty;

    try {
        const result = await deps.prismaClient.$transaction(async (tx) => {
            // 1. Inserta el PointEvent (idempotente vía dedupeKey).
            let event;
            try {
                event = await tx.lmsPointEvent.create({
                    data: {
                        userId: input.userId,
                        amount: input.amount,
                        reason: input.reason,
                        sourceType: input.sourceType,
                        sourceId: input.sourceId ?? null,
                        courseId: input.courseId ?? null,
                        dedupeKey: input.dedupeKey ?? null,
                    },
                });
            } catch (err: unknown) {
                if (isUniqueViolation(err)) {
                    // Evento duplicado: no hacer nada.
                    return null;
                }
                throw err;
            }

            // 2. Actualiza la racha (solo si la actividad es "hoy").
            const streakRow = await upsertStreak(tx, input.userId, event.createdAt);

            // 3. Calcula totalPoints y evalúa badges.
            const aggregate = await tx.lmsPointEvent.aggregate({
                where: { userId: input.userId },
                _sum: { amount: true },
            });
            const totalPoints = aggregate._sum.amount ?? 0;

            const stats = await loadUserStats(tx, input.userId, totalPoints, streakRow);
            const newBadges = await unlockEligibleBadges(tx, input.userId, stats);

            return {
                eventId: event.id,
                streak: { current: streakRow.currentStreak, longest: streakRow.longestStreak },
                totalPoints,
                newBadges,
            };
        });

        if (result === null) return empty;

        return {
            awarded: true,
            eventId: result.eventId,
            newBadges: result.newBadges,
            totalPoints: result.totalPoints,
            streak: result.streak,
        };
    } catch (error) {
        console.error('[points-engine] awardPointsForEvent failed', {
            error,
            input,
        });
        return empty;
    }
}

// ─── Streak upsert ───────────────────────────────────────────────────────────

interface StreakRow {
    currentStreak: number;
    longestStreak: number;
    lastActiveOn: Date | null;
    freezeTokens: number;
}

async function upsertStreak(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    userId: string,
    activityAt: Date,
): Promise<StreakRow> {
    const existing = await tx.lmsStreak.findUnique({ where: { userId } });
    const state: StreakState = {
        currentStreak: existing?.currentStreak ?? 0,
        longestStreak: existing?.longestStreak ?? 0,
        lastActiveOn: existing?.lastActiveOn ?? null,
        freezeTokens: existing?.freezeTokens ?? 0,
    };

    const update = computeStreakUpdate(state, activityAt);

    const persisted = await tx.lmsStreak.upsert({
        where: { userId },
        create: {
            userId,
            currentStreak: update.currentStreak,
            longestStreak: update.longestStreak,
            lastActiveOn: update.lastActiveOn,
            freezeTokens: update.freezeTokens,
        },
        update: {
            currentStreak: update.currentStreak,
            longestStreak: update.longestStreak,
            lastActiveOn: update.lastActiveOn,
            freezeTokens: update.freezeTokens,
        },
    });

    return {
        currentStreak: persisted.currentStreak,
        longestStreak: persisted.longestStreak,
        lastActiveOn: persisted.lastActiveOn,
        freezeTokens: persisted.freezeTokens,
    };
}

// ─── Stats aggregation ───────────────────────────────────────────────────────

async function loadUserStats(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    userId: string,
    totalPoints: number,
    streak: StreakRow,
): Promise<UserStats> {
    const [lessonsCompleted, assignmentsSubmitted, examsPassed, forumPosts] =
        await Promise.all([
            tx.lmsLessonProgress.count({
                where: { userId, completed: true },
            }),
            tx.lmsSubmission.count({ where: { studentId: userId } }),
            tx.lmsPointEvent.count({
                where: { userId, sourceType: 'EXAM_PASSED' },
            }),
            tx.lmsForumPost.count({ where: { authorId: userId } }),
        ]);

    return {
        totalPoints,
        lessonsCompleted,
        assignmentsSubmitted,
        examsPassed,
        forumPosts,
        longestStreak: streak.longestStreak,
    };
}

// ─── Badge unlocking ─────────────────────────────────────────────────────────

async function unlockEligibleBadges(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    userId: string,
    stats: UserStats,
): Promise<Array<{ id: string; code: string; name: string }>> {
    const [allBadges, owned] = await Promise.all([
        tx.lmsBadge.findMany({ where: { active: true } }),
        tx.lmsUserBadge.findMany({ where: { userId }, select: { badgeId: true } }),
    ]);
    const ownedSet = new Set(owned.map((b) => b.badgeId));
    const unlocked: Array<{ id: string; code: string; name: string }> = [];

    for (const badge of allBadges) {
        const outcome = await tryUnlockBadge(tx, userId, badge, ownedSet, stats);
        if (outcome === 'unlocked') {
            unlocked.push({ id: badge.id, code: badge.code, name: badge.name });
        }
    }

    return unlocked;
}

type BadgeUnlockOutcome = 'unlocked' | 'already-owned' | 'criteria-not-met';

async function tryUnlockBadge(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    userId: string,
    badge: { id: string; code: string; name: string; pointsReward: number; criteria: unknown },
    ownedSet: Set<string>,
    stats: UserStats,
): Promise<BadgeUnlockOutcome> {
    if (ownedSet.has(badge.id)) return 'already-owned';
    const criterion = badge.criteria;
    if (!isBadgeCriterion(criterion)) return 'criteria-not-met';
    if (!evaluateCriterion(criterion, stats)) return 'criteria-not-met';

    const created = await createUserBadgeRow(tx, userId, badge.id, criterion, stats);
    if (!created) return 'already-owned';

    await creditBadgeRewardIfAny(tx, userId, badge);
    return 'unlocked';
}

async function createUserBadgeRow(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    userId: string,
    badgeId: string,
    criterion: BadgeCriterion,
    stats: UserStats,
): Promise<boolean> {
    try {
        await tx.lmsUserBadge.create({
            data: {
                userId,
                badgeId,
                awardedReason: badgeRewardReason(criterion, stats),
            },
        });
        return true;
    } catch (err: unknown) {
        if (isUniqueViolation(err)) return false;
        throw err;
    }
}

async function creditBadgeRewardIfAny(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    userId: string,
    badge: { id: string; name: string; pointsReward: number },
): Promise<void> {
    if (badge.pointsReward <= 0) return;
    try {
        await tx.lmsPointEvent.create({
            data: {
                userId,
                amount: badge.pointsReward,
                reason: `Insignia desbloqueada: ${badge.name}`,
                sourceType: 'MANUAL',
                dedupeKey: `BADGE_REWARD:${badge.id}`,
            },
        });
    } catch (err: unknown) {
        if (!isUniqueViolation(err)) throw err;
    }
}

function badgeRewardReason(
    criterion: BadgeCriterion,
    stats: UserStats,
): string {
    switch (criterion.type) {
        case 'TOTAL_POINTS':
            return `Alcanzaste ${stats.totalPoints} puntos`;
        case 'LESSONS_COMPLETED':
            return `Completaste ${stats.lessonsCompleted} lecciones`;
        case 'ASSIGNMENTS_SUBMITTED':
            return `Entregaste ${stats.assignmentsSubmitted} tareas`;
        case 'EXAMS_PASSED':
            return `Aprobaste ${stats.examsPassed} exámenes`;
        case 'FORUM_POSTS':
            return `Publicaste ${stats.forumPosts} mensajes en el foro`;
        case 'LONGEST_STREAK':
            return `Racha más larga: ${stats.longestStreak} días`;
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isUniqueViolation(err: unknown): boolean {
    if (typeof err !== 'object' || err === null) return false;
    const code = (err as { code?: unknown }).code;
    return code === 'P2002';
}

// ─── Lectura de stats para la UI ─────────────────────────────────────────────

export async function getUserGamificationSummary(userId: string): Promise<{
    totalPoints: number;
    streak: { current: number; longest: number; lastActiveOn: Date | null; freezeTokens: number };
    badges: Array<{ id: string; code: string; name: string; description: string; icon: string; awardedAt: Date }>;
    pointsBySource: Array<{ sourceType: string; total: number }>;
}> {
    const [aggregate, streak, ownedBadges, bySource] = await Promise.all([
        prisma.lmsPointEvent.aggregate({
            where: { userId },
            _sum: { amount: true },
        }),
        prisma.lmsStreak.findUnique({ where: { userId } }),
        prisma.lmsUserBadge.findMany({
            where: { userId },
            include: { badge: true },
            orderBy: { awardedAt: 'desc' },
        }),
        prisma.lmsPointEvent.groupBy({
            by: ['sourceType'],
            where: { userId },
            _sum: { amount: true },
        }),
    ]);

    return {
        totalPoints: aggregate._sum.amount ?? 0,
        streak: {
            current: streak?.currentStreak ?? 0,
            longest: streak?.longestStreak ?? 0,
            lastActiveOn: streak?.lastActiveOn ?? null,
            freezeTokens: streak?.freezeTokens ?? 0,
        },
        badges: ownedBadges.map((ub) => ({
            id: ub.badge.id,
            code: ub.badge.code,
            name: ub.badge.name,
            description: ub.badge.description,
            icon: ub.badge.icon,
            awardedAt: ub.awardedAt,
        })),
        pointsBySource: bySource.map((row) => ({
            sourceType: row.sourceType,
            total: row._sum.amount ?? 0,
        })),
    };
}