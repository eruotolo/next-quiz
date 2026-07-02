/**
 * Seeder de la institución "Aulika Institution Online" y la oferta PAES 2027.
 *
 * Crea de forma idempotente la vitrina comercial B2C que Aulika vende de manera
 * directa a estudiantes externos:
 *   - 1 institución `aulika-online` (plan INSTITUCIONAL, lmsEnabled=true)
 *   - 1 profesor de soporte (Online2026!)
 *   - 1 categoría "PAES" (`isBundle=true`, bundlePrice=CLP $450.000) que
 *     funciona como Pack Completo: la compra del pack inscribe al alumno en
 *     los 7 cursos PAES individuales asociados vía `LmsCourseCategory`.
 *   - 7 cursos PAES individuales (CLP $99.990 c/u) con módulos y lecciones
 *     basados en el temario oficial DEMRE Chile (Admisión 2027). El contenido
 *     pedagógico vive en archivos separados por materia (ver ./aulika-online-courses/).
 *
 * El seeder usa UUIDs fijos y deterministas para que sea idempotente
 * (re-correrlo no duplica ni colisiona). Corre en `pnpm build` para que
 * la oferta esté disponible en local y producción.
 */
import {
    AULIKA_ONLINE_BUNDLE_PRICE_CLP,
    AULIKA_ONLINE_INSTITUTION_SLUG,
    AULIKA_ONLINE_INDIVIDUAL_PRICE_CLP,
    AULIKA_ONLINE_PAES_CATEGORY_ID,
    AULIKA_ONLINE_PAES_CATEGORY_SLUG,
    AULIKA_ONLINE_PLAN_CODE,
} from '../../src/features/lms/lib/aulika-online-bundle';
import { biologia } from './aulika-online-courses/biologia';
import { competenciaLectora } from './aulika-online-courses/competencia-lectora';
import { fisica } from './aulika-online-courses/fisica';
import { historia } from './aulika-online-courses/historia';
import { m1 } from './aulika-online-courses/m1';
import { m2 } from './aulika-online-courses/m2';
import { quimica } from './aulika-online-courses/quimica';
import type { CourseSeed, LessonSeed, ModuleSeed } from './aulika-online-courses/_types';
import bcrypt from 'bcryptjs';
import { type PrismaClient } from '@prisma/client';

const INSTITUTION_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';
const INSTITUTION_NAME = 'Aulika Institution Online';

const PROFESSOR_EMAIL = 'profesor.online@aulika.cl';
const PROFESSOR_PASSWORD = 'Online2026!';
const PROFESSOR_RUT = '550000001';

const COURSES: CourseSeed[] = [m1, m2, competenciaLectora, biologia, quimica, fisica, historia];

async function upsertCourse(
    prisma: PrismaClient,
    institutionId: string,
    createdById: string,
    seed: CourseSeed,
    price: number,
): Promise<void> {
    const course = await prisma.lmsCourse.upsert({
        where: { id: seed.id },
        update: {
            title: seed.title,
            description: seed.description,
            isPublic: true,
            published: true,
            price,
        },
        create: {
            id: seed.id,
            title: seed.title,
            description: seed.description,
            isPublic: true,
            published: true,
            price,
            academicInstitutionId: institutionId,
            createdById,
        },
        select: { id: true },
    });

    // Módulos y lecciones: no tienen unique key natural, así que se reescriben
    // completamente en cada seed (delete + create). El order de los hijos
    // queda determinado por el array del seed. Idempotente porque las
    // lecciones no tienen datos creados por el alumno en este flujo.
    // NOTA: la IA actualizadora puede AGREGAR lecciones nuevas entre deploys
    // (ver /api/cron/update-aulika-online-courses). Para preservarlas,
    // marcamos las lecciones existentes por `title` y las reubicamos; las que
    // ya no están en el seed se mantienen al final.
    const existingModules = await prisma.lmsModule.findMany({
        where: { courseId: course.id },
        include: { lessons: true },
    });

    // Upsert por título: si un módulo del seed existe, se actualiza su
    // descripción y se reordenan las lecciones; si no, se crea.
    for (const [modIdx, mod] of seed.modules.entries()) {
        const existingModule = existingModules.find((m) => m.title === mod.title);
        const moduleRow = existingModule
            ? await prisma.lmsModule.update({
                  where: { id: existingModule.id },
                  data: { description: mod.description, order: modIdx },
                  select: { id: true },
              })
            : await prisma.lmsModule.create({
                  data: {
                      title: mod.title,
                      description: mod.description,
                      order: modIdx,
                      courseId: course.id,
                  },
                  select: { id: true },
              });

        await upsertLessonsForModule(prisma, moduleRow.id, mod.lessons);
    }
}

