/**
 * Seeder de demostración a escala.
 *
 * Genera, de forma idempotente:
 *   - 3 instituciones
 *   - por institución: 1 administrador + 2 profesores (password: Guns@026772)
 *   - por institución: 3 grupos (los 2 profesores quedan asignados a los 3)
 *   - por grupo: 10 alumnos (login por RUT)
 *   - por grupo: 1 examen activo con 20 preguntas (4 opciones, 1 correcta)
 *
 * Totales: 3 instituciones · 3 admins · 6 profesores · 9 grupos · 90 alumnos ·
 *          9 exámenes activos · 180 preguntas · 720 opciones.
 *
 * Requiere los roles base: ejecutar `pnpm db:seed` primero.
 *
 * Uso:
 *   pnpm db:seed:bulk
 */
import { type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createSeedClient } from '../lib/client';

const prisma = createSeedClient();

const STAFF_PASSWORD = 'Guns@026772';
const GROUPS_PER_INSTITUTION = 3;
const STUDENTS_PER_GROUP = 10;
const QUESTIONS_PER_EXAM = 20;
const EXAM_TIME_LIMIT_MIN = 60;

// Base del cuerpo del RUT (8 dígitos). Por encima de los datos de seed
// existentes para evitar colisiones de unicidad.
const RUT_BODY_START = 30_000_000;

interface InstitutionSeed {
    name: string;
    slug: string;
    domain: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    admin: { name: string; lastname: string };
    professors: { name: string; lastname: string }[];
}

const INSTITUTIONS: InstitutionSeed[] = [
    {
        name: 'Colegio San Andrés',
        slug: 'colegio-san-andres',
        domain: 'sanandres.cl',
        phone: '+56 2 2890 1000',
        address: 'Av. Los Leones 1450',
        city: 'Santiago',
        country: 'Chile',
        admin: { name: 'Patricia', lastname: 'Fuentes' },
        professors: [
            { name: 'Rodrigo', lastname: 'Aravena' },
            { name: 'Daniela', lastname: 'Cáceres' },
        ],
    },
    {
        name: 'Liceo Bicentenario Los Andes',
        slug: 'liceo-bicentenario-los-andes',
        domain: 'lbandes.cl',
        phone: '+56 34 240 2000',
        address: 'Esmeralda 320',
        city: 'Los Andes',
        country: 'Chile',
        admin: { name: 'Gonzalo', lastname: 'Bravo' },
        professors: [
            { name: 'Fernanda', lastname: 'Salinas' },
            { name: 'Esteban', lastname: 'Pizarro' },
        ],
    },
    {
        name: 'Instituto Comercial del Sur',
        slug: 'instituto-comercial-del-sur',
        domain: 'icsur.cl',
        phone: '+56 41 245 3000',
        address: 'Barros Arana 880',
        city: 'Concepción',
        country: 'Chile',
        admin: { name: 'Carolina', lastname: 'Tapia' },
        professors: [
            { name: 'Mauricio', lastname: 'Vega' },
            { name: 'Javiera', lastname: 'Núñez' },
        ],
    },
];

const STUDENT_FIRST_NAMES = [
    'Benjamín',
    'Martina',
    'Vicente',
    'Florencia',
    'Agustín',
    'Antonia',
    'Maximiliano',
    'Josefa',
    'Tomás',
    'Emilia',
    'Joaquín',
    'Catalina',
    'Lucas',
    'Isidora',
    'Matías',
    'Trinidad',
    'Cristóbal',
    'Amanda',
    'Gabriel',
    'Constanza',
];

const STUDENT_LAST_NAMES = [
    'González',
    'Muñoz',
    'Rojas',
    'Díaz',
    'Pérez',
    'Soto',
    'Contreras',
    'Silva',
    'Martínez',
    'Sepúlveda',
    'Morales',
    'Rodríguez',
    'López',
    'Fuentes',
    'Hernández',
    'Torres',
    'Araya',
    'Flores',
    'Espinoza',
    'Castillo',
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

let rutCounter = RUT_BODY_START;

/** Genera el siguiente RUT válido en formato de almacenamiento (cuerpo+DV, sin separadores). */
function nextRut(): string {
    const body = rutCounter++;
    return `${body}${computeVerifier(body)}`;
}

/** Normaliza un texto a parte local de email (sin acentos ni espacios). */
function emailLocal(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '');
}

/** 20 preguntas aritméticas deterministas con 4 opciones (1 correcta). */
function buildQuestions(): Prisma.QuestionCreateWithoutExamInput[] {
    return Array.from({ length: QUESTIONS_PER_EXAM }, (_, i) => {
        const a = i + 3;
        const b = (i + 1) * 2;
        const correct = a + b;
        // Distractores deterministas alrededor de la respuesta correcta.
        const values = [correct, correct + 1, correct - 1, correct + 2];
        // Rotación determinista de la posición correcta según el índice.
        const rotation = i % 4;
        const rotated = [...values.slice(rotation), ...values.slice(0, rotation)];
        return {
            text: `Pregunta ${i + 1}: ¿Cuánto es ${a} + ${b}?`,
            points: 1,
            order: i,
            questionType: 'UNICA',
            options: {
                create: rotated.map((v) => ({ text: String(v), isCorrect: v === correct })),
            },
        };
    });
}

