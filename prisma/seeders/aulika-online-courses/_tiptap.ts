/**
 * Helpers para construir JSON Tiptap (lo que consume `TiptapEditor.tsx`).
 * Mantiene legible el contenido pedagógico sin repetir la estructura.
 */

export function t(text: string): { type: 'text'; text: string } {
    return { type: 'text', text };
}

export function p(...content: Array<unknown>): { type: 'paragraph'; content: unknown[] } {
    return { type: 'paragraph', content };
}

export function pText(text: string): unknown {
    return { type: 'paragraph', content: [t(text)] };
}

export function pBold(text: string): unknown {
    return {
        type: 'paragraph',
        content: [{ type: 'text', text, marks: [{ type: 'bold' }] }],
    };
}

export function h(level: 1 | 2 | 3, text: string): unknown {
    return {
        type: 'heading',
        attrs: { level },
        content: [t(text)],
    };
}

export function bullet(items: string[]): unknown {
    return {
        type: 'bulletList',
        content: items.map((item) => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: [t(item)] }],
        })),
    };
}

export function ordered(items: string[]): unknown {
    return {
        type: 'orderedList',
        content: items.map((item) => ({
            type: 'listItem',
            content: [{ type: 'paragraph', content: [t(item)] }],
        })),
    };
}

export function blockquote(text: string): unknown {
    return {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [t(text)] }],
    };
}

export function codeBlock(text: string, language = ''): unknown {
    return {
        type: 'codeBlock',
        attrs: { language },
        content: [t(text)],
    };
}

export function callout(text: string): unknown {
    return {
        type: 'paragraph',
        attrs: {},
        content: [
            {
                type: 'text',
                text: `💡 ${text}`,
                marks: [{ type: 'bold' }],
            },
        ],
    };
}

export function doc(...content: unknown[]): { type: 'doc'; content: unknown[] } {
    return { type: 'doc', content };
}

export function paesExample(question: string, solution: string): unknown[] {
    return [
        h(3, 'Ejercicio PAES tipo'),
        pText(question),
        h(3, 'Resolución'),
        pText(solution),
    ];
}