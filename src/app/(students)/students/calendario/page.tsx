import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, ChevronRight, ClipboardList, GraduationCap, Video } from 'lucide-react';
import {
    getDashboardContext,
    getMonthlyCalendarEvents,
    type CalendarEvent,
} from '@/features/students/lib/dashboard-queries';
import { cn } from '@/shared/lib/utils';

export const metadata = {
    title: 'Calendario · Aulika',
};

const MONTHS_ES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface CalendarPageProps {
    searchParams: Promise<{ mes?: string }>;
}

function parseMonth(value: string | undefined): { year: number; month: number } {
    const now = new Date();
    if (!value) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
        return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
    }
    return { year, month };
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
    const total = year * 12 + (month - 1) + delta;
    return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

function formatMonthKey(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
}

const COLOR_DOT: Record<CalendarEvent['color'], string> = {
    red: 'bg-destructive',
    yellow: 'bg-warning',
    blue: 'bg-primary',
};

const KIND_ICON: Record<CalendarEvent['kind'], typeof GraduationCap> = {
    exam: GraduationCap,
    assignment: ClipboardList,
    live_session: Video,
};

const KIND_LABEL: Record<CalendarEvent['kind'], string> = {
    exam: 'Examen',
    assignment: 'Tarea',
    live_session: 'Clase en vivo',
};

export default async function CalendarioPage({ searchParams }: CalendarPageProps) {
    const ctx = await getDashboardContext();
    if (!ctx) redirect('/students/examen/login');

    const sp = await searchParams;
    const { year, month } = parseMonth(sp.mes);
    const events = await getMonthlyCalendarEvents(ctx, year, month);

    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const firstWeekdayMon0 = (firstOfMonth.getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const cells: Array<{ day: number | null; date: Date | null }> = [];
    for (let i = 0; i < firstWeekdayMon0; i += 1) cells.push({ day: null, date: null });
    for (let d = 1; d <= daysInMonth; d += 1) {
        cells.push({ day: d, date: new Date(Date.UTC(year, month - 1, d)) });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, date: null });

    const eventsByDay = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
        const key = `${ev.date.getUTCFullYear()}-${ev.date.getUTCMonth()}-${ev.date.getUTCDate()}`;
        const arr = eventsByDay.get(key) ?? [];
        arr.push(ev);
        eventsByDay.set(key, arr);
    }

    const prev = shiftMonth(year, month, -1);
    const next = shiftMonth(year, month, 1);
    const monthName = MONTHS_ES[month - 1] ?? '';

    return (
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <header>
                <p className="text-mute mb-2 font-mono text-[10px] font-bold tracking-[0.12em] uppercase">
                    Cronograma
                </p>
                <h1 className="font-display text-ink text-[28px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">
                    Calendario
                </h1>
                <p className="text-ink-dim mt-2 text-[14px]">
                    Exámenes, entregas y clases en vivo en un solo lugar.
                </p>
            </header>

            <div className="bg-surface border-border rounded-[16px] border p-5">
                <div className="mb-4 flex items-center justify-between">
                    <Link
                        href={`/calendario?mes=${formatMonthKey(prev.year, prev.month)}` as `/${string}`}
                        className="border-border hover:bg-paper-warm inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium"
                        aria-label="Mes anterior"
                    >
                        <ChevronLeft className="size-3.5" aria-hidden="true" />
                        Anterior
                    </Link>
                    <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.01em]">
                        {monthName} {year}
                    </h2>
                    <Link
                        href={`/calendario?mes=${formatMonthKey(next.year, next.month)}` as `/${string}`}
                        className="border-border hover:bg-paper-warm inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium"
                        aria-label="Mes siguiente"
                    >
                        Siguiente
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                    </Link>
                </div>

                <div className="grid grid-cols-7 gap-1 font-mono text-[10px] tracking-wider text-[color:var(--mute)] uppercase">
                    {WEEKDAYS_ES.map((d) => (
                        <div key={d} className="px-2 py-1 text-center">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1">
                    {cells.map((cell, idx) => {
                        if (cell.day === null) {
                            return <div key={`empty-${idx}`} className="h-16 rounded-[8px]" />;
                        }
                        const key = `${cell.date?.getUTCFullYear()}-${cell.date?.getUTCMonth()}-${cell.date?.getUTCDate()}`;
                        const dayEvents = eventsByDay.get(key) ?? [];
                        return (
                            <div
                                key={`day-${cell.day}`}
                                className="bg-paper-warm border-border flex h-16 flex-col gap-1 rounded-[8px] border p-1.5"
                            >
                                <span className="text-ink-dim font-mono text-[11px] font-semibold">
                                    {cell.day}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {dayEvents.slice(0, 4).map((ev) => (
                                        <span
                                            key={ev.id}
                                            className={cn('size-1.5 rounded-full', COLOR_DOT[ev.color])}
                                            role="img"
                                            aria-label={`${KIND_LABEL[ev.kind]}: ${ev.title}`}
                                            title={ev.title}
                                        />
                                    ))}
                                    {dayEvents.length > 4 && (
                                        <span className="text-mute font-mono text-[9px]">
                                            +{dayEvents.length - 4}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3 font-mono text-[10px] tracking-wider uppercase">
                    <Legend color="red" label="Examen" />
                    <Legend color="yellow" label="Tarea" />
                    <Legend color="blue" label="Clase en vivo" />
                </div>
            </div>

            <section
                aria-labelledby="events-heading"
                className="bg-surface border-border rounded-[16px] border p-5"
            >
                <h2
                    id="events-heading"
                    className="font-display text-ink mb-3 text-[16px] font-semibold tracking-[-0.01em]"
                >
                    Eventos del mes
                    <span className="text-mute ml-1 font-mono text-[12px] font-medium">
                        ({events.length})
                    </span>
                </h2>
                {events.length === 0 ? (
                    <p className="text-mute text-[13px]">
                        No hay eventos programados para este mes.
                    </p>
                ) : (
                    <ul className="list-none divide-y divide-[color:var(--border)] p-0">
                        {events.map((ev) => {
                            const Icon = KIND_ICON[ev.kind];
                            return (
                                <li
                                    key={ev.id}
                                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                                >
                                    <span
                                        className={cn(
                                            'flex size-9 shrink-0 items-center justify-center rounded-full',
                                            ev.color === 'red' && 'bg-danger-wash text-destructive',
                                            ev.color === 'yellow' && 'bg-warning-wash text-warning',
                                            ev.color === 'blue' && 'bg-primary-wash text-primary',
                                        )}
                                    >
                                        <Icon className="size-4" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-ink truncate text-[13.5px] font-medium">
                                            {ev.title}
                                        </p>
                                        <p className="text-mute font-mono text-[11px]">
                                            {KIND_LABEL[ev.kind]} ·{' '}
                                            {ev.date.toLocaleDateString('es-CL', {
                                                weekday: 'short',
                                                day: '2-digit',
                                                month: 'short',
                                            })}{' '}
                                            · {ev.date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}

function Legend({ color, label }: { color: CalendarEvent['color']; label: string }) {
    return (
        <span className="text-mute flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', COLOR_DOT[color])} aria-hidden="true" />
            {label}
        </span>
    );
}