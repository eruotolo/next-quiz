import { SignJWT } from 'jose';
import { readFileSync, writeFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
    const envLines = readFileSync('.env.local', 'utf-8').split('\n');
    const env = Object.fromEntries(
        envLines.filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => {
            const idx = l.indexOf('=');
            return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, '')];
        }).filter(([k]) => (k as string).length > 0)
    ) as Record<string, string>;

    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const valentina = await prisma.user.findFirst({
        where: { email: 'valentina.cruz@lms-testing.test' },
    });
    if (!valentina) throw new Error('No valentina');

    const secret = new TextEncoder().encode(env.STUDENT_SESSION_SECRET);
    const token = await new SignJWT({ studentId: valentina.id, groupId: valentina.groupId! })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

    for (const path of ['/aula', '/post-login', '/examen/seleccion']) {
        const res = await fetch(`http://localhost:3000${path}`, {
            headers: { Cookie: `aulika-student-auth=${token}` },
        });
        const html = await res.text();
        writeFileSync(`/tmp/page-${path.replaceAll('/', '_')}.html`, html);
        console.log(`${path} → ${res.status} size=${html.length}`);

        // Buscar h1/h2
        const headings = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>|<h2[^>]*>([\s\S]*?)<\/h2>/g)].slice(0, 4);
        for (const h of headings) {
            const t = (h[1] || h[2] || '').replace(/<[^>]+>/g, '').trim().slice(0, 80);
            if (t) console.log(`   H: ${t}`);
        }
        // Buscar errores
        if (html.includes('NEXT_REDIRECT')) console.log('   ⚠️  NEXT_REDIRECT en HTML');
        if (html.includes('Something went wrong')) console.log('   ⚠️  Something went wrong');
        if (html.includes('Error') && html.match(/Error: [A-Z]/)) {
            console.log('   ⚠️  Error... en HTML');
        }
    }

    await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
