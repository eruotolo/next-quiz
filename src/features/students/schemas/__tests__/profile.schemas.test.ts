import { describe, expect, it } from 'vitest';
import { studentProfileUpdateSchema } from '../profile.schemas';

const valid = {
    name: 'Juan',
    lastname: 'Pérez',
    email: 'juan@test.cl',
    phone: '+56 9 1234 5678',
};

describe('studentProfileUpdateSchema', () => {
    it('acepta datos válidos', () => {
        const result = studentProfileUpdateSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it('permite phone vacío', () => {
        const result = studentProfileUpdateSchema.safeParse({ ...valid, phone: '' });
        expect(result.success).toBe(true);
    });

    it('rechaza name vacío', () => {
        const result = studentProfileUpdateSchema.safeParse({ ...valid, name: '   ' });
        expect(result.success).toBe(false);
    });

    it('rechaza lastname vacío', () => {
        const result = studentProfileUpdateSchema.safeParse({ ...valid, lastname: '' });
        expect(result.success).toBe(false);
    });

    it('rechaza email inválido', () => {
        const result = studentProfileUpdateSchema.safeParse({ ...valid, email: 'no-es-email' });
        expect(result.success).toBe(false);
    });

    it('rechaza name demasiado largo', () => {
        const result = studentProfileUpdateSchema.safeParse({
            ...valid,
            name: 'a'.repeat(101),
        });
        expect(result.success).toBe(false);
    });

    it('rechaza phone demasiado largo', () => {
        const result = studentProfileUpdateSchema.safeParse({
            ...valid,
            phone: '1'.repeat(21),
        });
        expect(result.success).toBe(false);
    });
});
