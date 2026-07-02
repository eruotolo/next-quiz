/**
 * Testing seed — full E2E suite.
 *
 * Creates a complete dataset for CI/E2E testing:
 *   - CLEARS all non-demo institutions first (cascade deletes everything)
 *   - 8 institutions covering all InstitutionTypes
 *   - 1 admin + 4 professors per institution (password: Admin2026!)
 *   - 1 program + 1 active period + 2 course sections per institution
 *   - 4 groups per institution (3 students each)
 *   - 6 completed exams with results (ULagos, 2 groups × 3 exams)
 *   - 1 active exam with in-progress attempts (ULagos)
 *
 * Totals: 8 institutions · 8 admins · 32 professors · 32 groups ·
 *         64 course sections · 96 students.
 *
 * ⚠️  Destructive: clears all non-demo data before seeding.
 */
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';

const PASSWORD = 'Admin2026!';

const INSTITUTIONS = [
    {
        index: 0,
        type: 'COLEGIO' as const,
        name: 'Colegio San Agustín',
        slug: 'colegio-san-agustin',
        phone: '+56 2 2345 6789',
        address: 'Av. Providencia 1234',
        city: 'Santiago',
        country: 'Chile',
        email: 'contacto@sanagustin.cl',
        program: { name: '7° Básico a 4° Medio', code: 'BASMED' },
        period: { name: '2026 - Año Escolar', type: 'ANUAL' as const, year: 2026 },
        groups: ['7° Básico A', '8° Básico A', '1° Medio A', '2° Medio A'],
        courses: ['Matemáticas', 'Lenguaje y Comunicación'],
    },
    {
        index: 1,
        type: 'LICEO_TECNICO' as const,
        name: 'Liceo Técnico Industrial Talagante',
        slug: 'liceo-tecnico-industrial-talagante',
        phone: '+56 2 2987 6543',
        address: "Calle O'Higgins 456",
        city: 'Talagante',
        country: 'Chile',
        email: 'contacto@lti-talagante.cl',
        program: { name: 'Técnico en Electrónica Industrial', code: 'TEI' },
        period: { name: '2026 - Año Escolar', type: 'ANUAL' as const, year: 2026 },
        groups: ['1° Año A', '2° Año A', '3° Año A', '4° Año A'],
        courses: ['Circuitos Eléctricos', 'Automatización Industrial'],
    },
    {
        index: 2,
        type: 'PREUNIVERSITARIO' as const,
        name: 'Preuniversitario Mentor',
        slug: 'preuniversitario-mentor',
        phone: '+56 2 2654 3210',
        address: 'Av. Alameda 789',
        city: 'Santiago',
        country: 'Chile',
        email: 'info@mentor.cl',
        program: { name: 'Ciencias', code: 'CIEN' },
        period: { name: 'Proceso PSU 2026', type: 'OTRO' as const, year: 2026 },
        groups: ['Ciencias Lunes', 'Ciencias Martes', 'Humanidades Miérc.', 'Humanidades Juev.'],
        courses: ['Matemáticas PSU', 'Biología PSU'],
    },
    {
        index: 3,
        type: 'UNIVERSIDAD' as const,
        name: 'Universidad de Valparaíso',
        slug: 'universidad-de-valparaiso',
        phone: '+56 32 234 5000',
        address: 'Av. Gran Bretaña 1111',
        city: 'Valparaíso',
        country: 'Chile',
        email: 'informaciones@uv.cl',
        program: { name: 'Ingeniería Civil Informática', code: 'ICI' },
        period: { name: '2026 - Primer Semestre', type: 'SEMESTRE' as const, year: 2026 },
        groups: ['ICI-2021 Mañana', 'ICI-2022 Tarde', 'ICC-2023 Mañana', 'ICC-2024 Tarde'],
        courses: ['Algoritmos y Estructuras de Datos', 'Base de Datos'],
    },
    {
        index: 4,
        type: 'INSTITUTO_PROFESIONAL' as const,
        name: 'Instituto Profesional INACAP Valdivia',
        slug: 'ip-inacap-valdivia',
        phone: '+56 63 221 1000',
        address: 'General Lagos 1187',
        city: 'Valdivia',
        country: 'Chile',
        email: 'valdivia@inacap.cl',
        program: { name: 'Técnico en Informática', code: 'TINF' },
        period: { name: '2026 - Primer Semestre', type: 'SEMESTRE' as const, year: 2026 },
        groups: ['Sección 1', 'Sección 2', 'Sección 3', 'Sección 4'],
        courses: ['Redes de Computadores', 'Programación Web'],
    },
    {
        index: 5,
        type: 'CFT' as const,
        name: 'Centro de Formación Técnica Andino',
        slug: 'cft-andino',
        phone: '+56 45 221 3456',
        address: 'Claro Solar 890',
        city: 'Temuco',
        country: 'Chile',
        email: 'informaciones@cft-andino.cl',
        program: { name: 'Construcción Civil', code: 'CONS' },
        period: { name: '2026 - Primer Semestre', type: 'SEMESTRE' as const, year: 2026 },
        groups: ['Turno Mañana 1', 'Turno Mañana 2', 'Turno Tarde 1', 'Turno Tarde 2'],
        courses: ['Materiales de Construcción', 'Instalaciones Sanitarias'],
    },
    {
        index: 6,
        type: 'OTRO' as const,
        name: 'Centro de Capacitación Laboral',
        slug: 'centro-capacitacion-laboral',
        phone: '+56 2 2111 2222',
        address: 'Calle Los Aromos 321',
        city: 'Rancagua',
        country: 'Chile',
        email: 'info@ccl.cl',
        program: { name: 'Capacitación Básica', code: 'CAP' },
        period: { name: 'Período 1 - 2026', type: 'TRIMESTRE' as const, year: 2026 },
        groups: ['Módulo A', 'Módulo B', 'Módulo C', 'Módulo D'],
        courses: ['Ofimática', 'Emprendimiento y Gestión'],
    },
    {
        index: 7,
        type: 'UNIVERSIDAD' as const,
        name: 'Universidad de Los Lagos',
        slug: 'universidad-de-los-lagos',
        phone: '+56 64 233 3000',
        address: 'Av. Fuchslocher 1305',
        city: 'Osorno',
        country: 'Chile',
        email: 'informaciones@ulagos.cl',
        program: { name: 'Ingeniería Civil Informática', code: 'ICI' },
        period: { name: '2026 - Primer Semestre', type: 'SEMESTRE' as const, year: 2026 },
        groups: ['ICI-2022 Mañana', 'ICI-2023 Tarde', 'IPD-2024 Mañana', 'IPD-2024 Tarde'],
        courses: ['Algoritmos y Estructuras de Datos', 'Base de Datos'],
    },
] as const;

