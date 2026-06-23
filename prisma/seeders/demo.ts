/**
 * Seeder del MODO DEMO público de Aulika.
 *
 * Crea, de forma idempotente, el estado base read-only del sandbox demo:
 *   - 1 institución `aulika-demo` (isDemo=true, plan FREE)
 *   - 1 profesor de acceso (demo@aulika.cl / demo_aulika)
 *   - 1 grupo (el profesor queda asignado)
 *   - 10 alumnos (login por RUT)
 *
 * A diferencia de `bulk-demo.ts` y `local-test.ts` (solo locales), este seeder
 * SÍ corre en el build de producción: la institución demo debe existir en
 * aulika.cl para que el modo demo funcione.
 *
 * Uso local:  pnpm db:seed:demo
 * Producción: se ejecuta dentro del script `build`.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEMO_EMAIL, DEMO_INSTITUTION_NAME, DEMO_PASSWORD, DEMO_SLUG } from '../../src/features/demo/lib/demo';

const prisma = new PrismaClient();

const GROUP_NAME = 'Curso Demo';
// Base de RUT exclusiva del demo (no colisiona con local-test ni bulk-demo).
const RUT_BODY_START = 40_000_000;

const STUDENT_NAMES: { name: string; lastname: string }[] = [
    { name: 'Agustín', lastname: 'Reyes' },
    { name: 'Martina', lastname: 'Soto' },
    { name: 'Vicente', lastname: 'Rojas' },
    { name: 'Florencia', lastname: 'Díaz' },
    { name: 'Tomás', lastname: 'Pérez' },
    { name: 'Antonia', lastname: 'Muñoz' },
    { name: 'Joaquín', lastname: 'Silva' },
    { name: 'Emilia', lastname: 'Torres' },
    { name: 'Benjamín', lastname: 'Flores' },
    { name: 'Catalina', lastname: 'Morales' },
];

/** Dígito verificador chileno (módulo 11) para un cuerpo numérico. */
function computeVerifier(body: number): string {
    let sum = 0;
    let multiplier = 2;
    let n = body;
    while (n > 0) {
        sum += (n % 10) * multiplier;
        n = Math.floor(n / 10);
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const remainder = 11 - (sum % 11);
    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return String(remainder);
}

/** RUT determinista (cuerpo + DV, sin separadores) por índice. */
function rutAt(index: number): string {
    const body = RUT_BODY_START + index;
    return `${body}${computeVerifier(body)}`;
}

async function main(): Promise<void> {
    console.log('Seeding demo sandbox...');

    // Roles base: upsert idempotente para que el seeder sea robusto en el build.
    const [profesorRole, studentRole] = await Promise.all([
        prisma.userRole.upsert({
            where: { name: 'Profesor' },
            update: {},
            create: { name: 'Profesor' },
        }),
        prisma.userRole.upsert({
            where: { name: 'Estudiante' },
            update: {},
            create: { name: 'Estudiante' },
        }),
    ]);

    // ── Institución demo ────────────────────────────────────────────────────
    const institution = await prisma.academicInstitution.upsert({
        where: { slug: DEMO_SLUG },
        update: { isDemo: true, plan: 'FREE' },
        create: {
            name: DEMO_INSTITUTION_NAME,
            slug: DEMO_SLUG,
            isDemo: true,
            plan: 'FREE',
            phone: '+56 2 0000 0000',
            address: 'Sin dirección',
            city: 'Santiago',
            country: 'Chile',
        },
    });
    console.log(`  Institución: ${institution.name} (${DEMO_SLUG})`);

    // Purge accumulated visitor exams so each deploy starts the demo fresh.
    // The cascade in the schema removes questions, options, attempts and results.
    const purged = await prisma.exam.deleteMany({
        where: { academicInstitutionId: institution.id },
    });
    if (purged.count > 0) console.log(`  Exámenes demo purgados: ${purged.count}`);

    // ── Profesor de acceso ──────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const professor = await prisma.user.upsert({
        where: { email: DEMO_EMAIL },
        update: { password: hashedPassword, academicInstitutionId: institution.id },
        create: {
            name: 'Profesor',
            lastname: 'Demo',
            email: DEMO_EMAIL,
            rut: rutAt(0),
            password: hashedPassword,
            userRoleId: profesorRole.id,
            academicInstitutionId: institution.id,
        },
        select: { id: true },
    });
    console.log(`  Profesor: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

    // ── Grupo (profesor asignado) ───────────────────────────────────────────
    const existingGroup = await prisma.group.findFirst({
        where: { name: GROUP_NAME, academicInstitutionId: institution.id },
        select: { id: true },
    });
    const group = existingGroup
        ? await prisma.group.update({
              where: { id: existingGroup.id },
              data: { professors: { connect: { id: professor.id } } },
              select: { id: true },
          })
        : await prisma.group.create({
              data: {
                  name: GROUP_NAME,
                  academicInstitutionId: institution.id,
                  professors: { connect: { id: professor.id } },
              },
              select: { id: true },
          });
    console.log(`  Grupo: ${GROUP_NAME}`);

    // ── 10 alumnos ──────────────────────────────────────────────────────────
    for (const [i, student] of STUDENT_NAMES.entries()) {
        const email = `alumno${i + 1}.demo@aulika.cl`;
        await prisma.user.upsert({
            where: { email },
            update: { academicInstitutionId: institution.id, groupId: group.id },
            create: {
                name: student.name,
                lastname: student.lastname,
                email,
                rut: rutAt(i + 1),
                userRoleId: studentRole.id,
                academicInstitutionId: institution.id,
                groupId: group.id,
            },
        });
    }
    console.log(`  ${STUDENT_NAMES.length} alumnos`);

    console.log('\nDemo sandbox seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
