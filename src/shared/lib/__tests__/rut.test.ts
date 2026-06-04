import { describe, expect, it } from 'vitest';
import { formatRut, isValidRut, normalizeRut } from '../rut';

describe('normalizeRut', () => {
    it('removes dots and dashes', () => {
        expect(normalizeRut('12.345.678-9')).toBe('123456789');
    });

    it('uppercases K verifier', () => {
        expect(normalizeRut('40-k')).toBe('40K');
    });

    it('strips non-alphanumeric characters', () => {
        expect(normalizeRut('  12 345 678 9  ')).toBe('123456789');
    });

    it('returns empty string on empty input', () => {
        expect(normalizeRut('')).toBe('');
    });

    it('keeps already-normalized RUT unchanged', () => {
        expect(normalizeRut('123456785')).toBe('123456785');
    });
});

describe('formatRut', () => {
    it('formats 8-digit body with dots and dash', () => {
        expect(formatRut('123456785')).toBe('12.345.678-5');
    });

    it('formats a K-verifier RUT', () => {
        expect(formatRut('40K')).toBe('40-K');
    });

    it('formats already-dotted input', () => {
        expect(formatRut('12.345.678-5')).toBe('12.345.678-5');
    });

    it('handles a single char without crashing', () => {
        expect(formatRut('9')).toBe('9');
    });
});

describe('isValidRut', () => {
    it('validates a known valid RUT (12345678-5)', () => {
        expect(isValidRut('123456785')).toBe(true);
    });

    it('validates repeated-digit RUT (11111111-1)', () => {
        expect(isValidRut('111111111')).toBe(true);
    });

    it('validates a K-verifier RUT (40-K)', () => {
        expect(isValidRut('40K')).toBe(true);
    });

    it('validates formatted input with dots and dashes', () => {
        expect(isValidRut('12.345.678-5')).toBe(true);
    });

    it('rejects a RUT with wrong verifier', () => {
        expect(isValidRut('123456780')).toBe(false);
    });

    it('rejects single character input', () => {
        expect(isValidRut('9')).toBe(false);
    });

    it('rejects empty string', () => {
        expect(isValidRut('')).toBe(false);
    });

    it('strips non-[0-9kK] chars before validating — X becomes a wrong body+verifier split', () => {
        // '12345678X' normalizes to '12345678' → body='1234567', dv='8' (wrong, expected 4)
        expect(isValidRut('12345678X')).toBe(false);
    });
});