async function upsertLessonsForModule(
    prisma: PrismaClient,
    moduleId: string,
    seedLessons: LessonSeed[],
): Promise<void> {
    const existingLessons = await prisma.lmsLesson.findMany({
        where: { moduleId },
    });

    // Upsert por título: las lecciones del seed (humano-escritas) se actualizan
    // en contenido y orden; las lecciones adicionales (creadas por la IA
    // actualizadora) se preservan al final del módulo sin tocarlas.
    for (const [lesIdx, lesson] of seedLessons.entries()) {
        const existing = existingLessons.find((l) => l.title === lesson.title);
        if (existing) {
            await prisma.lmsLesson.update({
                where: { id: existing.id },
                data: {
                    type: lesson.type,
                    order: lesIdx,
                    contentJson: (lesson.contentJson ?? null) as never,
                    durationSec: lesson.durationSec ?? null,
                    externalLink: lesson.externalLink ?? null,
                },
            });
        } else {
            await prisma.lmsLesson.create({
                data: {
                    title: lesson.title,
                    type: lesson.type,
                    order: lesIdx,
                    contentJson: (lesson.contentJson ?? null) as never,
                    durationSec: lesson.durationSec ?? null,
                    externalLink: lesson.externalLink ?? null,
                    moduleId,
                },
            });
        }
    }
}

