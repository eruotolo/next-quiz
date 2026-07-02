import { TrendingDown, TrendingUp } from 'lucide-react';
import {
    getRecentGradesForChart,
    type GradeTrendPoint,
} from '@/features/students/lib/dashboard-queries';

const VIEW_W = 480;
const VIEW_H = 180;
const PAD_X = 24;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;
const Y_MIN = 1.0;
const Y_MAX = 7.0;
const PASSING_GRADE = 4.0;

function xAt(i: number, n: number): number {
    if (n <= 1) return PAD_X;
    const usable = VIEW_W - PAD_X * 2;
    return PAD_X + (i * usable) / (n - 1);
}

function yAt(grade: number): number {
    const usable = VIEW_H - PAD_TOP - PAD_BOTTOM;
    const t = (grade - Y_MIN) / (Y_MAX - Y_MIN);
    return PAD_TOP + (1 - t) * usable;
}

export async function GradeTrendChart({ studentId }: { studentId: string }) {
    const points = await getRecentGradesForChart(studentId, 8);
    points.reverse();

    if (points.length === 0) {
        return <EmptyTrend />;
    }

    const pathLine = buildLinePath(points);
    const pathArea = buildAreaPath(points);
    const trend = computeTrend(points);
    const yPassing = yAt(PASSING_GRADE);

    return (
        <section
            aria-label="Tendencia de calificaciones"
            className="bg-surface border-border rounded-[16px] border p-5"
        >
            <header className="mb-3 flex items-start justify-between">
                <div>
                    <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                        Tendencia de notas
                    </h2>
                    <p className="text-mute text-[12px]">
                        Últimas {points.length} calificación{points.length === 1 ? '' : 'es'}.
                    </p>
                </div>
                {trend && (
                    <span
                        className={
                            trend.direction === 'up'
                                ? 'text-success inline-flex items-center gap-1 text-[12px] font-medium'
                                : trend.direction === 'down'
                                  ? 'text-destructive inline-flex items-center gap-1 text-[12px] font-medium'
                                  : 'text-mute inline-flex items-center gap-1 text-[12px] font-medium'
                        }
                    >
                        {trend.direction === 'up' ? (
                            <TrendingUp className="size-3.5" aria-hidden="true" />
                        ) : trend.direction === 'down' ? (
                            <TrendingDown className="size-3.5" aria-hidden="true" />
                        ) : null}
                        {trend.label}
                    </span>
                )}
            </header>

            <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                role="img"
                aria-label="Gráfico de evolución de calificaciones"
                className="w-full text-primary"
            >
                <defs>
                    <linearGradient id="gradeArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1f2eff" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#1f2eff" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {[1, 2, 3, 4, 5, 6, 7].map((g) => (
                    <line
                        key={g}
                        x1={PAD_X}
                        x2={VIEW_W - PAD_X}
                        y1={yAt(g)}
                        y2={yAt(g)}
                        stroke="currentColor"
                        className="text-border"
                        strokeOpacity={g === Math.round(PASSING_GRADE) ? 0.9 : 0.25}
                        strokeWidth={g === Math.round(PASSING_GRADE) ? 1 : 0.5}
                        strokeDasharray={g === Math.round(PASSING_GRADE) ? '3 3' : undefined}
                    />
                ))}

                <line
                    x1={PAD_X}
                    x2={VIEW_W - PAD_X}
                    y1={yPassing}
                    y2={yPassing}
                    stroke="currentColor"
                    className="text-mute"
                    strokeOpacity={0.6}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                />
                <text
                    x={VIEW_W - PAD_X}
                    y={yPassing - 4}
                    textAnchor="end"
                    className="fill-mute"
                    fontSize="9"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                    Aprobación · 4.0
                </text>

                <path d={pathArea} fill="url(#gradeArea)" />
                <path
                    d={pathLine}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {points.map((p, i) => {
                    const cx = xAt(i, points.length);
                    const cy = yAt(p.grade);
                    const dotColor = p.passed ? '#0f7c4a' : '#d5301f';
                    return (
                        <g key={p.id}>
                            <circle
                                cx={cx}
                                cy={cy}
                                r={4}
                                fill="white"
                                stroke={dotColor}
                                strokeWidth={2}
                            />
                            <title>
                                {p.examTitle} · {p.grade.toFixed(1)} (
                                {p.passed ? 'aprobado' : 'reprobado'})
                            </title>
                        </g>
                    );
                })}

                {[Y_MIN, 4, Y_MAX].map((g) => (
                    <text
                        key={g}
                        x={PAD_X - 6}
                        y={yAt(g) + 3}
                        textAnchor="end"
                        className="fill-mute"
                        fontSize="9"
                        fontFamily="ui-monospace, SFMono-Regular, monospace"
                    >
                        {g.toFixed(1)}
                    </text>
                ))}
            </svg>
        </section>
    );
}

function EmptyTrend() {
    return (
        <section
            aria-label="Tendencia de calificaciones"
            className="bg-surface border-border rounded-[16px] border p-5"
        >
            <header className="mb-3">
                <h2 className="font-display text-ink text-[16px] font-semibold tracking-[-0.01em]">
                    Tendencia de notas
                </h2>
                <p className="text-mute text-[12px]">Últimas calificaciones.</p>
            </header>
            <div className="flex h-[180px] flex-col items-center justify-center text-center">
                <p className="text-mute text-[13px]">Aún no rendiste exámenes.</p>
                <p className="text-mute mt-1 text-[12px]">
                  Tu evolución aparecerá acá después del primer examen.
                </p>
            </div>
        </section>
    );
}

function buildLinePath(points: GradeTrendPoint[]): string {
    if (points.length === 0) return '';
    const segments = points.map((p, i) => {
        const x = xAt(i, points.length);
        const y = yAt(p.grade);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return segments.join(' ');
}

function buildAreaPath(points: GradeTrendPoint[]): string {
    if (points.length === 0) return '';
    const firstX = xAt(0, points.length);
    const lastX = xAt(points.length - 1, points.length);
    const baseY = VIEW_H - PAD_BOTTOM;
    let path = `M${firstX.toFixed(2)},${baseY.toFixed(2)} `;
    for (let i = 0; i < points.length; i++) {
        const x = xAt(i, points.length);
        const y = yAt(points[i]?.grade ?? 0);
        path += `L${x.toFixed(2)},${y.toFixed(2)} `;
    }
    path += `L${lastX.toFixed(2)},${baseY.toFixed(2)} Z`;
    return path;
}

function computeTrend(points: GradeTrendPoint[]): {
    direction: 'up' | 'down' | 'flat';
    label: string;
} | null {
    if (points.length < 2) return null;
    const first = points[0]?.grade;
    const last = points[points.length - 1]?.grade;
    if (first === undefined || last === undefined) return null;
    const delta = last - first;
    const abs = Math.abs(delta);
    if (abs < 0.05) {
        return { direction: 'flat', label: 'estable' };
    }
    return {
        direction: delta > 0 ? 'up' : 'down',
        label: `${delta > 0 ? '+' : ''}${delta.toFixed(1)} vs. primer examen`,
    };
}

export { computeTrend, xAt, yAt };
