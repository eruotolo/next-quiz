import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { writeFileSync } from 'fs';

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
        select: { id: true, groupId: true },
    });
    if (!valentina?.groupId) throw new Error('Valentina missing');

    const secret = new TextEncoder().encode(env.STUDENT_SESSION_SECRET);
    const token = await new SignJWT({ studentId: valentina.id, groupId: valentina.groupId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

    const res = await fetch('http://localhost:3000/post-login', {
        headers: { Cookie: `aulika-student-auth=${token}` },
    });
    const html = await res.text();
    writeFileSync('/tmp/post-login.html', html);
    console.log('Status:', res.status, 'Size:', html.length);
    await prisma.$disconnect();
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
