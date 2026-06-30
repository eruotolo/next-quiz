import {
    Flame,
    GraduationCap,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { StatTile } from '@/shared/components/ui/stat-tile';
import {
    getGradeAverage,
    getLmsProgressAverage,
    getStreakInfo,
    getTotalXp,
} from '@/features/students/lib/dashboard-queries';

interface StatTilesGridProps {
    studentId: string;
    hasLms: boolean;
}

function formatGrade(avg: number | null): string {
    if (avg === null) return '—';
    return avg.toFixed(1);
}

export async function StatTilesGrid({ studentId, hasLms }: StatTilesGridProps) {
    const [grades, progress, streak, xp] = await Promise.all([
        getGradeAverage(studentId),
        hasLms ? getLmsProgressAverage(studentId) : Promise.resolve(null),
        hasLms ? getStreakInfo(studentId) : Promise.resolve(null),
        hasLms ? getTotalXp(studentId) : Promise.resolve(null),
    ]);

    return (
        <section
            aria-label="Indicadores principales"
            className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
            <StatTile
                label="Promedio general"
                value={formatGrade(grades.average)}
                sub={
                    grades.totalExams === 0
                        ? 'Sin exámenes rendidos'
                        : `${grades.totalExams} examen${grades.totalExams === 1 ? '' : 'es'} rendido${grades.totalExams === 1 ? '' : 's'}`
                }
                icon={<GraduationCap className="size-4" aria-hidden="true" />}
                tone="primary"
            />
            {hasLms ? (
                <StatTile
                    label="Progreso LMS"
                    value={progress?.average === null ? '—' : `${progress?.average ?? 0}%`}
                    sub={
                        progress?.activeCount === 0
                            ? 'Sin cursos activos'
                            : `${progress?.activeCount ?? 0} curso${(progress?.activeCount ?? 0) === 1 ? '' : 's'} activo${(progress?.activeCount ?? 0) === 1 ? '' : 's'}`
                    }
                    icon={<TrendingUp className="size-4" aria-hidden="true" />}
                />
            ) : (
                <StatTile
                    label="Exámenes rendidos"
                    value={grades.totalExams}
                    sub="Histórico acumulado"
                    icon={<TrendingUp className="size-4" aria-hidden="true" />}
                />
            )}
            {hasLms && (
                <StatTile
                    label="Racha activa"
                    value={`${streak?.current ?? 0} d`}
                    sub={
                        streak && streak.longest > 0
                            ? `Mejor racha: ${streak.longest} días`
                            : 'Empezá hoy'
                    }
                    icon={<Flame className="size-4" aria-hidden="true" />}
                    tone="lime"
                />
            )}
            {hasLms && (
                <StatTile
                    label="Puntos XP"
                    value={xp ?? 0}
                    sub="Acumulados en la plataforma"
                    icon={<Sparkles className="size-4" aria-hidden="true" />}
                    tone="ink"
                />
            )}
        </section>
    );
}