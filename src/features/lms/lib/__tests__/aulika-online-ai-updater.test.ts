import { describe, expect, it } from 'vitest';
import {
    markdownToTiptapJson,
    validateSuggestions,
} from '@/features/lms/lib/aulika-online-ai-updater';

describe('aulika-online-ai-updater', () => {
    describe('markdownToTiptapJson', () => {
        it('convierte párrafos simples a doc con nodos paragraph', () => {
            const result = markdownToTiptapJson('Hola mundo') as { type: string; content: unknown[] };
            expect(result.type).toBe('doc');
            expect(result.content).toHaveLength(1);
            expect(result.content[0]).toMatchObject({
                type: 'paragraph',
                content: [{ type: 'text', text: 'Hola mundo' }],
            });
        });

        it('reconoce headings nivel 1 y 2', () => {
            const md = '# Título\n## Subtítulo\nTexto';
            const result = markdownToTiptapJson(md) as { content: Array<{ type: string }> };
            expect(result.content[0]).toMatchObject({ type: 'heading', attrs: { level: 1 } });
            expect(result.content[1]).toMatchObject({ type: 'heading', attrs: { level: 2 } });
            expect(result.content[2]).toMatchObject({ type: 'paragraph' });
        });

        it('agrupa items consecutivos en una bulletList', () => {
            const md = '- Uno\n- Dos\n- Tres';
            const result = markdownToTiptapJson(md) as { content: Array<{ type: string }> };
            expect(result.content[0]).toMatchObject({ type: 'bulletList' });
            const list = result.content[0] as unknown as { content: unknown[] };
            expect(list.content).toHaveLength(3);
        });

        it('extrae bloques de código delimitados por ```', () => {
            const md = 'Antes\n```\nconst x = 1\n```\nDespués';
            const result = markdownToTiptapJson(md) as { content: Array<{ type: string }> };
            expect(result.content[0]).toMatchObject({ type: 'paragraph' });
            expect(result.content[1]).toMatchObject({ type: 'codeBlock' });
            const code = result.content[1] as unknown as { content: Array<{ text: string }> };
            expect(code.content[0]?.text).toBe('const x = 1');
            expect(result.content[2]).toMatchObject({ type: 'paragraph' });
        });

        it('ignora líneas vacías', () => {
            const md = 'Hola\n\n\nMundo';
            const result = markdownToTiptapJson(md) as { content: unknown[] };
            expect(result.content).toHaveLength(2);
        });

        it('maneja input vacío', () => {
            const result = markdownToTiptapJson('') as { type: string; content: unknown[] };
            expect(result.type).toBe('doc');
            expect(result.content).toHaveLength(0);
        });
    });

    describe('validateSuggestions', () => {
        it('devuelve [] cuando el input no es objeto', () => {
            expect(validateSuggestions(null)).toEqual([]);
            expect(validateSuggestions(undefined)).toEqual([]);
            expect(validateSuggestions('foo')).toEqual([]);
            expect(validateSuggestions(42)).toEqual([]);
        });

        it('devuelve [] cuando lessons no es array', () => {
            expect(validateSuggestions({ lessons: 'no' })).toEqual([]);
            expect(validateSuggestions({})).toEqual([]);
        });

        it('filtra entries que no son objetos', () => {
            const result = validateSuggestions({ lessons: [null, 'x', 1, {}] });
            expect(result).toEqual([]);
        });

        it('filtra lessons con bodyMarkdown demasiado corto (< 400 chars)', () => {
            const result = validateSuggestions({
                lessons: [
                    {
                        title: 'Tema nuevo',
                        moduleTitle: 'Módulo',
                        summary: 'Resumen',
                        bodyMarkdown: 'Muy corto',
                    },
                ],
            });
            expect(result).toEqual([]);
        });

        it('filtra lessons con campos no-string', () => {
            const longText = 'a'.repeat(500);
            const result = validateSuggestions({
                lessons: [
                    {
                        title: 123,
                        moduleTitle: 'Módulo',
                        summary: 'Resumen',
                        bodyMarkdown: longText,
                    },
                ],
            });
            expect(result).toEqual([]);
        });

        it('acepta lessons válidas y devuelve máximo 2', () => {
            const longText = 'a'.repeat(500);
            const result = validateSuggestions({
                lessons: [
                    {
                        title: 'Tema A',
                        moduleTitle: 'Módulo A',
                        summary: 'S',
                        bodyMarkdown: longText,
                    },
                    {
                        title: 'Tema B',
                        moduleTitle: 'Módulo A',
                        summary: 'S',
                        bodyMarkdown: longText,
                    },
                    {
                        title: 'Tema C',
                        moduleTitle: 'Módulo A',
                        summary: 'S',
                        bodyMarkdown: longText,
                    },
                ],
            });
            expect(result).toHaveLength(2);
            expect(result[0]?.title).toBe('Tema A');
            expect(result[1]?.title).toBe('Tema B');
        });

        it('trunca campos a longitudes razonables', () => {
            const longText = 'b'.repeat(60_000);
            const result = validateSuggestions({
                lessons: [
                    {
                        title: 't'.repeat(500),
                        moduleTitle: 'm'.repeat(500),
                        summary: 's'.repeat(1000),
                        bodyMarkdown: longText,
                    },
                ],
            });
            expect(result[0]?.title.length).toBe(200);
            expect(result[0]?.moduleTitle.length).toBe(200);
            expect(result[0]?.summary.length).toBe(500);
            expect(result[0]?.bodyMarkdown.length).toBe(50_000);
        });
    });
});