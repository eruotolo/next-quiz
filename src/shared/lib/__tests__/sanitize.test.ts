import { describe, expect, it } from 'vitest';
import {
    escapeHtml,
    sanitizeHtml,
    sanitizeForumMarkdown,
} from '../sanitize';

describe('escapeHtml', () => {
    it('escapes standard XSS characters', () => {
        expect(escapeHtml('<script>alert(1)</script>')).toBe(
            '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;',
        );
    });

    it('escapes quotes and ampersands', () => {
        expect(escapeHtml(`Tom & "Jerry" 'love' <cake>`)).toBe(
            'Tom &amp; &quot;Jerry&quot; &#39;love&#39; &lt;cake&gt;',
        );
    });
});

describe('sanitizeHtml', () => {
    it('strips script tags entirely', () => {
        const input = 'Hello <script>alert(1)</script> world';
        expect(sanitizeHtml(input)).toBe('Hello alert(1) world');
    });

    it('strips onerror and other event handlers', () => {
        const input = '<img src="x" onerror="alert(1)" />';
        const out = sanitizeHtml(input);
        expect(out).not.toContain('onerror');
        expect(out).not.toContain('img');
    });

    it('strips style attribute (CSS vector for exfiltration)', () => {
        const input = '<div style="background:url(javascript:alert(1))">x</div>';
        const out = sanitizeHtml(input);
        expect(out).not.toContain('style');
    });

    it('strips iframe and object embeds', () => {
        const input = '<iframe src="https://evil.com"></iframe><object data="x"></object>';
        const out = sanitizeHtml(input);
        expect(out).not.toContain('iframe');
        expect(out).not.toContain('object');
    });

    it('rejects javascript: and data: URLs in href without emitting an active link', () => {
        const input = '<a href="javascript:alert(1)">click</a>';
        const out = sanitizeHtml(input);
        expect(out).not.toMatch(/<a\s+href=/i);
        expect(out).toContain('click');
        expect(out).not.toMatch(/href=&quot;/);
    });

    it('rejects data:text/html URL without emitting an active link', () => {
        const input = '<a href="data:text/html,<script>alert(1)</script>">x</a>';
        const out = sanitizeHtml(input);
        expect(out).not.toMatch(/<a\s+href=/i);
        expect(out).toContain('x');
    });

    it('allows safe https link', () => {
        const input = '<a href="https://example.com" title="Example">link</a>';
        const out = sanitizeHtml(input);
        expect(out).toContain('href="https://example.com"');
        expect(out).toContain('title="Example"');
        expect(out).toContain('rel="noopener noreferrer nofollow"');
    });

    it('allows mailto link', () => {
        const input = '<a href="mailto:test@test.com">mail</a>';
        expect(sanitizeHtml(input)).toContain('href="mailto:test@test.com"');
    });

    it('allows common formatting tags', () => {
        const input = '<p><strong>Hi</strong> <em>there</em></p>';
        expect(sanitizeHtml(input)).toBe('<p><strong>Hi</strong> <em>there</em></p>');
    });

    it('converts br to self-closing', () => {
        expect(sanitizeHtml('<br>')).toBe('<br />');
        expect(sanitizeHtml('<br/>')).toBe('<br />');
        expect(sanitizeHtml('<br />')).toBe('<br />');
    });

    it('neutralizes encoded entities that try to bypass filter', () => {
        const input = '&#x3c;script&#x3e;alert(1)&#x3c;&#x2F;script&#x3e;';
        const out = sanitizeHtml(input);
        expect(out).not.toContain('<script');
        expect(out).not.toMatch(/<script/i);
    });

    it('handles malformed tags by stripping unknown tags and auto-closing opened allowed ones', () => {
        const input = '<unclosed><b>bold';
        const out = sanitizeHtml(input);
        expect(out).not.toContain('<unclosed');
        expect(out).toContain('<b>');
        expect(out).toContain('</b>');
    });

    it('keeps content after illegal tags as escaped text', () => {
        const input = 'pre<script>x</script>post';
        const out = sanitizeHtml(input);
        expect(out).toBe('prexpost');
    });
});

describe('sanitizeForumMarkdown', () => {
    it('converts emphasis and links', () => {
        const md = '**hola** _mundo_ [web](https://example.com)';
        const out = sanitizeForumMarkdown(md);
        expect(out).toContain('<strong>hola</strong>');
        expect(out).toContain('<em>mundo</em>');
        expect(out).toContain('<a href="https://example.com"');
        expect(out).toContain('>web</a>');
    });

    it('renders fenced code blocks safely', () => {
        const md = '```js\nconst x = "<script>";\n```';
        const out = sanitizeForumMarkdown(md);
        expect(out).toContain('<pre><code class="lang-js">');
        expect(out).toContain('const x = &quot;&lt;script&gt;&quot;;');
    });

    it('renders unordered and ordered lists', () => {
        const md = '- first\n- second\n\n1. one\n2. two';
        const out = sanitizeForumMarkdown(md);
        expect(out.replace(/\s+/g, '')).toContain('<ul><li>first</li><li>second</li></ul>');
        expect(out.replace(/\s+/g, '')).toContain('<ol><li>one</li><li>two</li></ol>');
    });

    it('renders blockquotes', () => {
        const md = '> Una nota';
        expect(sanitizeForumMarkdown(md)).toContain(
            '<blockquote><p>Una nota</p></blockquote>',
        );
    });

    it('renders h3 and h4 headings', () => {
        const md = '### intro\n\n#### detalle';
        const out = sanitizeForumMarkdown(md);
        expect(out).toContain('<h3>intro</h3>');
        expect(out).toContain('<h4>detalle</h4>');
    });

    it('refuses javascript: links inside markdown', () => {
        const md = '[evil](javascript:alert(1))';
        const out = sanitizeForumMarkdown(md);
        expect(out).not.toMatch(/<a\s+href=/i);
    });

    it('escapes raw HTML inside markdown', () => {
        const md = 'foo <script>alert(1)</script> bar';
        const out = sanitizeForumMarkdown(md);
        expect(out).not.toContain('<script>');
        expect(out).toContain('&lt;script&gt;');
    });

    it('handles empty input', () => {
        expect(sanitizeForumMarkdown('')).toBe('');
    });
});
