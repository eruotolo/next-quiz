import { describe, expect, it } from 'vitest';
import { sanitizeChatText } from '@/shared/lib/sanitize';

describe('sanitizeChatText', () => {
    it('preserva texto plano', () => {
        expect(sanitizeChatText('hola mundo')).toBe('hola mundo');
    });

    it('elimina tags HTML completos (incluyendo contenido de atributos peligrosos)', () => {
        expect(sanitizeChatText('Hola <b>mundo</b>')).toBe('Hola mundo');
        expect(sanitizeChatText('<script>alert(1)</script>safe')).toBe('alert(1)safe');
        expect(sanitizeChatText('<img src=x onerror=alert(1)>')).toBe('');
        expect(sanitizeChatText('<a href="javascript:alert(1)">link</a>')).toBe('link');
    });

    it('elimina `<` y `>` sueltos', () => {
        expect(sanitizeChatText('1 < 2 es true')).toBe('1  2 es true');
        expect(sanitizeChatText('a > b')).toBe('a  b');
    });

    it('elimina tags malformados', () => {
        expect(sanitizeChatText('<unfinished tag')).toBe('unfinished tag');
        expect(sanitizeChatText('<script')).toBe('script');
        expect(sanitizeChatText('<<<<>>>>>')).toBe('');
    });

    it('bloquea javascript: scheme', () => {
        expect(sanitizeChatText('ver javascript:alert(1)')).not.toMatch(/javascript:/i);
        expect(sanitizeChatText('hacer data:text/html,test')).not.toMatch(/data:/i);
        expect(sanitizeChatText('file:///etc/passwd')).not.toMatch(/file:/i);
    });

    it('preserva saltos de línea y emojis', () => {
        expect(sanitizeChatText('Hola\nmundo 🎉')).toBe('Hola\nmundo 🎉');
    });

    it('elimina caracteres de control pero conserva \\n y \\t', () => {
        expect(sanitizeChatText('hola\u0000mundo')).toBe('holamundo');
        expect(sanitizeChatText('hola\u0007mundo')).toBe('holamundo');
        expect(sanitizeChatText('hola\tmundo')).toBe('hola\tmundo');
    });

    it('normaliza con NFKC', () => {
        expect(sanitizeChatText('café')).toBe('café');
        expect(sanitizeChatText('①')).toBe('1');
    });

    it('trim el resultado final', () => {
        expect(sanitizeChatText('   hola   ')).toBe('hola');
        expect(sanitizeChatText('')).toBe('');
    });
});
