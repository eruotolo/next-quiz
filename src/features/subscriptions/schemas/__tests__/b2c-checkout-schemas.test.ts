import { describe, expect, it } from 'vitest';
import {
    b2cActivatePasswordSchema,
    b2cCheckoutSchema,
} from '../b2c-checkout.schemas';

describe('b2cCheckoutSchema', () => {
    const baseValid = {
        kind: 'COURSE' as const,
        courseId: '11111111-1111-4111-8111-111111111111',
        studentRut: '12.345.678-5',
        studentName: 'Juan',
        studentLastname: 'Pérez',
        studentEmail: 'juan@test.cl',
        acceptTerms: true,
    };

    it('acepta un payload completo y válido', () => {
        const r = b2cCheckoutSchema.safeParse(baseValid);
        expect(r.success).toBe(true);
    });

    it('normaliza el RUT con K verifier', () => {
        const r = b2cCheckoutSchema.safeParse({ ...baseValid, studentRut: '40-K' });
        expect(r.success).toBe(true);
    });

    it('rechaza RUT inválido', () => {
        const r = b2cCheckoutSchema.safeParse({ ...baseValid, studentRut: '12.345.678-0' });
        expect(r.success).toBe(false);
        if (!r.success) {
            expect(r.error.errors[0]?.message).toBe('RUT inválido');
        }
    });

    it('rechaza email mal formado', () => {
        const r = b2cCheckoutSchema.safeParse({ ...baseValid, studentEmail: 'no-es-email' });
        expect(r.success).toBe(false);
    });

    it('rechaza si no acepta los términos', () => {
        const r = b2cCheckoutSchema.safeParse({ ...baseValid, acceptTerms: false });
        expect(r.success).toBe(false);
    });

    it('rechaza courseId que no es UUID', () => {
        const r = b2cCheckoutSchema.safeParse({ ...baseValid, courseId: 'no-uuid' });
        expect(r.success).toBe(false);
    });

    it('rechaza nombre corto', () => {
        const r = b2cCheckoutSchema.safeParse({ ...baseValid, studentName: 'J' });
        expect(r.success).toBe(false);
    });
});

describe('b2cActivatePasswordSchema', () => {
    const baseValid = {
        token: 'abc123',
        password: 'Aulika2026',
        confirmPassword: 'Aulika2026',
    };

    it('acepta una contraseña fuerte con confirmación coincidente', () => {
        const r = b2cActivatePasswordSchema.safeParse(baseValid);
        expect(r.success).toBe(true);
    });

    it('rechaza contraseñas distintas', () => {
        const r = b2cActivatePasswordSchema.safeParse({
            ...baseValid,
            confirmPassword: 'Otra2026',
        });
        expect(r.success).toBe(false);
        if (!r.success) {
            expect(r.error.errors[0]?.message).toBe('Las contraseñas no coinciden');
        }
    });

    it('rechaza contraseñas sin mayúscula', () => {
        const r = b2cActivatePasswordSchema.safeParse({
            ...baseValid,
            password: 'aulika2026',
            confirmPassword: 'aulika2026',
        });
        expect(r.success).toBe(false);
    });

    it('rechaza contraseñas sin número', () => {
        const r = b2cActivatePasswordSchema.safeParse({
            ...baseValid,
            password: 'Aulikaaaaa',
            confirmPassword: 'Aulikaaaaa',
        });
        expect(r.success).toBe(false);
    });

    it('rechaza contraseñas demasiado cortas', () => {
        const r = b2cActivatePasswordSchema.safeParse({
            ...baseValid,
            password: 'A1b',
            confirmPassword: 'A1b',
        });
        expect(r.success).toBe(false);
    });
});