// ── Naming helpers ────────────────────────────────────────────────────────────

function adminEmail(slug: string): string {
    return `admin@${slug}.test`;
}

function profEmail(slug: string, index: number): string {
    return `prof${index + 1}@${slug}.test`;
}

function studentEmail(slug: string, groupIndex: number, studentIndex: number): string {
    return `est-g${groupIndex + 1}-${studentIndex + 1}@${slug}.test`;
}

function adminRut(inst: { index: number }): string {
    return String((inst.index + 1) * 10_000_000 + 1);
}

function profRut(inst: { index: number }, j: number): string {
    return String((inst.index + 1) * 10_000_000 + 11 + j);
}

function studentRut(inst: { index: number }, groupIndex: number, studentIndex: number): string {
    return String((inst.index + 1) * 10_000_000 + (groupIndex + 1) * 100 + studentIndex + 1);
}

const STUDENT_NAMES = [
    ['Ana', 'Vargas'],
    ['Carlos', 'Muñoz'],
    ['Sofía', 'Herrera'],
] as const;

// ── Exam fixtures (ULagos) ────────────────────────────────────────────────────

const EXAM_QUESTIONS = [
    {
        text: '¿Cuál es la complejidad temporal del algoritmo de búsqueda binaria?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctIndex: 1,
    },
    {
        text: '¿Qué estructura de datos usa la estrategia LIFO (Last In, First Out)?',
        options: ['Cola (Queue)', 'Lista enlazada', 'Pila (Stack)', 'Árbol binario'],
        correctIndex: 2,
    },
    {
        text: '¿Cuál es la complejidad espacial del algoritmo Merge Sort?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctIndex: 2,
    },
    {
        text: '¿Qué algoritmo de ordenamiento tiene complejidad promedio O(n log n)?',
        options: ['Bubble Sort', 'Insertion Sort', 'Selection Sort', 'Quick Sort'],
        correctIndex: 3,
    },
    {
        text: '¿Qué tipo de árbol garantiza que todas las hojas están al mismo nivel?',
        options: ['Árbol AVL', 'Árbol B', 'Árbol Rojo-Negro', 'Árbol completo'],
        correctIndex: 3,
    },
] as const;

