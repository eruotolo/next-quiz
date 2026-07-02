import { randomBytes } from 'node:crypto';

const ACTIVATION_TOKEN_TTL_HOURS = 24;

/**
 * Genera un activation token aleatorio (32 bytes hex) y su fecha de expiración
 * (24 h). Reutilizable desde el webhook B2C y tests; sin acceso a DB ni red.
 */
export function generateActivationToken(): { token: string; expiresAt: Date } {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
    return { token, expiresAt };
}
