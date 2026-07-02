'use client';

import { cn } from '@/shared/lib/utils';
import type { MyAchievements } from '@/features/lms/actions/gamification';
import { BADGE_DEFINITIONS } from '@/features/lms/lib/gamification';
import { Flame, Star, Zap, Trophy } from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

interface Props {
    achievements: MyAchievements;
}

function StatCard({
    icon,
    label,
    value,
    sub,
    bg,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    bg: string;
}) {
    return (
        <Card className={cn('flex items-center gap-4 p-5', bg)}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/60 shadow-sm">
                {icon}
            </div>
            <div>
                <p className="text-mute text-xs font-medium tracking-wider uppercase">{label}</p>
                <p className="text-ink text-3xl font-bold">{value}</p>
                {sub && <p className="text-mute text-xs">{sub}</p>}
            </div>
        </Card>
    );
}

function BadgeGrid({ earnedCodes }: { earnedCodes: Set<string> }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {BADGE_DEFINITIONS.map((def) => {
                const earned = earnedCodes.has(def.code);
                return (
                    <div
                        key={def.code}
                        className={cn(
                            'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                            earned
                                ? 'border-amber-200 bg-gradient-to-b from-amber-50 to-white shadow-sm'
                                : 'border-border bg-paper opacity-50 grayscale',
                        )}
                    >
                        <div
                            className={cn(
                                'flex h-14 w-14 items-center justify-center rounded-xl text-2xl',
                                earned
                                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md'
                                    : 'text-mute bg-white/60',
                            )}
                        >
                            🏅
                        </div>
                        <p className="text-ink text-xs leading-tight font-bold">{def.name}</p>
                        <p className="text-mute text-[10px] leading-snug">{def.description}</p>
                        {earned && def.pointsReward > 0 && (
                            <Badge variant="outline" className="text-[10px] text-amber-600">
                                +{def.pointsReward} pts
                            </Badge>
                        )}
                        {!earned && <span className="text-mute text-[10px]">Bloqueada</span>}
                    </div>
                );
            })}
        </div>
    );
}

const SOURCE_LABELS: Record<string, string> = {
    LESSON_COMPLETED: 'Lección completada',
    ASSIGNMENT_SUBMITTED: 'Tarea entregada',
    ASSIGNMENT_GRADED: 'Calificación recibida',
    EXAM_PASSED: 'Examen aprobado',
    FORUM_POST: 'Post en foro',
    STREAK_BONUS: 'Bonus de racha',
    MANUAL: 'Manual',
};

export function LmsAchievementsClient({ achievements }: Props) {
    const earnedCodes = new Set(achievements.badges.map((b) => b.code));

    return (
        <div className="flex flex-col gap-8">
            {/* Stats */}
            <section>
                <h2 className="text-ink font-display mb-4 text-xl font-bold">Resumen</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard
                        icon={<Star className="h-6 w-6 text-amber-500" />}
                        label="Puntos totales"
                        value={achievements.totalPoints}
                        bg="bg-amber-50"
                    />
                    <StatCard
                        icon={<Flame className="h-6 w-6 text-orange-500" />}
                        label="Racha actual"
                        value={achievements.currentStreak}
                        sub="días seguidos"
                        bg="bg-orange-50"
                    />
                    <StatCard
                        icon={<Zap className="h-6 w-6 text-blue-500" />}
                        label="Racha máxima"
                        value={achievements.longestStreak}
                        sub="días"
                        bg="bg-blue-50"
                    />
                    <StatCard
                        icon={<Trophy className="h-6 w-6 text-purple-500" />}
                        label="Insignias"
                        value={achievements.badges.length}
                        sub={`de ${BADGE_DEFINITIONS.length} posibles`}
                        bg="bg-purple-50"
                    />
                </div>
            </section>

            {/* Badges */}
            <section>
                <h2 className="text-ink font-display mb-4 text-xl font-bold">Insignias</h2>
                <BadgeGrid earnedCodes={earnedCodes} />
            </section>

            {/* Point history */}
            <section>
                <h2 className="text-ink font-display mb-4 text-xl font-bold">Últimos puntos</h2>
                <Card className="p-5">
                    {achievements.recentEvents.length === 0 ? (
                        <p className="text-mute text-sm">Aún no tienes eventos de puntos.</p>
                    ) : (
                        <div className="divide-border flex flex-col divide-y">
                            {achievements.recentEvents.map((ev) => (
                                <div
                                    key={ev.id}
                                    className="flex items-center justify-between py-2.5"
                                >
                                    <div>
                                        <p className="text-ink text-sm">{ev.reason}</p>
                                        <p className="text-mute text-xs">
                                            {SOURCE_LABELS[ev.sourceType] ?? ev.sourceType}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold text-amber-600">
                                        +{ev.amount} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </section>
        </div>
    );
}
