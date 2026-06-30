/**
 * Testing seed — LMS (Aula Virtual) full dataset.
 *
 * Cubre todas las fases implementadas (1–5):
 *   - Fase 1: cursos, módulos, lecciones (todos los tipos), inscripciones, progreso
 *   - Fase 2: tareas, entregas, gradebook, notas
 *   - Fase 3: foros, hilos, posts, notificaciones
 *   - Fase 4: rachas, insignias, puntos, leaderboard opt-out
 *   - Fase 5: certificado de finalización
 *
 * Institución dedicada: slug = "lms-testing" (UNIVERSIDAD, plan INSTITUCIONAL)
 * RUTs en rango 20.100.000+ para no colisionar con otros seeders.
 *
 * Idempotencia:
 *   - Institución y usuarios: upsert por slug/email/rut.
 *   - Datos LMS: DELETE en cascada de cursos + limpieza explícita de
 *     streaks/badges/points/notifications de los estudiantes, luego recreación.
 *
 * Usage:
 *   pnpm db:seed:aula   →  tsx .../testing/index.ts aula
 */
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';

const PASSWORD = 'Admin2026!';
const SLUG = 'lms-testing';
const RUT_BASE = 20_100_000;

// ─── RUT helpers ─────────────────────────────────────────────────────────────

function rutDv(body: number): string {
    let s = 0;
    let m = 2;
    let n = body;
    while (n > 0) {
        s += (n % 10) * m;
        n = Math.floor(n / 10);
        m = m === 7 ? 2 : m + 1;
    }
    const r = 11 - (s % 11);
    if (r === 11) return '0';
    if (r === 10) return 'K';
    return String(r);
}

function rut(offset: number): string {
    const body = RUT_BASE + offset;
    return `${body}${rutDv(body)}`;
}

// ─── Dates ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