const PAST_EXAMS = [
    { title: 'Evaluación 1 — Algoritmos y Estructuras de Datos', daysAgo: 21 },
    { title: 'Prueba Parcial — Búsqueda y Ordenamiento', daysAgo: 14 },
    { title: 'Evaluación Final — Estructuras de Datos', daysAgo: 3 },
];

// Scores [Ana, Carlos, Sofía] out of 5 questions
const STUDENT_SCORES: ReadonlyArray<ReadonlyArray<number>> = [
    [5, 3, 1],
    [4, 3, 2],
    [5, 4, 3],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function clearData(prisma: PrismaClient): Promise<void> {
    console.log('  Clearing test data...');

    const testInstitutions = await prisma.academicInstitution.findMany({
        where: { isDemo: false },
        select: { id: true },
    });
    if (testInstitutions.length > 0) {
        await prisma.exam.deleteMany({
            where: { academicInstitutionId: { in: testInstitutions.map((i) => i.id) } },
        });
    }

    await prisma.user.deleteMany({ where: { email: { endsWith: '.test' } } });
    await prisma.academicInstitution.deleteMany({ where: { isDemo: false } });
}

async function seedCompletedExams(prisma: PrismaClient, institutionId: string): Promise<void> {
    console.log('\n  Completed exams — Universidad de Los Lagos');

    const groups = await prisma.group.findMany({
        where: { academicInstitutionId: institutionId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
        take: 2,
    });

    for (const group of groups) {
        const students = await prisma.user.findMany({
            where: { groupId: group.id },
            select: { id: true, name: true, lastname: true },
            take: 3,
        });

        const courseSections = await prisma.courseSection.findMany({
            where: { groupId: group.id },
            select: { id: true },
        });

        for (let ei = 0; ei < PAST_EXAMS.length; ei++) {
            const examDef = PAST_EXAMS[ei]!;
            const scores = STUDENT_SCORES[ei]!;
            const closedAt = new Date(Date.now() - examDef.daysAgo * 24 * 60 * 60_000);
            const openedAt = new Date(closedAt.getTime() - 2 * 60 * 60_000);
            const courseSection = courseSections[ei % courseSections.length] ?? null;

            const exam = await prisma.exam.create({
                data: {
                    title: examDef.title,
                    timeLimit: 60,
                    active: false,
                    maxGrade: 7,
                    passingGrade: 4,
                    passingPercentage: 60,
                    scheduledAt: openedAt,
                    closesAt: closedAt,
                    academicInstitutionId: institutionId,
                    groups: { connect: { id: group.id } },
                    ...(courseSection ? { courseSectionId: courseSection.id } : {}),
                },
            });

            for (let qi = 0; qi < EXAM_QUESTIONS.length; qi++) {
                const q = EXAM_QUESTIONS[qi]!;
                const question = await prisma.question.create({
                    data: {
                        examId: exam.id,
                        text: q.text,
                        points: 1,
                        order: qi,
                        questionType: 'UNICA',
                    },
                });
                for (let oi = 0; oi < q.options.length; oi++) {
                    await prisma.option.create({
                        data: {
                            questionId: question.id,
                            text: q.options[oi]!,
                            isCorrect: oi === q.correctIndex,
                        },
                    });
                }
            }

            for (let si = 0; si < students.length && si < scores.length; si++) {
                const student = students[si]!;
                const score = scores[si] as number;
                const completedAt = new Date(
                    closedAt.getTime() - (students.length - si) * 5 * 60_000,
                );
                await prisma.result.create({
                    data: {
                        studentId: student.id,
                        examId: exam.id,
                        score,
                        maxScore: EXAM_QUESTIONS.length,
                        answers: {},
                        completedAt,
                    },
                });
            }

            console.log(`    ✅ ${group.name}: "${examDef.title}" — ${students.length} results`);
        }
    }
}

async function seedActiveExam(prisma: PrismaClient, institutionId: string): Promise<void> {
    console.log('\n  Active exam — Universidad de Los Lagos');

    const group = await prisma.group.findFirstOrThrow({
        where: { academicInstitutionId: institutionId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
    });

    const students = await prisma.user.findMany({
        where: { groupId: group.id },
        select: { id: true, name: true, lastname: true },
        take: 3,
    });

    const now = new Date();

    const exam = await prisma.exam.create({
        data: {
            title: 'Evaluación 1 — Algoritmos y Estructuras de Datos',
            timeLimit: 60,
            active: true,
            maxGrade: 7,
            passingGrade: 4,
            passingPercentage: 60,
            scheduledAt: new Date(now.getTime() - 30 * 60_000),
            closesAt: new Date(now.getTime() + 90 * 60_000),
            academicInstitutionId: institutionId,
            groups: { connect: { id: group.id } },
        },
    });

    const questionIds: string[] = [];
    const optionsByQuestion: Array<Array<{ id: string; isCorrect: boolean }>> = [];

    for (let i = 0; i < EXAM_QUESTIONS.length; i++) {
        const q = EXAM_QUESTIONS[i]!;
        const question = await prisma.question.create({
            data: { examId: exam.id, text: q.text, points: 1, order: i, questionType: 'UNICA' },
        });
        questionIds.push(question.id);

        const opts: Array<{ id: string; isCorrect: boolean }> = [];
        for (let o = 0; o < q.options.length; o++) {
            const opt = await prisma.option.create({
                data: {
                    questionId: question.id,
                    text: q.options[o]!,
                    isCorrect: o === q.correctIndex,
                },
            });
            opts.push({ id: opt.id, isCorrect: o === q.correctIndex });
        }
        optionsByQuestion.push(opts);
    }

    const startedAt = new Date(now.getTime() - 10 * 60_000);
    const endsAt = new Date(startedAt.getTime() + 60 * 60_000);

    const inProgressConfig = [
        { answeredCount: 2, selectCorrect: true },
        { answeredCount: 4, selectCorrect: false },
    ];

    for (let si = 0; si < inProgressConfig.length && si < students.length; si++) {
        const student = students[si]!;
        const cfg = inProgressConfig[si]!;
        const attemptKey = randomUUID();

        await prisma.examAttempt.create({
            data: { attemptKey, studentId: student.id, examId: exam.id, startedAt, endsAt },
        });

        for (let qi = 0; qi < cfg.answeredCount && qi < questionIds.length; qi++) {
            const questionId = questionIds[qi]!;
            const opts = optionsByQuestion[qi]!;
            const optionId = cfg.selectCorrect
                ? opts.find((o) => o.isCorrect)!.id
                : opts[qi % opts.length]!.id;

            await prisma.answer.create({
                data: {
                    attemptKey,
                    studentId: student.id,
                    examId: exam.id,
                    questionId,
                    optionId,
                    answeredAt: new Date(startedAt.getTime() + (qi + 1) * 3 * 60_000),
                    timeSpentMs: 45_000 + qi * 15_000,
                },
            });
        }

        console.log(
            `    ✅ In progress: ${student.name} ${student.lastname} — ${cfg.answeredCount}/${questionIds.length} answered`,
        );
    }

    if (students.length >= 3) {
        const introStudent = students[2]!;
        await prisma.examAttempt.create({
            data: { attemptKey: randomUUID(), studentId: introStudent.id, examId: exam.id },
        });
        console.log(`    ⏳ In intro:    ${introStudent.name} ${introStudent.lastname}`);
    }

    console.log(`    Group: ${group.name} | Exam ID: ${exam.id}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function seedE2E(prisma: PrismaClient): Promise<void> {
    console.log('\nE2E Seed — start\n');

    const adminRole = await prisma.userRole.findUniqueOrThrow({ where: { name: 'Administrador' } });
    const profesorRole = await prisma.userRole.findUniqueOrThrow({ where: { name: 'Profesor' } });
    const studentRole = await prisma.userRole.findUniqueOrThrow({ where: { name: 'Estudiante' } });

    await clearData(prisma);

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    for (const inst of INSTITUTIONS) {
        console.log(`\n[${inst.type}] ${inst.name}`);

        const institution = await prisma.academicInstitution.create({
            data: {
                name: inst.name,
                slug: inst.slug,
                phone: inst.phone,
                address: inst.address,
                city: inst.city,
                country: inst.country,
                email: inst.email,
                type: inst.type,
                plan: 'INSTITUCIONAL',
            },
        });

        const admin = await prisma.user.create({
            data: {
                name: 'Admin',
                lastname: inst.name,
                email: adminEmail(inst.slug),
                rut: adminRut(inst),
                password: hashedPassword,
                userRoleId: adminRole.id,
                academicInstitutionId: institution.id,
            },
        });
        console.log(`  Admin:   ${admin.email}`);

        const professorIds: string[] = [];
        for (let j = 0; j < 4; j++) {
            const prof = await prisma.user.create({
                data: {
                    name: `Profesor${j + 1}`,
                    lastname: inst.name,
                    email: profEmail(inst.slug, j),
                    rut: profRut(inst, j),
                    password: hashedPassword,
                    userRoleId: profesorRole.id,
                    academicInstitutionId: institution.id,
                },
            });
            professorIds.push(prof.id);
        }
        console.log(`  Profes:  prof1-4@${inst.slug}.test`);

        const program = await prisma.program.create({
            data: {
                name: inst.program.name,
                code: inst.program.code,
                academicInstitutionId: institution.id,
            },
        });

        const period = await prisma.academicPeriod.create({
            data: {
                name: inst.period.name,
                year: inst.period.year,
                type: inst.period.type,
                isActive: true,
                academicInstitutionId: institution.id,
            },
        });

        for (let g = 0; g < inst.groups.length; g++) {
            const groupName = inst.groups[g]!;
            const assignedProfId = professorIds[g % professorIds.length]!;

            const group = await prisma.group.create({
                data: {
                    name: groupName,
                    academicInstitutionId: institution.id,
                    programId: program.id,
                    periodId: period.id,
                    professors: { connect: { id: assignedProfId } },
                },
            });

            for (const courseName of inst.courses) {
                await prisma.courseSection.create({
                    data: {
                        name: courseName,
                        programId: program.id,
                        periodId: period.id,
                        groupId: group.id,
                        professors: { connect: { id: assignedProfId } },
                    },
                });
            }

            for (let s = 0; s < STUDENT_NAMES.length; s++) {
                const entry = STUDENT_NAMES[s]!;
                const [firstName, lastName] = entry;
                await prisma.user.create({
                    data: {
                        name: firstName,
                        lastname: lastName,
                        email: studentEmail(inst.slug, g, s),
                        rut: studentRut(inst, g, s),
                        userRoleId: studentRole.id,
                        academicInstitutionId: institution.id,
                        groupId: group.id,
                    },
                });
            }

            console.log(`  Group:   ${groupName} — 2 courses, 3 students`);
        }
    }

    const ulagos = await prisma.academicInstitution.findUniqueOrThrow({
        where: { slug: 'universidad-de-los-lagos' },
        select: { id: true },
    });
    await seedCompletedExams(prisma, ulagos.id);
    await seedActiveExam(prisma, ulagos.id);

    console.log('\n\nE2E Seed completed:');
    console.log(
        '  8 institutions · 8 admins · 32 professors · 32 groups · 64 courses · 96 students',
    );
    console.log('  6 completed exams with results (ULagos)');
    console.log('  1 active exam with in-progress attempts (ULagos)');
    console.log('  Password: Admin2026! | LiveResults: /universidad-de-los-lagos/liveresults');
}
