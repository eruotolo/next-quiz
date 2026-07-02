import type { CSSProperties } from 'react';
import { Flame } from 'lucide-react';
import {
    getWeeklyActivityHeatmap,
    type HeatmapWeek,
} from '@/features/students/lib/dashboard-queries';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const CELL = 12;
const GAP = 3;
const PAD_LEFT = 16;
const PAD_TOP = 10;
const COL_W = CELL + GAP;

function intensityClass(count: number, max: number): string {
    if (count === 0) return 'bg-paper-warm';
    const ratio = count / Math.max(1, max);
    if (ratio < 0.25) return 'bg-primary/20';
    if (ratio < 0.5) return 'bg-primary/40';
    if (ratio < 0.75) return 'bg-primary/65';
    return 'bg-primary';
}

export { intensityClass };

export async function StreakHeatmap({ studentId }: { studentId: string }) {
    const weeks = await getWeeklyActivityHeatmap(studentId, 12);

    if (weeks.length === 0) {
        return null;
    }

    const max = Math.max(
        1,
        ...weeks.flatMap((w) => w.days.map((d) => d.count)),
    );
    const total = weeks.reduce(
        (acc, w) => acc + w.days.reduce((s, d) => s + d.count, 0),
        0,
    );

    const viewW = PAD_LEFT + weeks.length * COL_W;
    const viewH = PAD_TOP + 7 * COL_W;

    return (
        <section
            aria-label="Mapa de actividad"
            className="bg-surface border-border rounded-[16px] border p-5"
        >
            <header className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="font-display text-ink flex items-center gap-2 text-[16px] font-semibold tracking-[-0.01em]">
                        <Flame className="text-coral size-4" aria-hidden="true" />
                        Mapa de actividad
                    </h2>
                    <p className="text-mute text-[12px]">Últimas 12 semanas · {total} interacciones</p>
                </div>
                <Legend max={max} />
            </header>

            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${viewW} ${viewH}`}
                    role="img"
                    aria-label="Cuadrícula de actividad por día"
                    className="h-auto min-w-[var(--heatmap-min-w)]"
                    style={{ '--heatmap-min-w': `${viewW}px` } as CSSProperties}
                >
                    {DAY_LABELS.map((label, i) => (
                        <text
                            key={label}
                            x={2}
                            y={PAD_TOP + i * COL_W + CELL - 1}
                            fontSize="9"
                            className="fill-mute"
                            fontFamily="ui-monospace, SFMono-Regular, monospace"
                        >
                            {label}
                        </text>
                    ))}

                    {weeks.map((w, wi) => (
                        <g key={w.weekStart.toISOString()}>
                            {w.days.map((d, di) => {
                                const x = PAD_LEFT + wi * COL_W;
                                const y = PAD_TOP + di * COL_W;
                                const date = cellDate(w, di);
                                return (
                                    <g key={`${wi}-${di}`}>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={CELL}
                                            height={CELL}
                                            rx={2}
                                            className={intensityClass(d.count, max)}
                                        >
                                            <title>
                                                {formatCellDate(date)} · {d.count}{' '}
                                                interacción{d.count === 1 ? '' : 'es'}
                                                {d.total > 0 ? ` · +${d.total} XP` : ''}
                                            </title>
                                        </rect>
                                    </g>
                                );
                            })}
                        </g>
                    ))}
                </svg>
            </div>
        </section>
    );
}

function Legend({ max }: { max: number }) {
    return (
        <div className="text-mute flex items-center gap-2 text-[11px]">
            <span>Menos</span>
            <div className="flex items-center gap-1">
                <span className="bg-paper-warm block size-3 rounded-sm" />
                <span className="bg-primary/20 block size-3 rounded-sm" />
                <span className="bg-primary/40 block size-3 rounded-sm" />
                <span className="bg-primary/65 block size-3 rounded-sm" />
                <span className="bg-primary block size-3 rounded-sm" />
            </div>
            <span>{max}+</span>
        </div>
    );
}

function cellDate(week: HeatmapWeek, dayIndex: number): Date {
    const d = new Date(week.weekStart);
    d.setUTCDate(d.getUTCDate() + dayIndex);
    return d;
}

// Always format in UTC: heatmap days are grouped by UTC day (see
// `getWeeklyActivityHeatmap`), so the tooltip must match the column's
// date. Using the client's local zone would also cause a hydration
// mismatch (Node defaults to UTC, browser to local).
function formatCellDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    }).format(date);
}