function daysFromNow(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export async function seedAula(prisma: PrismaClient): Promise<void> {
    console.log('🎓 LMS seed — start');

    const hashed = bcrypt.hashSync(PASSWORD, 10);

    // ── Roles ─────────────────────────────────────────────────────────────────
    const roleAdmin = await prisma.userRole.upsert({
        where: { name: 'Administrador' },
        update: {},
        create: { name: 'Administrador' },
    });
    const roleProfesor = await prisma.userRole.upsert({
        where: { name: 'Profesor' },
        update: {},
        create: { name: 'Profesor' },
    });
    const roleStudent = await prisma.userRole.upsert({
        where: { name: 'Estudiante' },
        update: {},
        create: { name: 'Estudiante' },
    });

    // ── Institución ───────────────────────────────────────────────────────────
    const institution = await prisma.academicInstitution.upsert({
        where: { slug: SLUG },
        update: {},
        create: {
            name: 'Universidad LMS Testing',
            slug: SLUG,
            phone: '+56 2 2000 0000',
            address: 'Calle Prueba 123',
            city: 'Santiago',
            country: 'Chile',
            type: 'UNIVERSIDAD',
            plan: 'INSTITUCIONAL',
        },
    });
    console.log(`  ✓ Institution: ${institution.name}`);

    // ── Admin ─────────────────────────────────────────────────────────────────
    const admin = await prisma.user.upsert({
        where: { email: 'admin@lms-testing.test' },
        update: {},
        create: {
            name: 'Admin',
            lastname: 'LMS',
            email: 'admin@lms-testing.test',
            rut: rut(0),
            password: hashed,
            userRoleId: roleAdmin.id,
            academicInstitutionId: institution.id,
        },
    });

    // ── Profesor ──────────────────────────────────────────────────────────────
    const profesor = await prisma.user.upsert({
        where: { email: 'patricia.sanchez@lms-testing.test' },
        update: {},
        create: {
            name: 'Patricia',
            lastname: 'Sánchez',
            email: 'patricia.sanchez@lms-testing.test',
            rut: rut(1),
            password: hashed,
            userRoleId: roleProfesor.id,
            academicInstitutionId: institution.id,
        },
    });
    console.log(`  ✓ Usuarios staff: admin + ${profesor.name} ${profesor.lastname}`);

    // ── Jerarquía académica ───────────────────────────────────────────────────
    const program = await prisma.program.upsert({
        where: {
            academicInstitutionId_name: {
                academicInstitutionId: institution.id,
                name: 'Ingeniería en Informática',
            },
        },
        update: {},
        create: {
            name: 'Ingeniería en Informática',
            code: 'ICI',
            academicInstitutionId: institution.id,
        },
    });

    const period = await prisma.academicPeriod.upsert({
        where: {
            academicInstitutionId_name: {
                academicInstitutionId: institution.id,
                name: '2026 - Primer Semestre',
            },
        },
        update: {},
        create: {
            name: '2026 - Primer Semestre',
            year: 2026,
            type: 'SEMESTRE',
            isActive: true,
            academicInstitutionId: institution.id,
        },
    });

    // Group — sin unique compuesto en el modelo, buscamos por nombre en la institución
    let group = await prisma.group.findFirst({
        where: { academicInstitutionId: institution.id, name: 'ICI-2026 A' },
    });
    if (!group) {
        group = await prisma.group.create({
            data: {
                name: 'ICI-2026 A',
                academicInstitutionId: institution.id,
                programId: program.id,
                periodId: period.id,
            },
        });
    }

    // Materias
    const cs1 = await prisma.courseSection.upsert({
        where: {
            programId_periodId_name_groupId: {
                programId: program.id,
                periodId: period.id,
                name: 'Introducción a la Programación',
                groupId: group.id,
            },
        },
        update: {},
        create: {
            name: 'Introducción a la Programación',
            code: 'ICI-101',
            programId: program.id,
            periodId: period.id,
            groupId: group.id,
        },
    });

    const cs2 = await prisma.courseSection.upsert({
        where: {
            programId_periodId_name_groupId: {
                programId: program.id,
                periodId: period.id,
                name: 'Base de Datos',
                groupId: group.id,
            },
        },
        update: {},
        create: {
            name: 'Base de Datos',
            code: 'ICI-201',
            programId: program.id,
            periodId: period.id,
            groupId: group.id,
        },
    });

    // ── Estudiantes ───────────────────────────────────────────────────────────
    const studentData = [
        { name: 'Ana', lastname: 'García', email: 'ana.garcia@lms-testing.test', offset: 10 },
        { name: 'Carlos', lastname: 'Muñoz', email: 'carlos.munoz@lms-testing.test', offset: 11 },
        {
            name: 'Sofía',
            lastname: 'Herrera',
            email: 'sofia.herrera2@lms-testing.test',
            offset: 12,
        },
        { name: 'Diego', lastname: 'Torres', email: 'diego.torres@lms-testing.test', offset: 13 },
        {
            name: 'Valentina',
            lastname: 'Cruz',
            email: 'valentina.cruz@lms-testing.test',
            offset: 14,
        },
    ];

    const students = await Promise.all(
        studentData.map(({ name, lastname, email, offset }) =>
            prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    name,
                    lastname,
                    email,
                    rut: rut(offset),
                    userRoleId: roleStudent.id,
                    academicInstitutionId: institution.id,
                    groupId: group!.id,
                },
            }),
        ),
    );
    const [ana, carlos, sofia, diego, valentina] = students as [
        (typeof students)[number],
        (typeof students)[number],
        (typeof students)[number],
        (typeof students)[number],
        (typeof students)[number],
    ];
    const studentIds = students.map((s) => s.id);
    console.log(`  ✓ Estudiantes: ${students.map((s) => s.name).join(', ')}`);

    // ── Limpieza de datos LMS existentes ─────────────────────────────────────
    // Los cursos en cascada eliminan: módulos, lecciones, inscripciones,
    // progreso, foros, gradebook, certificados, leaderboard-opt-outs.
    await prisma.lmsCourse.deleteMany({ where: { academicInstitutionId: institution.id } });
    // Examen embebido de la fase anterior (si existe)
    await prisma.exam.deleteMany({
        where: {
            academicInstitutionId: institution.id,
            title: 'Evaluación Final — Introducción a la Programación',
        },
    });
    // Fase 6: live sessions en cascada borran attendances, chat, whiteboard
    await prisma.lmsLiveSession.deleteMany({
        where: { course: { academicInstitutionId: institution.id } },
    });
    // Gamificación (no cae en cascada del curso)
    await prisma.lmsStreak.deleteMany({ where: { userId: { in: studentIds } } });
    await prisma.lmsUserBadge.deleteMany({ where: { userId: { in: studentIds } } });
    await prisma.lmsPointEvent.deleteMany({ where: { userId: { in: studentIds } } });
    await prisma.lmsNotification.deleteMany({ where: { userId: { in: studentIds } } });
    console.log('  ✓ Limpieza completada');

    // ═════════════════════════════════════════════════════════════════════════
    // CURSO 1 — Introducción a la Programación
    // ═════════════════════════════════════════════════════════════════════════

    const course1 = await prisma.lmsCourse.create({
        data: {
            title: 'Introducción a la Programación',
            description:
                'Fundamentos de programación con Python. Desde variables hasta estructuras de datos.',
            published: true,
            certificateEnabled: true,
            aiSummaryEnabled: true,
            academicInstitutionId: institution.id,
            courseSectionId: cs1.id,
            createdById: profesor.id,
        },
    });

    // Módulo 1 — Fundamentos
    const m1 = await prisma.lmsModule.create({
        data: { title: 'Fundamentos de Python', order: 0, courseId: course1.id },
    });
    const l1_1 = await prisma.lmsLesson.create({
        data: {
            title: '¿Qué es la programación?',
            type: 'TEXTO',
            order: 0,
            moduleId: m1.id,
            contentJson: {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: 'La programación es el proceso de diseñar instrucciones...',
                            },
                        ],
                    },
                ],
            },
        },
    });
    const l1_2 = await prisma.lmsLesson.create({
        data: {
            title: 'Variables y tipos de datos',
            type: 'TEXTO',
            order: 1,
            moduleId: m1.id,
            contentJson: {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: 'Una variable es un espacio en memoria que almacena un valor...',
                            },
                        ],
                    },
                ],
            },
            summaryJson: {
                summary:
                    'Las variables son contenedores de datos. Python soporta int, float, str y bool como tipos básicos.',
                keyPoints: [
                    'int para números enteros',
                    'float para decimales',
                    'str para cadenas de texto',
                    'bool para verdadero/falso',
                ],
                generatedAt: new Date().toISOString(),
            },
        },
    });
    const l1_3 = await prisma.lmsLesson.create({
        data: {
            title: 'Introducción a Python (video)',
            type: 'VIDEO',
            order: 2,
            moduleId: m1.id,
            videoAssetId: 'fake-mux-asset-id-intro-python',
            durationSec: 720,
        },
    });

    // Módulo 2 — Estructuras de Control
    const m2 = await prisma.lmsModule.create({
        data: { title: 'Estructuras de Control', order: 1, courseId: course1.id },
    });
    const l2_1 = await prisma.lmsLesson.create({
        data: {
            title: 'Condicionales if/else',
            type: 'TEXTO',
            order: 0,
            moduleId: m2.id,
            contentJson: {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: 'Las estructuras condicionales permiten tomar decisiones...',
                            },
                        ],
                    },
                ],
            },
        },
    });
    const l2_2 = await prisma.lmsLesson.create({
        data: {
            title: 'Bucles for y while',
            type: 'TEXTO',
            order: 1,
            moduleId: m2.id,
            contentJson: {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: 'Los bucles permiten repetir bloques de código...',
                            },
                        ],
                    },
                ],
            },
        },
    });
    const l2_3 = await prisma.lmsLesson.create({
        data: {
            title: 'Tarea: Calculadora básica',
            type: 'TAREA',
            order: 2,
            moduleId: m2.id,
            durationSec: 3600,
        },
    });

    // Módulo 3 — Evaluación
    const m3 = await prisma.lmsModule.create({
        data: { title: 'Evaluación Final', order: 2, courseId: course1.id },
    });

    // Examen Aulika embebido
    const exam1 = await prisma.exam.create({
        data: {
            title: 'Evaluación Final — Introducción a la Programación',
            timeLimit: 40,
            active: true,
            maxGrade: 7,
            passingGrade: 4,
            passingPercentage: 60,
            academicInstitutionId: institution.id,
            createdById: profesor.id,
            questions: {
                create: [
                    {
                        text: '¿Cuál es la sintaxis correcta para declarar una variable en Python?',
                        points: 1,
                        order: 0,
                        options: {
                            create: [
                                { text: 'var x = 5', isCorrect: false },
                                { text: 'x = 5', isCorrect: true },
                                { text: 'int x = 5', isCorrect: false },
                                { text: 'declare x = 5', isCorrect: false },
                            ],
                        },
                    },
                    {
                        text: '¿Qué imprime print(2 ** 3) en Python?',
                        points: 1,
                        order: 1,
                        options: {
                            create: [
                                { text: '6', isCorrect: false },
                                { text: '5', isCorrect: false },
                                { text: '8', isCorrect: true },
                                { text: '9', isCorrect: false },
                            ],
                        },
                    },
                    {
                        text: '¿Cuál es la función para obtener la longitud de una lista?',
                        points: 1,
                        order: 2,
                        options: {
                            create: [
                                { text: 'size()', isCorrect: false },
                                { text: 'length()', isCorrect: false },
                                { text: 'count()', isCorrect: false },
                                { text: 'len()', isCorrect: true },
                            ],
                        },
                    },
                    {
                        text: '¿Qué estructura se usa para repetir un bloque un número fijo de veces?',
                        points: 1,
                        order: 3,
                        options: {
                            create: [
                                { text: 'if', isCorrect: false },
                                { text: 'for', isCorrect: true },
                                { text: 'def', isCorrect: false },
                                { text: 'class', isCorrect: false },
                            ],
                        },
                    },
                    {
                        text: '¿Cómo se comenta una línea en Python?',
                        points: 1,
                        order: 4,
                        options: {
                            create: [
                                { text: '// comentario', isCorrect: false },
                                { text: '/* comentario */', isCorrect: false },
                                { text: '# comentario', isCorrect: true },
                                { text: '-- comentario', isCorrect: false },
                            ],
                        },
                    },
                ],
            },
        },
    });

    const l3_1 = await prisma.lmsLesson.create({
        data: {
            title: 'Examen final del módulo',
            type: 'EXAMEN',
            order: 0,
            moduleId: m3.id,
            examId: exam1.id,
        },
    });

    // Tarea (assignment) vinculada a l2_3
    const assignment1 = await prisma.lmsAssignment.create({
        data: {
            lessonId: l2_3.id,
            instructions:
                'Implementar una calculadora en Python que soporte las 4 operaciones básicas. Entregar como archivo .py con comentarios explicativos.',
            dueAt: daysAgo(7),
            maxScore: 100,
        },
    });

    // Gradebook — 2 ítems: tarea (40%) + examen (60%)
    const gbTarea = await prisma.lmsGradebookItem.create({
        data: {
            courseId: course1.id,
            title: 'Tarea: Calculadora básica',
            type: 'TAREA',
            weight: 0.4,
            assignmentId: assignment1.id,
        },
    });
    const gbExamen = await prisma.lmsGradebookItem.create({
        data: {
            courseId: course1.id,
            title: 'Evaluación Final',
            type: 'EXAMEN',
            weight: 0.6,
            examId: exam1.id,
        },
    });

    // Lecciones completas de Course 1 para progreso
    const allLessons1 = [l1_1, l1_2, l1_3, l2_1, l2_2, l2_3, l3_1];
    const totalLessons1 = allLessons1.length;

    // ── Inscripciones y progreso — Course 1 ──────────────────────────────────
    // Valentina: 100% completado
    const enrValentina1 = await prisma.lmsEnrollment.create({
        data: {
            userId: valentina.id,
            courseId: course1.id,
            status: 'COMPLETADO',
            progressPct: 100,
            completedAt: daysAgo(3),
        },
    });
    await Promise.all(
        allLessons1.map((l) =>
            prisma.lmsLessonProgress.create({
                data: {
                    userId: valentina.id,
                    lessonId: l.id,
                    completed: true,
                    completedAt: daysAgo(5),
                    ...(l.type === 'VIDEO' ? { lastSeenSec: 720 } : {}),
                },
            }),
        ),
    );

    // Ana: 5/7 lecciones (71%)
    await prisma.lmsEnrollment.create({
        data: { userId: ana.id, courseId: course1.id, status: 'ACTIVO', progressPct: 71 },
    });
    await Promise.all(
        allLessons1.slice(0, 5).map((l) =>
            prisma.lmsLessonProgress.create({
                data: {
                    userId: ana.id,
                    lessonId: l.id,
                    completed: true,
                    completedAt: daysAgo(8),
                },
            }),
        ),
    );

    // Sofia: 4/7 (57%)
    await prisma.lmsEnrollment.create({
        data: { userId: sofia.id, courseId: course1.id, status: 'ACTIVO', progressPct: 57 },
    });
    await Promise.all(
        allLessons1.slice(0, 4).map((l) =>
            prisma.lmsLessonProgress.create({
                data: {
                    userId: sofia.id,
                    lessonId: l.id,
                    completed: true,
                    completedAt: daysAgo(12),
                },
            }),
        ),
    );

    // Carlos: 3/7 (43%)
    await prisma.lmsEnrollment.create({
        data: { userId: carlos.id, courseId: course1.id, status: 'ACTIVO', progressPct: 43 },
    });
    await Promise.all(
        allLessons1.slice(0, 3).map((l) =>
            prisma.lmsLessonProgress.create({
                data: {
                    userId: carlos.id,
                    lessonId: l.id,
                    completed: true,
                    completedAt: daysAgo(15),
                },
            }),
        ),
    );

    // Diego: 1/7 (14%)
    await prisma.lmsEnrollment.create({
        data: { userId: diego.id, courseId: course1.id, status: 'ACTIVO', progressPct: 14 },
    });
    await prisma.lmsLessonProgress.create({
        data: { userId: diego.id, lessonId: l1_1.id, completed: true, completedAt: daysAgo(20) },
    });

    // ── Entregas (submissions) ────────────────────────────────────────────────
    await prisma.lmsSubmission.create({
        data: {
            assignmentId: assignment1.id,
            studentId: valentina.id,
            textContent:
                'def suma(a, b): return a + b\n# Implementé las 4 operaciones básicas con validación de división por cero.',
            status: 'CALIFICADO',
            score: 98,
            feedback: 'Excelente implementación. Código limpio y bien comentado.',
            submittedAt: daysAgo(10),
            gradedAt: daysAgo(6),
        },
    });
    await prisma.lmsSubmission.create({
        data: {
            assignmentId: assignment1.id,
            studentId: ana.id,
            textContent: 'Implementé suma, resta, multiplicación y división básica.',
            status: 'CALIFICADO',
            score: 82,
            feedback: 'Buen trabajo. Faltó manejo de error en división por cero.',
            submittedAt: daysAgo(9),
            gradedAt: daysAgo(6),
        },
    });
    await prisma.lmsSubmission.create({
        data: {
            assignmentId: assignment1.id,
            studentId: carlos.id,
            textContent: 'Solo implementé suma y resta por el momento.',
            status: 'ENTREGADO',
            submittedAt: daysAgo(8),
        },
    });
    await prisma.lmsSubmission.create({
        data: {
            assignmentId: assignment1.id,
            studentId: sofia.id,
            textContent: null,
            status: 'ATRASADO',
            submittedAt: daysAgo(5),
        },
    });

    // ── Notas del gradebook ───────────────────────────────────────────────────
    // Valentina: tarea 7.0, examen 7.0
    await prisma.lmsGrade.create({
        data: { gradebookItemId: gbTarea.id, studentId: valentina.id, score: 7.0 },
    });
    await prisma.lmsGrade.create({
        data: { gradebookItemId: gbExamen.id, studentId: valentina.id, score: 7.0 },
    });
    // Ana: tarea 5.8, examen 6.5
    await prisma.lmsGrade.create({
        data: { gradebookItemId: gbTarea.id, studentId: ana.id, score: 5.8 },
    });
    await prisma.lmsGrade.create({
        data: { gradebookItemId: gbExamen.id, studentId: ana.id, score: 6.5 },
    });

    // ── Foros — Course 1 ─────────────────────────────────────────────────────
    const forum1 = await prisma.lmsForum.create({
        data: {
            courseId: course1.id,
            title: 'Foro General',
            description: 'Dudas y consultas sobre el curso',
            order: 0,
        },
    });

    const thread1 = await prisma.lmsForumThread.create({
        data: {
            forumId: forum1.id,
            title: '📢 Bienvenidos al curso de Introducción a la Programación',
            authorId: profesor.id,
            pinned: true,
            locked: true,
            lastPostAt: daysAgo(30),
        },
    });
    await prisma.lmsForumPost.create({
        data: {
            threadId: thread1.id,
            authorId: profesor.id,
            body: 'Bienvenidos al curso. Aquí encontrarán todo el material necesario.\n\nConsultas en el foro correspondiente.',
        },
    });

    const thread2 = await prisma.lmsForumThread.create({
        data: {
            forumId: forum1.id,
            title: '¿Cómo manejo la división por cero en Python?',
            authorId: ana.id,
            lastPostAt: daysAgo(5),
        },
    });
    const post2_root = await prisma.lmsForumPost.create({
        data: {
            threadId: thread2.id,
            authorId: ana.id,
            body: 'Hola, al hacer la tarea me encontré con el error `ZeroDivisionError`. ¿Cómo lo manejo correctamente?',
        },
    });
    await prisma.lmsForumPost.create({
        data: {
            threadId: thread2.id,
            parentPostId: post2_root.id,
            authorId: profesor.id,
            body: 'Puedes usar un bloque `try/except`:\n```python\ntry:\n    resultado = a / b\nexcept ZeroDivisionError:\n    print("No se puede dividir por cero")\n```',
        },
    });
    await prisma.lmsForumPost.create({
        data: {
            threadId: thread2.id,
            parentPostId: post2_root.id,
            authorId: carlos.id,
            body: 'También puedes validar antes: `if b != 0: resultado = a / b`',
        },
    });

    // Notificaciones para estudiantes
    await prisma.lmsNotification.createMany({
        data: [
            {
                userId: ana.id,
                type: 'GRADE_POSTED',
                message: 'Patricia Sánchez calificó tu entrega en "Tarea: Calculadora básica"',
                link: `/aula/cursos/${course1.id}/leccion/${l2_3.id}`,
                read: true,
            },
            {
                userId: valentina.id,
                type: 'GRADE_POSTED',
                message: 'Patricia Sánchez calificó tu entrega en "Tarea: Calculadora básica"',
                link: `/aula/cursos/${course1.id}/leccion/${l2_3.id}`,
                read: false,
            },
            {
                userId: ana.id,
                type: 'NEW_POST',
                message:
                    'Patricia Sánchez respondió en "¿Cómo manejo la división por cero en Python?"',
                link: `/aula/cursos/${course1.id}/foro/${thread2.id}`,
                read: false,
            },
        ],
    });

    // ── Certificado — Valentina ───────────────────────────────────────────────
    await prisma.lmsCertificate.create({
        data: {
            userId: valentina.id,
            courseId: course1.id,
            finalGrade: 7.0,
            issuedAt: daysAgo(3),
        },
    });
    console.log('  ✓ Course 1 completo (módulos, lecciones, tarea, gradebook, foro, certificado)');

    // ═════════════════════════════════════════════════════════════════════════
    // CURSO 2 — Base de Datos
    // ═════════════════════════════════════════════════════════════════════════

    const course2 = await prisma.lmsCourse.create({
        data: {
            title: 'Base de Datos',
            description: 'Diseño y consulta de bases de datos relacionales con SQL y PostgreSQL.',
            published: true,
            certificateEnabled: false,
            aiSummaryEnabled: false,
            academicInstitutionId: institution.id,
            courseSectionId: cs2.id,
            createdById: profesor.id,
        },
    });

    // Módulo 1 — Conceptos Básicos
    const m2_1 = await prisma.lmsModule.create({
        data: { title: 'Conceptos Básicos de BD', order: 0, courseId: course2.id },
    });
    await prisma.lmsLesson.create({
        data: {
            title: '¿Qué es una base de datos relacional?',
            type: 'TEXTO',
            order: 0,
            moduleId: m2_1.id,
            contentJson: {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: 'Una base de datos relacional organiza datos en tablas...',
                            },
                        ],
                    },
                ],
            },
        },
    });
    await prisma.lmsLesson.create({
        data: {
            title: 'Guía de referencia SQL',
            type: 'DOCUMENTO',
            order: 1,
            moduleId: m2_1.id,
            fileUrl: 'https://res.cloudinary.com/lms-testing/raw/upload/v1/sql-reference.pdf',
        },
    });
    await prisma.lmsLesson.create({
        data: {
            title: 'Documentación oficial PostgreSQL',
            type: 'ENLACE',
            order: 2,
            moduleId: m2_1.id,
            externalLink: 'https://www.postgresql.org/docs/',
        },
    });

    // Módulo 2 — SQL Intermedio
    const m2_2 = await prisma.lmsModule.create({
        data: { title: 'SQL Intermedio', order: 1, courseId: course2.id },
    });
    await prisma.lmsLesson.create({
        data: {
            title: 'JOINs y relaciones entre tablas',
            type: 'TEXTO',
            order: 0,
            moduleId: m2_2.id,
            contentJson: {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: 'Los JOINs permiten combinar filas de dos o más tablas...',
                            },
                        ],
                    },
                ],
            },
        },
    });
    const l2_tarea = await prisma.lmsLesson.create({
        data: {
            title: 'Tarea: Diseño de esquema E-commerce',
            type: 'TAREA',
            order: 1,
            moduleId: m2_2.id,
        },
    });

    const assignment2 = await prisma.lmsAssignment.create({
        data: {
            lessonId: l2_tarea.id,
            instructions:
                'Diseñar el esquema E-R de un sistema de e-commerce. Entregar diagrama y script SQL de creación de tablas.',
            dueAt: daysFromNow(14),
            maxScore: 100,
        },
    });

    // Inscripciones — Course 2 (Ana, Carlos, Sofía)
    await prisma.lmsEnrollment.create({
        data: { userId: ana.id, courseId: course2.id, status: 'ACTIVO', progressPct: 60 },
    });
    await prisma.lmsEnrollment.create({
        data: { userId: carlos.id, courseId: course2.id, status: 'ACTIVO', progressPct: 20 },
    });
    await prisma.lmsEnrollment.create({
        data: { userId: sofia.id, courseId: course2.id, status: 'ACTIVO', progressPct: 40 },
    });

    // Foro — Course 2
    const forum2 = await prisma.lmsForum.create({
        data: { courseId: course2.id, title: 'Consultas SQL', order: 0 },
    });
    const thread2_1 = await prisma.lmsForumThread.create({
        data: {
            forumId: forum2.id,
            title: 'Diferencias entre INNER JOIN y LEFT JOIN',
            authorId: carlos.id,
            lastPostAt: daysAgo(2),
        },
    });
    const post2_1 = await prisma.lmsForumPost.create({
        data: {
            threadId: thread2_1.id,
            authorId: carlos.id,
            body: '¿Cuándo uso INNER JOIN y cuándo LEFT JOIN? No queda claro en el material.',
        },
    });
    await prisma.lmsForumPost.create({
        data: {
            threadId: thread2_1.id,
            parentPostId: post2_1.id,
            authorId: profesor.id,
            body: '**INNER JOIN** retorna solo las filas que tienen coincidencia en ambas tablas.\n**LEFT JOIN** retorna todas las filas de la tabla izquierda, con NULL donde no hay coincidencia.',
        },
    });
    await prisma.lmsForumPost.create({
        data: {
            threadId: thread2_1.id,
            parentPostId: post2_1.id,
            authorId: ana.id,
            body: 'Excelente explicación. A mí me ayudó pensar en LEFT JOIN como "quiero todos los registros de A aunque no tengan pareja en B".',
        },
    });
    console.log('  ✓ Course 2 completo (módulos, lecciones, tarea, foro)');

    // ═════════════════════════════════════════════════════════════════════════
    // GAMIFICACIÓN
    // ═════════════════════════════════════════════════════════════════════════

    // Insignias — upsert del catálogo mínimo para testing
    const badgeDefs = [
        {
            code: 'first_lesson',
            name: 'Primer Paso',
            description: 'Completaste tu primera lección',
            icon: '👣',
            pointsReward: 5,
            criteria: { type: 'LESSONS_COMPLETED', threshold: 1 },
        },
        {
            code: 'first_assignment',
            name: 'Primera Entrega',
            description: 'Entregaste tu primera tarea',
            icon: '📝',
            pointsReward: 10,
            criteria: { type: 'ASSIGNMENTS_SUBMITTED', threshold: 1 },
        },
        {
            code: 'first_perfect',
            name: 'Perfección Inaugural',
            description: 'Obtuviste un 7.0 en un examen',
            icon: '🌟',
            pointsReward: 25,
            criteria: { type: 'EXAMS_PASSED', threshold: 1 },
        },
        {
            code: 'streak_week',
            name: 'Semana Imparable',
            description: 'Mantuviste una racha de 7 días',
            icon: '🔥',
            pointsReward: 50,
            criteria: { type: 'LONGEST_STREAK', threshold: 7 },
        },
        {
            code: 'hundred_points',
            name: 'Centenario',
            description: 'Acumulaste 100 puntos',
            icon: '💯',
            pointsReward: 25,
            criteria: { type: 'TOTAL_POINTS', threshold: 100 },
        },
        {
            code: 'first_post',
            name: 'Voz del Aula',
            description: 'Publicaste en el foro',
            icon: '💬',
            pointsReward: 2,
            criteria: { type: 'FORUM_POSTS', threshold: 1 },
        },
    ];
    const badges = await Promise.all(
        badgeDefs.map(({ code, ...rest }) =>
            prisma.lmsBadge.upsert({
                where: { code },
                update: {},
                create: { code, ...rest },
            }),
        ),
    );
    const badgeMap = Object.fromEntries(badges.map((b) => [b.code, b]));

    // Rachas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.lmsStreak.createMany({
        data: [
            { userId: valentina.id, currentStreak: 12, longestStreak: 15, lastActiveOn: today },
            { userId: ana.id, currentStreak: 5, longestStreak: 8, lastActiveOn: daysAgo(1) },
            { userId: carlos.id, currentStreak: 3, longestStreak: 3, lastActiveOn: daysAgo(1) },
            { userId: sofia.id, currentStreak: 0, longestStreak: 4, lastActiveOn: daysAgo(5) },
            { userId: diego.id, currentStreak: 1, longestStreak: 1, lastActiveOn: today },
        ],
    });

    // Insignias desbloqueadas
    const badgeAwards: Array<{ userId: string; code: string; reason: string }> = [
        { userId: valentina.id, code: 'first_lesson', reason: 'Completó su primera lección' },
        { userId: valentina.id, code: 'first_assignment', reason: 'Entregó su primera tarea' },
        { userId: valentina.id, code: 'first_perfect', reason: 'Obtuvo 7.0 en Evaluación Final' },
        { userId: valentina.id, code: 'streak_week', reason: 'Alcanzó racha de 7 días' },
        { userId: valentina.id, code: 'hundred_points', reason: 'Acumuló 100 puntos' },
        { userId: valentina.id, code: 'first_post', reason: 'Participó en el foro' },
        { userId: ana.id, code: 'first_lesson', reason: 'Completó su primera lección' },
        { userId: ana.id, code: 'first_assignment', reason: 'Entregó su primera tarea' },
        { userId: ana.id, code: 'first_post', reason: 'Participó en el foro' },
        { userId: carlos.id, code: 'first_lesson', reason: 'Completó su primera lección' },
        { userId: carlos.id, code: 'first_assignment', reason: 'Entregó su primera tarea' },
        { userId: carlos.id, code: 'first_post', reason: 'Participó en el foro' },
        { userId: sofia.id, code: 'first_lesson', reason: 'Completó su primera lección' },
        { userId: diego.id, code: 'first_lesson', reason: 'Completó su primera lección' },
    ];
    await prisma.lmsUserBadge.createMany({
        data: badgeAwards.map(({ userId, code, reason }) => ({
            userId,
            badgeId: badgeMap[code]!.id,
            awardedAt: daysAgo(3),
            awardedReason: reason,
        })),
    });

    // Puntos — dedupeKey determinístico para idempotencia
    await prisma.lmsPointEvent.createMany({
        data: [
            // Valentina
            {
                userId: valentina.id,
                amount: 5,
                reason: 'Primera lección completada',
                sourceType: 'LESSON_COMPLETED',
                courseId: course1.id,
                dedupeKey: 'seed-val-lesson1',
            },
            {
                userId: valentina.id,
                amount: 10,
                reason: 'Tarea entregada',
                sourceType: 'ASSIGNMENT_SUBMITTED',
                courseId: course1.id,
                dedupeKey: 'seed-val-assign-sub',
            },
            {
                userId: valentina.id,
                amount: 5,
                reason: 'Tarea calificada',
                sourceType: 'ASSIGNMENT_GRADED',
                courseId: course1.id,
                dedupeKey: 'seed-val-assign-grade',
            },
            {
                userId: valentina.id,
                amount: 15,
                reason: 'Examen aprobado con 7.0',
                sourceType: 'EXAM_PASSED',
                courseId: course1.id,
                dedupeKey: 'seed-val-exam-pass',
            },
            {
                userId: valentina.id,
                amount: 2,
                reason: 'Post en foro',
                sourceType: 'FORUM_POST',
                courseId: course1.id,
                dedupeKey: 'seed-val-forum-post',
            },
            {
                userId: valentina.id,
                amount: 50,
                reason: 'Racha de 7 días',
                sourceType: 'STREAK_BONUS',
                dedupeKey: 'seed-val-streak7',
            },
            {
                userId: valentina.id,
                amount: 25,
                reason: 'Insignia: Centenario',
                sourceType: 'MANUAL',
                dedupeKey: 'seed-val-badge-100pts',
            },
            // Ana
            {
                userId: ana.id,
                amount: 5,
                reason: 'Primera lección completada',
                sourceType: 'LESSON_COMPLETED',
                courseId: course1.id,
                dedupeKey: 'seed-ana-lesson1',
            },
            {
                userId: ana.id,
                amount: 10,
                reason: 'Tarea entregada',
                sourceType: 'ASSIGNMENT_SUBMITTED',
                courseId: course1.id,
                dedupeKey: 'seed-ana-assign-sub',
            },
            {
                userId: ana.id,
                amount: 5,
                reason: 'Tarea calificada',
                sourceType: 'ASSIGNMENT_GRADED',
                courseId: course1.id,
                dedupeKey: 'seed-ana-assign-grade',
            },
            {
                userId: ana.id,
                amount: 2,
                reason: 'Post en foro',
                sourceType: 'FORUM_POST',
                courseId: course1.id,
                dedupeKey: 'seed-ana-forum-post',
            },
            // Carlos
            {
                userId: carlos.id,
                amount: 5,
                reason: 'Primera lección completada',
                sourceType: 'LESSON_COMPLETED',
                courseId: course1.id,
                dedupeKey: 'seed-carlos-lesson1',
            },
            {
                userId: carlos.id,
                amount: 10,
                reason: 'Tarea entregada',
                sourceType: 'ASSIGNMENT_SUBMITTED',
                courseId: course1.id,
                dedupeKey: 'seed-carlos-assign-sub',
            },
            {
                userId: carlos.id,
                amount: 2,
                reason: 'Post en foro — Base de Datos',
                sourceType: 'FORUM_POST',
                courseId: course2.id,
                dedupeKey: 'seed-carlos-forum-post-bd',
            },
            // Sofia
            {
                userId: sofia.id,
                amount: 5,
                reason: 'Primera lección completada',
                sourceType: 'LESSON_COMPLETED',
                courseId: course1.id,
                dedupeKey: 'seed-sofia-lesson1',
            },
            // Diego
            {
                userId: diego.id,
                amount: 5,
                reason: 'Primera lección completada',
                sourceType: 'LESSON_COMPLETED',
                courseId: course1.id,
                dedupeKey: 'seed-diego-lesson1',
            },
        ],
    });

    // Leaderboard opt-out — Sofía quiere privacidad
    await prisma.lmsLeaderboardOptOut.create({
        data: { userId: sofia.id, courseId: course1.id },
    });

    console.log('  ✓ Gamificación: rachas, insignias, puntos, opt-out');

    // ═════════════════════════════════════════════════════════════════════════
    // FASE 6 — AULA SINCRÓNICA
    // ═════════════════════════════════════════════════════════════════════════

    // Sesión ENDS — Course 1 (clase de la semana pasada con attendance + chat)
    const sessionEnded = await prisma.lmsLiveSession.create({
        data: {
            courseId: course1.id,
            title: '🔴 Clase de repaso: Estructuras de control',
            description: 'Repaso general de condicionales y bucles antes del examen.',
            scheduledAt: daysAgo(7),
            durationMin: 60,
            dailyRoomName: `lms-testing-${course1.id.slice(0, 8)}-ended`,
            dailyRoomUrl: 'https://aulika.daily.co/lms-testing-ended',
            dailyRoomExpiresAt: daysAgo(6),
            maxParticipants: 50,
            status: 'ENDED',
            createdById: profesor.id,
            startedAt: daysAgo(7),
            endedAt: new Date(daysAgo(7).getTime() + 55 * 60_000),
            recordingStatus: 'READY',
            recordingUrl: 'https://example.daily.co/recordings/ended-recording.mp4',
            recordingDurationSec: 3300,
        },
    });

    // Attendances — 4 estudiantes + la profesora
    const endedAttendances = [
        { userId: valentina.id, role: 'STUDENT' as const, minutes: 52 },
        { userId: ana.id, role: 'STUDENT' as const, minutes: 50 },
        { userId: carlos.id, role: 'STUDENT' as const, minutes: 28 },
        { userId: sofia.id, role: 'STUDENT' as const, minutes: 45 },
        { userId: profesor.id, role: 'TEACHER' as const, minutes: 55 },
    ];
    for (const att of endedAttendances) {
        const joinedAt = daysAgo(7);
        const leftAt = new Date(joinedAt.getTime() + att.minutes * 60_000);
        await prisma.lmsLiveAttendance.create({
            data: {
                sessionId: sessionEnded.id,
                userId: att.userId,
                role: att.role,
                displayName:
                    att.userId === valentina.id
                        ? 'Valentina Cruz'
                        : att.userId === ana.id
                          ? 'Ana García'
                          : att.userId === carlos.id
                            ? 'Carlos Muñoz'
                            : att.userId === sofia.id
                              ? 'Sofía Herrera'
                              : 'Patricia Sánchez',
                joinedAt,
                leftAt,
                durationSec: att.minutes * 60,
            },
        });
    }

    // Chat messages de la sesión ENDED
    await prisma.lmsLiveChatMessage.createMany({
        data: [
            {
                sessionId: sessionEnded.id,
                userId: profesor.id,
                content: '¡Bienvenidos! Hoy repasamos condicionales y bucles.',
                sentAt: daysAgo(7),
            },
            {
                sessionId: sessionEnded.id,
                userId: valentina.id,
                content: 'Profe, ¿podría repetir el ejemplo del while?',
                sentAt: new Date(daysAgo(7).getTime() + 5 * 60_000),
            },
            {
                sessionId: sessionEnded.id,
                userId: profesor.id,
                content: '¡Claro! El while repite el bloque MIENTRAS la condición sea verdadera.',
                sentAt: new Date(daysAgo(7).getTime() + 6 * 60_000),
            },
            {
                sessionId: sessionEnded.id,
                userId: ana.id,
                content: 'Gracias, quedó clarísimo 💪',
                sentAt: new Date(daysAgo(7).getTime() + 50 * 60_000),
            },
        ],
    });

    // Whiteboard snapshot
    await prisma.lmsWhiteboardSnapshot.create({
        data: {
            sessionId: sessionEnded.id,
            userId: profesor.id,
            pngUrl: 'https://res.cloudinary.com/lms-testing/image/upload/v1/whiteboards/ended-board.png',
            width: 1280,
            height: 720,
            title: 'Diagrama de flujo — Bucles while',
        },
    });

    // Sesión SCHEDULED — Course 1 (clase en 2 días para que el cron 1h antes dispare al correrlo cerca)
    const sessionUpcoming = await prisma.lmsLiveSession.create({
        data: {
            courseId: course1.id,
            title: '🎯 Taller práctico: Resolución de problemas',
            description: 'Vamos a resolver ejercicios en vivo. ¡Traigan sus laptops!',
            scheduledAt: daysFromNow(2),
            durationMin: 90,
            dailyRoomName: `lms-testing-${course1.id.slice(0, 8)}-upcoming`,
            dailyRoomUrl: 'https://aulika.daily.co/lms-testing-upcoming',
            dailyRoomExpiresAt: daysFromNow(3),
            maxParticipants: 30,
            status: 'SCHEDULED',
            createdById: profesor.id,
        },
    });

    // Sesión LIVE — Course 2 (clase pasando ahora mismo)
    const sessionLive = await prisma.lmsLiveSession.create({
        data: {
            courseId: course2.id,
            title: '⚡ SQL en vivo: Práctica de JOINs',
            description: 'Ejercicios prácticos de INNER/LEFT/RIGHT JOIN sobre la BD del curso.',
            scheduledAt: new Date(Date.now() - 5 * 60_000),
            durationMin: 60,
            dailyRoomName: `lms-testing-${course2.id.slice(0, 8)}-live`,
            dailyRoomUrl: 'https://aulika.daily.co/lms-testing-live',
            dailyRoomExpiresAt: new Date(Date.now() + 90 * 60_000),
            maxParticipants: 25,
            status: 'LIVE',
            createdById: profesor.id,
            startedAt: new Date(Date.now() - 5 * 60_000),
        },
    });

    // Attendance activa en la sesión LIVE
    await prisma.lmsLiveAttendance.createMany({
        data: [
            {
                sessionId: sessionLive.id,
                userId: ana.id,
                role: 'STUDENT',
                displayName: 'Ana García',
                joinedAt: new Date(Date.now() - 5 * 60_000),
            },
            {
                sessionId: sessionLive.id,
                userId: carlos.id,
                role: 'STUDENT',
                displayName: 'Carlos Muñoz',
                joinedAt: new Date(Date.now() - 4 * 60_000),
            },
            {
                sessionId: sessionLive.id,
                userId: profesor.id,
                role: 'TEACHER',
                displayName: 'Patricia Sánchez',
                joinedAt: new Date(Date.now() - 6 * 60_000),
            },
        ],
    });

    // Chat en vivo
    await prisma.lmsLiveChatMessage.createMany({
        data: [
            {
                sessionId: sessionLive.id,
                userId: profesor.id,
                content: 'Empezamos. Abran su editor SQL favorito.',
                sentAt: new Date(Date.now() - 4 * 60_000),
            },
            {
                sessionId: sessionLive.id,
                userId: ana.id,
                content: 'Listo, ya estoy conectada 🚀',
                sentAt: new Date(Date.now() - 3 * 60_000),
            },
            {
                sessionId: sessionLive.id,
                userId: carlos.id,
                content: 'Profe, ¿puede compartir el script de la BD?',
                sentAt: new Date(Date.now() - 2 * 60_000),
            },
        ],
    });

    console.log(
        '  ✓ Fase 6: live sessions (1 ENDED + 1 SCHEDULED + 1 LIVE) + attendances + chat + whiteboard',
    );
    console.log('🎓 LMS seed — completo');
    console.log('');
    console.log('  Institución:  lms-testing');
    console.log('  Admin:        admin@lms-testing.test / Admin2026!');
    console.log('  Profesor:     patricia.sanchez@lms-testing.test / Admin2026!');
    console.log('  Cursos:       "Introducción a la Programación" · "Base de Datos"');
    console.log(
        '  Estudiantes:  ana · carlos · sofia · diego · valentina (todos @lms-testing.test)',
    );
}
