/**
 * Sanitizador HTML/Markdown para foros del LMS.
 *
 * Implementación sin dependencias para evitar crecer el bundle. La cobertura
 * XSS apunta a los vectores más comunes en foros públicos (OWASP XSS Filter
 * Evasion Cheat Sheet). Si en alguna capa se introduce contenido HTML
 * confiable (por ejemplo embeds oficiales), se debe extender `ALLOWED_TAGS`
 * explícitamente y añadir test al cascarón.
 *
 * Reglas de oro:
 *   - Nunca persistir HTML crudo del usuario. La BD guarda Markdown; el render
 *     siempre llama a `sanitizeForumMarkdown()`.
 *   - Toda URL aceptada debe estar en la allowlist de protocolos.
 *   - El sanitizer es defensivo: strip por defecto, allow por excepción.
 */

const ENTITY_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
};

const ATTR_ENTITY_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export function escapeHtml(input: string): string {
    return input.replace(/[&<>"'/]/g, (ch) => {
        const val = ENTITY_MAP[ch];
        return val ?? ch;
    });
}

function escapeAttr(input: string): string {
    return input.replace(/[&<>"']/g, (ch) => {
        const val = ATTR_ENTITY_MAP[ch];
        return val ?? ch;
    });
}

const ALLOWED_TAGS = new Set([
    'p',
    'br',
    'b',
    'strong',
    'i',
    'em',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'h3',
    'h4',
    'a',
]);

const ALLOWED_URL_SCHEMES = /^(https?:|mailto:)/i;
const FORBIDDEN_URL_PREFIXES = /^\s*(javascript|data|vbscript|file|about):/i;

const VOID_ELEMENTS = new Set(['br']);

