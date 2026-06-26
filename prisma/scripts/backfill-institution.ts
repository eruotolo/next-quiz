/**
 * Backfill de datos (NO toca el schema): asigna academicInstitutionId a los
 * Group y Exam legacy que lo tienen en NULL, infiriéndolo de sus relaciones.
 *
 * Necesario porque el scoping por institución (auditoría 03-06-2026) filtra
 * por estas columnas y los registros NULL quedarían invisibles en los paneles.
 *
 * Idempotente: solo actualiza filas con NULL. Reporta lo que no pudo inferir.
 *
 * Uso:
 *   Local:      pnpm db:backfill
 *   Producción: DATABASE_URL="<prod>" pnpm exec tsx prisma/scripts/backfill-institution.ts
 */
import { createSeedClient } from '../lib/client';

const prisma = createSeedClient();

async function backfillGroups(): Promise<void> {
    const groups = await prisma.group.findMany({
        where: { academicInstitutionId: null },
        select: {
            id: true,
            name: true,
            users: { select: { academicInstitutionId: true }, take: 50 },
            professors: { select: { academicInstitutionId: true }, take: 10 },
        },
    });

    console.log(`Groups con institución NULL: ${groups.length}`);

    for (const group of groups) {
        // Infiere la institución desde sus estudiantes o profesores.
        const inferred =
            group.users.find((u) => u.academicInstitutionId)?.academicInstitutionId ??
            group.professors.find((p) => p.academicInstitutionId)?.academicInstitutionId ??
            null;

        if (!inferred) {
            console.warn(
                `  ⚠️  Group "${group.name}" (${group.id}): sin miembros con institución — revisar a mano`,
            );
            continue;
        }

        await prisma.group.update({
            where: { id: group.id },
            data: { academicInstitutionId: inferred },
        });
        console.log(`  ✅ Group "${group.name}" → ${inferred}`);
    }
}

async function backfillExams(): Promise<void> {
    const exams = await prisma.exam.findMany({
        where: { academicInstitutionId: null },
        select: {
            id: true,
            title: true,
            groups: { select: { academicInstitutionId: true } },
            createdBy: { select: { academicInstitutionId: true } },
        },
    });

    console.log(`Exams con institución NULL: ${exams.length}`);

    for (const exam of exams) {
        // Infiere desde sus grupos (ya backfilleados) o desde el creador.
        const inferred =
            exam.groups.find((g) => g.academicInstitutionId)?.academicInstitutionId ??
            exam.createdBy?.academicInstitutionId ??
            null;

        if (!inferred) {
            console.warn(
                `  ⚠️  Exam "${exam.title}" (${exam.id}): sin grupos ni creador con institución — revisar a mano`,
            );
            continue;
        }

        await prisma.exam.update({
            where: { id: exam.id },
            data: { academicInstitutionId: inferred },
        });
        console.log(`  ✅ Exam "${exam.title}" → ${inferred}`);
    }
}

/**
 * Desvincula grupos de exámenes cuando pertenecen a instituciones distintas.
 * Antes del scoping, el selector de grupos era global y permitió vínculos
 * cruzados; un estudiante podía acceder a un examen de otra institución.
 */
async function cleanCrossInstitutionLinks(): Promise<void> {
    const exams = await prisma.exam.findMany({
        where: { academicInstitutionId: { not: null } },
        select: {
            id: true,
            title: true,
            academicInstitutionId: true,
            groups: { select: { id: true, name: true, academicInstitutionId: true } },
        },
    });

    let cleaned = 0;
    for (const exam of exams) {
        const foreign = exam.groups.filter(
            (g) => g.academicInstitutionId !== exam.academicInstitutionId,
        );
        if (foreign.length === 0) continue;

        await prisma.exam.update({
            where: { id: exam.id },
            data: { groups: { disconnect: foreign.map((g) => ({ id: g.id })) } },
        });
        cleaned += foreign.length;
        for (const g of foreign) {
            console.log(`  🔗 Exam "${exam.title}": desvinculado grupo ajeno "${g.name}"`);
        }
    }
    console.log(`Vínculos examen↔grupo cruzados eliminados: ${cleaned}`);
}

async function main(): Promise<void> {
    // Los grupos primero: los exámenes infieren su institución desde ellos.
    await backfillGroups();
    await backfillExams();
    await cleanCrossInstitutionLinks();

    const [examsLeft, groupsLeft] = await Promise.all([
        prisma.exam.count({ where: { academicInstitutionId: null } }),
        prisma.group.count({ where: { academicInstitutionId: null } }),
    ]);
    console.log(`\nRestantes con NULL → Exams: ${examsLeft} · Groups: ${groupsLeft}`);
    if (examsLeft + groupsLeft > 0) {
        console.log(
            'Los restantes no tienen relaciones para inferir la institución; asignarla desde el panel.',
        );
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
