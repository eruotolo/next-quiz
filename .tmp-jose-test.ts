import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
    const envLines = readFileSync('.env.local', 'utf-8').split('\n');
    const env = Object.fromEntries(
        envLines
            .filter((l) => l.includes('=') && !l.startsWith('#'))
            .map((l) => {
                const idx = l.indexOf('=');
                return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, '')];
            })
            .filter(([k]) => (k as string).length > 0)
    ) as Record<string, string>;

    const STUDENT_SESSION_SECRET = env.STUDENT_SESSION_SECRET;
    const DATABASE_URL = env.DATABASE_URL;
    if (!STUDENT_SESSION_SECRET) throw new Error('STUDENT_SESSION_SECRET missing');
    if (!DATABASE_URL) throw new Error('DATABASE_URL missing');

    const pool = new Pool({ connectionString: DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const valentina = await prisma.user.findFirst({
        where: { email: 'valentina.cruz@lms-testing.test' },
        select: { id: true, groupId: true, name: true, lastname: true },
    });
    if (!valentina || !valentina.groupId) throw new Error('Valentina missing or no group');

    const secret = new TextEncoder().encode(STUDENT_SESSION_SECRET);
    const token = await new SignJWT({
        studentId: valentina.id,
        groupId: valentina.groupId,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

    const res = await fetch('http://localhost:3000/post-login', {
        headers: { Cookie: `student_session=${token}` },
    });
    const html = await res.text();

    console.log('Status:', res.status, 'Size:', html.length);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
    if (titleMatch) console.log('Title:', titleMatch[1]);

    const errPatterns = [/Internal Server Error/gi, /Server Error/gi, /Error: [^<"]+/g, /next-error/gi];
    for (const p of errPatterns) {
        const matches = [...html.matchAll(p)];
        for (const m of matches.slice(0, 5)) console.log(`  ERROR →`, m[0].slice(0, 250));
    }

    const headings = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>|<h2[^>]*>([\s\S]*?)<\/h2>/g)].slice(0, 8);
    for (const h of headings) {
        const t = (h[1] || h[2] || '').replace(/<[^>]+>/g, '').trim().slice(0, 100);
        if (t) console.log('  H:', t);
    }

    await prisma.$disconnect();
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