/**
 * Sanitiza HTML permitiendo solo los tags de la whitelist. Mantiene una pila
 * de elementos abiertos para auto-cerrarlos al final del documento y rechaza
 * URLs con protocolo inseguro (javascript:, data:text/html, etc.).
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: state machine deliberate
export function sanitizeHtml(input: string): string {
    if (!input) return '';

    const normalized = input.replace(/\r\n?/g, '\n').normalize('NFKC');

    const out: string[] = [];
    const stack: string[] = [];
    let buffer = '';
    let i = 0;

    const flushBuffer = () => {
        if (buffer) {
            out.push(escapeHtml(buffer));
            buffer = '';
        }
    };

    while (i < normalized.length) {
        const ch = normalized[i];

        if (ch !== '<') {
            buffer += ch;
            i++;
            continue;
        }

        const close = normalized.indexOf('>', i + 1);
        if (close === -1) {
            buffer += normalized.slice(i);
            i = normalized.length;
            break;
        }

        const raw = normalized.slice(i + 1, close);
        const isClose = raw.startsWith('/');
        const inner = (isClose ? raw.slice(1) : raw).replace(/\/$/, '').trim();
        const match = /^([a-zA-Z][a-zA-Z0-9]*)(?:\s+([^>]*))?$/.exec(inner);

        if (!match) {
            buffer += normalized.slice(i, close + 1);
            i = close + 1;
            continue;
        }

        const tagName = (match[1] ?? '').toLowerCase();
        const attrsRaw = match[2] ?? '';

        flushBuffer();

        if (VOID_ELEMENTS.has(tagName)) {
            out.push('<br />');
            i = close + 1;
            continue;
        }

        if (isClose) {
            if (stack.length > 0 && stack[stack.length - 1] === tagName) {
                stack.pop();
                out.push(`</${tagName}>`);
            }
            i = close + 1;
            continue;
        }

        if (!ALLOWED_TAGS.has(tagName)) {
            i = close + 1;
            continue;
        }

        if (tagName === 'a') {
            const href = extractAttr(attrsRaw, 'href');
            const title = extractAttr(attrsRaw, 'title');
            if (!href || !ALLOWED_URL_SCHEMES.test(href) || FORBIDDEN_URL_PREFIXES.test(href)) {
                i = close + 1;
                continue;
            }
            const safeHref = escapeAttr(href);
            const safeTitle = title ? ` title="${escapeAttr(title)}"` : '';
            out.push(`<a href="${safeHref}"${safeTitle} rel="noopener noreferrer nofollow">`);
        } else {
            out.push(`<${tagName}>`);
            stack.push(tagName);
        }

        i = close + 1;
    }

    flushBuffer();

    while (stack.length > 0) {
        const tag = stack.pop();
        if (tag) out.push(`</${tag}>`);
    }

    return out.join('');
}

function extractAttr(attrsRaw: string, name: string): string | null {
    const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i');
    const m = re.exec(attrsRaw);
    if (!m) return null;
    const value = m[1] ?? m[2] ?? m[3] ?? '';
    return decodeEntities(value).trim();
}

function decodeEntities(input: string): string {
    return input
        .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
        .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number.parseInt(d, 10)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

/**
 * Convierte Markdown básico a HTML seguro. Cubre los casos más usados en
 * foros educativos sin pretender ser CommonMark completo:
 *
 *   - Párrafos (línea en blanco como separador)
 *   - Énfasis: `*foo*` / `_foo_` (italic) y `**foo**` / `__foo__` (bold)
 *   - Links: `[texto](url)` — solo http(s) y mailto
 *   - Inline code: `` `code` ``
 *   - Bloques de código: ``` ```js ... ``` ```
 *   - Listas no ordenadas: `- item`
 *   - Listas ordenadas: `1. item`
 *   - Citas: `> texto`
 *   - Encabezados `### ` y `#### `
 *
 * Estrategia defensiva: el texto suelto siempre pasa por `escapeHtml`
 * primero; luego se emiten solo las construcciones permitidas desde tokens
 * que el parser reconoce. Las URLs se validan contra la allowlist de
 * esquemas antes de generar el atributo.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: parser intencionalmente elaborado
export function sanitizeForumMarkdown(input: string): string {
    if (!input) return '';
    const lines = input.replace(/\r\n?/g, '\n').split('\n');
    const html: string[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i] ?? '';
        if (line.trim() === '') {
            i++;
            continue;
        }

        const fenceMatch = /^```(\w*)\s*$/.exec(line);
        if (fenceMatch) {
            const lang = fenceMatch[1] ?? '';
            const code: string[] = [];
            i++;
            while (i < lines.length) {
                const cur = lines[i] ?? '';
                if (/^```\s*$/.test(cur)) break;
                code.push(cur);
                i++;
            }
            if (i < lines.length) i++;
            const attr =
                lang && /^[a-z0-9+#-]{1,20}$/i.test(lang)
                    ? ` class="lang-${escapeAttr(lang)}"`
                    : '';
            html.push(`<pre><code${attr}>${escapeHtml(code.join('\n'))}</code></pre>`);
            continue;
        }

        const headingMatch = /^(#{3,4})\s+(.+)$/.exec(line);
        if (headingMatch) {
            const level = (headingMatch[1] ?? '').length;
            const tag = level === 3 ? 'h3' : 'h4';
            html.push(`<${tag}>${renderInline(headingMatch[2] ?? '')}</${tag}>`);
            i++;
            continue;
        }

        if (/^>\s?/.test(line)) {
            const quote: string[] = [];
            while (i < lines.length) {
                const cur = lines[i] ?? '';
                if (!/^>\s?/.test(cur)) break;
                quote.push(cur.replace(/^>\s?/, ''));
                i++;
            }
            html.push(`<blockquote><p>${renderInline(quote.join(' '))}</p></blockquote>`);
            continue;
        }

        const ulMatch = /^-\s+(.+)$/.exec(line);
        const olMatch = /^\d+\.\s+(.+)$/.exec(line);
        if (ulMatch || olMatch) {
            const isOrdered = Boolean(olMatch);
            const tag = isOrdered ? 'ol' : 'ul';
            const re = isOrdered ? /^\d+\.\s+(.+)$/ : /^-\s+(.+)$/;
            html.push(`<${tag}>`);
            while (i < lines.length) {
                const cur = lines[i] ?? '';
                if (!re.test(cur)) break;
                const itemMatch = re.exec(cur);
                const item = itemMatch ? (itemMatch[1] ?? '') : '';
                html.push(`<li>${renderInline(item)}</li>`);
                i++;
            }
            html.push(`</${tag}>`);
            continue;
        }

        const para: string[] = [line];
        i++;
        while (i < lines.length) {
            const cur = lines[i] ?? '';
            if (
                cur.trim() === '' ||
                /^([-]\s|\d+\.\s|#{3,4}\s|>\s|```)/.test(cur)
            ) {
                break;
            }
            para.push(cur);
            i++;
        }
        html.push(`<p>${renderInline(para.join(' '))}</p>`);
    }

    return html.join('\n');
}

const PLACEHOLDER_OPEN = '\u0001';
const PLACEHOLDER_CLOSE = '\u0002';
const PLACEHOLDER = (n: number): string => `${PLACEHOLDER_OPEN}${n}${PLACEHOLDER_CLOSE}`;

type InlineToken =
    | { type: 'code'; value: string }
    | { type: 'bold'; value: string }
    | { type: 'italic'; value: string }
    | { type: 'link'; label: string; url: string };

/**
 * Render inline seguro. Trabaja en 2 pasos:
 *   1. Tokenizar el input reemplazando URLs/código/énfasis por placeholders.
 *   2. Escapar el resto del texto y restaurar los placeholders con HTML
 *      seguro emitido por nosotros.
 *
 * Así es imposible que el contenido literal del usuario termine dentro de
 * un tag real sin control: solo lo que nosotros mismos emitimos se mete
 * dentro de `<strong>`, `<em>`, `<code>`, `<a>`.
 */
