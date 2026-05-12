// Chilean RUT utilities.
// Storage format: digits + verifier (uppercase K if applies), no dots, no dash.
// Display format: NN.NNN.NNN-X

export function normalizeRut(input: string): string {
    return input.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRut(input: string): string {
    const clean = normalizeRut(input);
    if (clean.length < 2) return clean;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${withDots}-${dv}`;
}

export function isValidRut(input: string): boolean {
    const clean = normalizeRut(input);
    if (clean.length < 2) return false;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    if (!/^\d+$/.test(body)) return false;
    return computeVerifier(body) === dv;
}

function computeVerifier(body: string): string {
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += Number.parseInt(body[i] as string, 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = 11 - (sum % 11);
    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return String(remainder);
}
