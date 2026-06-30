export function formatRelativeTime(date: Date, now: Date = new Date()): string {
    const diffMs = now.getTime() - date.getTime();
    const future = diffMs < 0;
    const absMs = Math.abs(diffMs);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;

    if (absMs < minute) return future ? 'en instantes' : 'hace instantes';
    if (absMs < hour) {
        const m = Math.round(absMs / minute);
        return future ? `en ${m} min` : `hace ${m} min`;
    }
    if (absMs < day) {
        const h = Math.round(absMs / hour);
        return future ? `en ${h} h` : `hace ${h} h`;
    }
    if (absMs < week) {
        const d = Math.round(absMs / day);
        return future ? `en ${d} d` : `hace ${d} d`;
    }
    const w = Math.round(absMs / week);
    return future ? `en ${w} sem` : `hace ${w} sem`;
}

export function formatUrgencyRelative(date: Date, now: Date = new Date()): string {
    const diffMs = date.getTime() - now.getTime();
    if (diffMs < 0) return 'vencido';
    if (diffMs < 60 * 60 * 1000) {
        const m = Math.max(1, Math.round(diffMs / 60000));
        return `en ${m} min`;
    }
    if (diffMs < 24 * 60 * 60 * 1000) {
        const h = Math.round(diffMs / (60 * 60 * 1000));
        return `en ${h} h`;
    }
    const d = Math.round(diffMs / (24 * 60 * 60 * 1000));
    return `en ${d} d`;
}