function renderInline(input: string): string {
    const tokens: InlineToken[] = [];
    const reText = new RegExp(`${PLACEHOLDER_OPEN}(\\d+)${PLACEHOLDER_CLOSE}`, 'g');

    const tok = (t: InlineToken): string => {
        const index = tokens.length;
        tokens.push(t);
        return PLACEHOLDER(index);
    };

    let text = input;

    text = text.replace(/`([^`\n]+)`/g, (_m, code) => tok({ type: 'code', value: code }));
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => {
        if (!ALLOWED_URL_SCHEMES.test(url) || FORBIDDEN_URL_PREFIXES.test(url)) {
            return _m;
        }
        return tok({ type: 'link', label, url });
    });
    text = text.replace(/\*\*([^*\n]+)\*\*/g, (_m, value) =>
        tok({ type: 'bold', value }),
    );
    text = text.replace(/__([^_\n]+)__/g, (_m, value) =>
        tok({ type: 'bold', value }),
    );
    text = text.replace(/(^|[^*\w])\*([^*\n]+)\*(?=[^*\w]|$)/g, (_m, lead, value) =>
        lead + tok({ type: 'italic', value }),
    );
    text = text.replace(/(^|[^_\w])_([^_\n]+)_(?=[^_\w]|$)/g, (_m, lead, value) =>
        lead + tok({ type: 'italic', value }),
    );

    let escaped = escapeHtml(text);

    escaped = escaped.replace(reText, (_m, idx) => {
        const i = Number.parseInt(idx, 10);
        const t = tokens[i];
        if (!t) return '';
        switch (t.type) {
            case 'code':
                return `<code>${escapeHtml(t.value)}</code>`;
            case 'bold':
                return `<strong>${escapeHtml(t.value)}</strong>`;
            case 'italic':
                return `<em>${escapeHtml(t.value)}</em>`;
            case 'link':
                return `<a href="${escapeAttr(t.url)}" rel="noopener noreferrer nofollow">${escapeHtml(t.label)}</a>`;
        }
    });

    return escaped;
}

/**
 * Limpia texto plano de chat en vivo. A diferencia de `sanitizeForumMarkdown`,
 * elimina todo HTML/markdown y deja solo texto con caracteres seguros. Esto es
 * lo correcto para un chat donde se renderiza como `<div>{content}</div>` sin
 * escape (React sí escapa por defecto, pero queremos una capa adicional de
 * defensa en profundidad contra payloads con embeds invisibles).
 */
export function sanitizeChatText(input: string): string {
    if (!input) return '';

    const stripped = input
        .replace(/\r\n?/g, '\n')
        .normalize('NFKC')
        // Para chat en vivo el contenido debe ser texto plano. Eliminamos
        // cualquier caracter de apertura de tag XML/HTML y su cierre asociado,
        // además de `<` y `>` sueltos. Esto neutraliza payloads como
        // "<img src=x onerror=alert(1)>", "<script", "<unfinished tag" o
        // "<<X>>>>>".
        .replace(/<[^>]*>/g, '')
        .replace(/<>/g, '')
        .replace(/[<>]/g, '')
        // biome-ignore lint/suspicious/noControlCharactersInRegex: explícito
        .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
        .replace(/(?:javascript|data|vbscript|file):/gi, '');

    return stripped.trim();
}