async function main(): Promise<void> {
    console.log('Seeding bulk demo data...\n');

    const [adminRole, profesorRole, studentRole] = await Promise.all([
        prisma.userRole.findUnique({ where: { name: 'Administrador' } }),
        prisma.userRole.findUnique({ where: { name: 'Profesor' } }),
        prisma.userRole.findUnique({ where: { name: 'Estudiante' } }),
    ]);

    if (!adminRole || !profesorRole || !studentRole) {
        throw new Error('Roles no encontrados. Ejecutá `pnpm db:seed` primero.');
    }

    const hashedPassword = await bcrypt.hash(STAFF_PASSWORD, 10);
    const groupLetters = ['A', 'B', 'C'];

    let totalStudents = 0;
    let totalExams = 0;

    for (const inst of INSTITUTIONS) {
        const institution = await prisma.academicInstitution.upsert({
            where: { slug: inst.slug },
            update: {},
            create: {
                name: inst.name,
                slug: inst.slug,
                phone: inst.phone,
                address: inst.address,
                city: inst.city,
                country: inst.country,
            },
        });
        console.log(`Institución: ${inst.name}`);

        // ── Administrador ──────────────────────────────────────────────────
        await prisma.user.upsert({
            where: { email: `admin@${inst.domain}` },
            update: {},
            create: {
                name: inst.admin.name,
                lastname: inst.admin.lastname,
                email: `admin@${inst.domain}`,
                rut: nextRut(),
                password: hashedPassword,
                userRoleId: adminRole.id,
                academicInstitutionId: institution.id,
            },
        });
        console.log(`  Admin: ${inst.admin.name} ${inst.admin.lastname} (admin@${inst.domain})`);

        // ── Profesores ─────────────────────────────────────────────────────
        const professorIds: string[] = [];
        for (const prof of inst.professors) {
            const email = `${emailLocal(`${prof.name}.${prof.lastname}`)}@${inst.domain}`;
            const professor = await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    name: prof.name,
                    lastname: prof.lastname,
                    email,
                    rut: nextRut(),
                    password: hashedPassword,
                    userRoleId: profesorRole.id,
                    academicInstitutionId: institution.id,
                },
                select: { id: true },
            });
            professorIds.push(professor.id);
            console.log(`  Profesor: ${prof.name} ${prof.lastname} (${email})`);
        }

        // ── Grupos + alumnos + examen ──────────────────────────────────────
        for (let g = 0; g < GROUPS_PER_INSTITUTION; g++) {
            const groupName = `Grupo ${groupLetters[g]} — ${inst.name}`;

            let group = await prisma.group.findFirst({
                where: { name: groupName, academicInstitutionId: institution.id },
                select: { id: true },
            });
            if (!group) {
                group = await prisma.group.create({
                    data: {
                        name: groupName,
                        academicInstitutionId: institution.id,
                        // Los 2 profesores de la institución quedan a cargo del grupo.
                        professors: { connect: professorIds.map((id) => ({ id })) },
                    },
                    select: { id: true },
                });
            }

            // Alumnos del grupo
            for (let s = 0; s < STUDENTS_PER_GROUP; s++) {
                const idx = g * STUDENTS_PER_GROUP + s;
                const firstName = STUDENT_FIRST_NAMES[idx % STUDENT_FIRST_NAMES.length] as string;
                const lastName = STUDENT_LAST_NAMES[
                    (idx + g) % STUDENT_LAST_NAMES.length
                ] as string;
                const uniqueN = g * STUDENTS_PER_GROUP + s + 1;
                const email = `${emailLocal(`${firstName}.${lastName}`)}.${uniqueN}@alumnos.${inst.domain}`;
                await prisma.user.upsert({
                    where: { email },
                    update: {},
                    create: {
                        name: firstName,
                        lastname: lastName,
                        email,
                        rut: nextRut(),
                        userRoleId: studentRole.id,
                        academicInstitutionId: institution.id,
                        groupId: group.id,
                    },
                });
                totalStudents++;
            }

            // Examen activo con 20 preguntas (solo si el grupo no tiene uno ya)
            const examTitle = `Evaluación Diagnóstica — Grupo ${groupLetters[g]}`;
            const existingExam = await prisma.exam.findFirst({
                where: {
                    title: examTitle,
                    academicInstitutionId: institution.id,
                    groups: { some: { id: group.id } },
                },
                select: { id: true },
            });
            if (!existingExam) {
                await prisma.exam.create({
                    data: {
                        title: examTitle,
                        timeLimit: EXAM_TIME_LIMIT_MIN,
                        active: true,
                        academicInstitutionId: institution.id,
                        groups: { connect: { id: group.id } },
                        questions: { create: buildQuestions() },
                    },
                });
                totalExams++;
            }

            console.log(
                `  ${groupName}: ${STUDENTS_PER_GROUP} alumnos · examen activo (${QUESTIONS_PER_EXAM} preguntas)`,
            );
        }

        console.log('');
    }

    console.log('Seed bulk completado:');
    console.log(`  ${INSTITUTIONS.length} instituciones`);
    console.log(
        `  ${INSTITUTIONS.length} administradores · ${INSTITUTIONS.length * 2} profesores  — password: ${STAFF_PASSWORD}`,
    );
    console.log(`  ${INSTITUTIONS.length * GROUPS_PER_INSTITUTION} grupos`);
    console.log(`  ${totalStudents} alumnos creados (login por RUT)`);
    console.log(`  ${totalExams} exámenes activos con ${QUESTIONS_PER_EXAM} preguntas c/u`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