export async function seedAulikaOnline(prisma: PrismaClient): Promise<{
    institutionId: string;
    courses: number;
    totalLessons: number;
}> {
    const institucion = await prisma.academicInstitution.upsert({
        where: { id: INSTITUTION_ID },
        update: {
            name: INSTITUTION_NAME,
            slug: AULIKA_ONLINE_INSTITUTION_SLUG,
            lmsEnabled: true,
            lmsPlanCode: AULIKA_ONLINE_PLAN_CODE,
            plan: 'INSTITUCIONAL',
            type: 'OTRO',
            active: true,
        },
        create: {
            id: INSTITUTION_ID,
            name: INSTITUTION_NAME,
            slug: AULIKA_ONLINE_INSTITUTION_SLUG,
            phone: '+56 2 0000 0000',
            address: 'Sin dirección',
            city: 'Santiago',
            country: 'Chile',
            lmsEnabled: true,
            lmsPlanCode: AULIKA_ONLINE_PLAN_CODE,
            plan: 'INSTITUCIONAL',
            type: 'OTRO',
            active: true,
        },
        select: { id: true },
    });

    const profesorRole = await prisma.userRole.findUniqueOrThrow({
        where: { name: 'Profesor' },
        select: { id: true },
    });

    const hashedPassword = await bcrypt.hash(PROFESSOR_PASSWORD, 10);
    const profesor = await prisma.user.upsert({
        where: { email: PROFESSOR_EMAIL },
        update: {
            name: 'Profesor',
            lastname: 'Aulika Online',
            password: hashedPassword,
            userRoleId: profesorRole.id,
            academicInstitutionId: institucion.id,
        },
        create: {
            name: 'Profesor',
            lastname: 'Aulika Online',
            email: PROFESSOR_EMAIL,
            rut: PROFESSOR_RUT,
            password: hashedPassword,
            userRoleId: profesorRole.id,
            academicInstitutionId: institucion.id,
        },
        select: { id: true },
    });

    // Categoría "PAES" (pack completo): el estudiante compra la categoría y se
    // inscribe automáticamente en todos los cursos asociados vía webhook.
    const category = await prisma.lmsCategory.upsert({
        where: { id: AULIKA_ONLINE_PAES_CATEGORY_ID },
        update: {
            name: 'PAES',
            slug: AULIKA_ONLINE_PAES_CATEGORY_SLUG,
            description:
                'Acceso anual a los 7 cursos PAES (Matemática M1, Matemática M2, Competencia Lectora, Biología, Química, Física, Historia y Ciencias Sociales). Ahorra un 35% vs. compra individual.',
            isBundle: true,
            bundlePrice: AULIKA_ONLINE_BUNDLE_PRICE_CLP,
            isPublic: true,
            order: 0,
        },
        create: {
            id: AULIKA_ONLINE_PAES_CATEGORY_ID,
            academicInstitutionId: institucion.id,
            name: 'PAES',
            slug: AULIKA_ONLINE_PAES_CATEGORY_SLUG,
            description:
                'Acceso anual a los 7 cursos PAES (Matemática M1, Matemática M2, Competencia Lectora, Biología, Química, Física, Historia y Ciencias Sociales). Ahorra un 35% vs. compra individual.',
            isBundle: true,
            bundlePrice: AULIKA_ONLINE_BUNDLE_PRICE_CLP,
            isPublic: true,
            order: 0,
        },
        select: { id: true },
    });

    // Si existe el course bundle viejo (versión pre-categoría), lo despublicamos
    // para que el catálogo muestre solo el pack por categoría. No lo borramos
    // para no romper órdenes históricas que aún lo referencien.
    await prisma.lmsCourse.updateMany({
        where: { id: '99a07384-b113-4ec2-a53b-c10bde486c90' },
        data: { isPublic: false, published: false },
    });

    // Cursos individuales.
    for (const course of COURSES) {
        await upsertCourse(prisma, institucion.id, profesor.id, course, AULIKA_ONLINE_INDIVIDUAL_PRICE_CLP);
    }

    // Asocia los 7 cursos a la categoría PAES vía `LmsCourseCategory`. Borramos
    // y recreamos para que sea idempotente (los cursos asociados son siempre los 7).
    await prisma.lmsCourseCategory.deleteMany({ where: { categoryId: category.id } });
    await prisma.lmsCourseCategory.createMany({
        data: COURSES.map((c) => ({ courseId: c.id, categoryId: category.id })),
    });

    const totalLessons = COURSES.reduce(
        (acc: number, c: CourseSeed) =>
            acc + c.modules.reduce((mAcc: number, m: ModuleSeed) => mAcc + m.lessons.length, 0),
        0,
    );

    // Reporte de lecciones "huérfanas": pertenecen a un módulo del seed actual
    // pero su título no coincide con ninguna lección del seed. Pueden ser:
    // (a) contenido del seeder viejo que cambió de título en esta versión
    // (b) lecciones agregadas por un humano que ya no están en el seed
    // Solo se reportan; el seeder NUNCA las borra automáticamente. Un humano
    // puede limpiarlas con `prisma db execute` o desde `/aulika-online/aula`.
    const orphanLessons: Array<{ course: string; module: string; lesson: string }> = [];
    for (const course of COURSES) {
        const liveCourse = await prisma.lmsCourse.findUnique({
            where: { id: course.id },
            include: {
                modules: {
                    include: {
                        lessons: { select: { id: true, title: true } },
                    },
                },
            },
        });
        if (!liveCourse) continue;

        const seedModuleTitles = new Set(course.modules.map((m) => m.title));
        for (const liveModule of liveCourse.modules) {
            if (!seedModuleTitles.has(liveModule.title)) continue;
            const seedLessonTitles = new Set(
                course.modules
                    .find((m) => m.title === liveModule.title)
                    ?.lessons.map((l) => l.title) ?? [],
            );
            for (const liveLesson of liveModule.lessons) {
                if (!seedLessonTitles.has(liveLesson.title)) {
                    orphanLessons.push({
                        course: liveCourse.title,
                        module: liveModule.title,
                        lesson: liveLesson.title,
                    });
                }
            }
        }
    }

    if (orphanLessons.length > 0) {
        console.log(
            `\n⚠ Aulika Online: ${orphanLessons.length} lección(es) huérfana(s) detectada(s) (no aparecen en el seed actual). El seeder las preservó automáticamente. Para limpiarlas, ejecutá:`,
        );
        console.log(
            '  prisma db execute --schema prisma/schema.prisma --stdin <<< "DELETE FROM \"LmsLesson\" WHERE id IN (\'<id1>\', \'<id2>\', ...);"',
        );
        for (const orphan of orphanLessons) {
            console.log(`  - [${orphan.course} / ${orphan.module}] ${orphan.lesson}`);
        }
    }

    return {
        institutionId: institucion.id,
        courses: COURSES.length,
        totalLessons,
    };
}