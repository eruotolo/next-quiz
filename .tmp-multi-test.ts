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
        include: { lmsEnrollments: true, results: true },
    });
    if (!valentina) throw new Error('Valentina missing');

    console.log('Valentina id:', valentina.id);
    console.log('LmsEnrollments:', valentina.lmsEnrollments.length);
    for (const e of valentina.lmsEnrollments) console.log(`  - course=${e.courseId.slice(0,8)} status=${e.status} pct=${e.progressPct}`);
    console.log('Results:', valentina.results.length);

    const secret = new TextEncoder().encode(env.STUDENT_SESSION_SECRET);
    const token = await new SignJWT({ studentId: valentina.id, groupId: valentina.lmsEnrollments[0]!.groupId ?? '' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

    for (const path of ['/aula', '/aula/cursos', '/post-login', '/examen/seleccion']) {
        const res = await fetch(`http://localhost:3000${path}`, {
            headers: { Cookie: `aulika-student-auth=${token}` },
            redirect: 'manual',
        });
        console.log(`${path} → status=${res.status} location=${res.headers.get('location') ?? '-'}`);
    }

    await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
