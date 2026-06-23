export const timeFormatter = new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

export const dateShortFormatter = new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
});

export const weekdayFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'short' });

export const completedFormatter = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
});

export function startOfDay(d: Date): number {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
}

export function dayDiff(date: Date, now: Date): number {
    return Math.round((startOfDay(date) - startOfDay(now)) / (24 * 60 * 60 * 1000));
}

export function dayLabel(date: Date, now: Date): string {
    const diff = dayDiff(date, now);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    return weekdayFormatter.format(date);
}

export function opensLabel(date: Date, now: Date): string {
    const diff = dayDiff(date, now);
    const time = timeFormatter.format(date);
    if (diff === 0) return `Abre hoy · ${time}`;
    if (diff === 1) return `Abre mañana · ${time}`;
    return `${dateShortFormatter.format(date)} · ${time}`;
}

export function closesLabel(date: Date, now: Date): string {
    const diff = dayDiff(date, now);
    const time = timeFormatter.format(date);
    if (diff === 0) return `Cierra hoy · ${time}`;
    if (diff === 1) return `Cierra mañana · ${time}`;
    return `Cierra · ${dateShortFormatter.format(date)} · ${time}`;
}

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
