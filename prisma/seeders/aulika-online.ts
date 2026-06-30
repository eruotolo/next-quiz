/**
 * Seeder de la institución "Aulika Institution Online" y la oferta PAES 2026.
 *
 * Crea de forma idempotente la vitrina comercial de cursos individuales B2C
 * que Aulika vende de manera directa a estudiantes externos:
 *   - 1 institución `aulika-online` (plan INSTITUCIONAL, lmsEnabled=true)
 *   - 1 profesor de soporte (Online2026!)
 *   - 1 curso bundle "Pack Completo PAES" (CLP $450.000)
 *   - 7 cursos PAES individuales (CLP $99.990 c/u) con módulos y lecciones
 *
 * El seeder usa UUIDs fijos y deterministas para que sea idempotente
 * (re-correrlo no duplica ni colisiona). Corre en `pnpm build` para que
 * la oferta esté disponible en local y producción.
 */
import {
    AULIKA_ONLINE_BUNDLE_COURSE_ID,
    AULIKA_ONLINE_BUNDLE_PRICE_CLP,
    AULIKA_ONLINE_INSTITUTION_SLUG,
    AULIKA_ONLINE_INDIVIDUAL_PRICE_CLP,
} from '../../src/features/lms/lib/aulika-online-bundle';
import bcrypt from 'bcryptjs';
import { type PrismaClient } from '@prisma/client';

const INSTITUTION_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';
const INSTITUTION_NAME = 'Aulika Institution Online';

const PROFESSOR_EMAIL = 'profesor.online@aulika.cl';
const PROFESSOR_PASSWORD = 'Online2026!';
const PROFESSOR_RUT = '550000001';

interface CourseSeed {
    id: string;
    title: string;
    description: string;
    modules: { title: string; description: string; lessons: LessonSeed[] }[];
}

interface LessonSeed {
    title: string;
    type: 'TEXTO' | 'VIDEO' | 'DOCUMENTO' | 'ENLACE';
    durationSec?: number;
    externalLink?: string;
    contentJson?: unknown;
}

const COURSES: CourseSeed[] = [
    {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Competencia Matemática M1',
        description:
            'Curso completo de Competencia Matemática M1 según temario DEMRE PAES. Cubre números, álgebra, geometría y probabilidad con ejercitación tipo PAES.',
        modules: [
            {
                title: 'Números y proporcionalidad',
                description: 'Operaciones, razones, porcentajes y proporcionalidad directa e inversa.',
                lessons: [
                    {
                        title: 'Operaciones con números enteros y racionales',
                        type: 'TEXTO',
                        durationSec: 1800,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'En este tema revisamos las operaciones fundamentales con números enteros, racionales y sus propiedades. La PAES evalúa aplicación en contextos reales.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Razones, proporciones y porcentajes',
                        type: 'TEXTO',
                        durationSec: 2100,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Trabajamos con razones, proporciones directas e inversas, y aplicaciones de porcentajes: IVA, descuentos, tasas de interés simple.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
            {
                title: 'Álgebra y funciones',
                description: 'Ecuaciones lineales y cuadráticas, sistemas, función afín y cuadrática.',
                lessons: [
                    {
                        title: 'Ecuación de la recta y función afín',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Pendiente, intercepto, forma punto-pendiente y aplicaciones a problemas de modelamiento lineal.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Función cuadrática y ecuación de segundo grado',
                        type: 'TEXTO',
                        durationSec: 2700,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Vértice, discriminante, raíces y aplicaciones. Relación entre el gráfico y la expresión algebraica.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
    {
        id: 'e6c7104f-9e4a-4e2e-8d8a-6b45a278fb6e',
        title: 'Competencia Matemática M2',
        description:
            'Curso avanzado de Competencia Matemática M2: modelamiento avanzado, geometría analítica, probabilidades y estadística inferencial.',
        modules: [
            {
                title: 'Geometría analítica y vectores',
                description: 'Plano cartesiano, distancia entre puntos, vectores y transformaciones isométricas.',
                lessons: [
                    {
                        title: 'Vectores en el plano y operaciones',
                        type: 'TEXTO',
                        durationSec: 2700,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Suma, resta, producto escalar y aplicaciones geométricas. Representación gráfica y algebraica.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Transformaciones isométricas',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Traslación, rotación, reflexión y simetría central. Composición de transformaciones.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
            {
                title: 'Probabilidad y estadística',
                description: 'Probabilidad condicional, distribuciones y estadística descriptiva e inferencial.',
                lessons: [
                    {
                        title: 'Probabilidad condicional y teorema de Bayes',
                        type: 'TEXTO',
                        durationSec: 3000,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Eventos dependientes e independientes. Aplicación del teorema de Bayes en problemas contextualizados.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Estadística descriptiva y medidas de dispersión',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Media, mediana, moda, rango, varianza y desviación estándar. Interpretación de gráficos estadísticos.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
    {
        id: 'd3b07384-d113-4ec2-a53b-e10bde486c91',
        title: 'Competencia Lectora',
        description:
            'Curso de Competencia Lectora PAES: estrategias de comprensión lectora, análisis de textos continuos y discontinuos, y argumentación.',
        modules: [
            {
                title: 'Comprensión lectora: textos continuos',
                description: 'Estrategias para identificar información, inferir y evaluar argumentos en textos narrativos y expositivos.',
                lessons: [
                    {
                        title: 'Estrategias de lectura: localizar, inferir y evaluar',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Localizar información explícita, hacer inferencias locales y globales, y evaluar la calidad argumentativa de un texto.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Tipología textual y géneros discursivos',
                        type: 'TEXTO',
                        durationSec: 2100,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Narración, descripción, exposición y argumentación. Identificación del propósito comunicativo y la intención del autor.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
            {
                title: 'Textos discontinuos y multimodales',
                description: 'Análisis de infografías, gráficos, tablas y combinaciones de lenguaje verbal y visual.',
                lessons: [
                    {
                        title: 'Lectura de gráficos, tablas e infografías',
                        type: 'TEXTO',
                        durationSec: 2100,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Interpretación de datos cuantitativos y cualitativos presentados en distintos formatos gráficos.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Cohesión y coherencia textual',
                        type: 'TEXTO',
                        durationSec: 1800,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Conectores, referencia pronominal, progresión temática y relaciones entre párrafos.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
    {
        id: 'c2a07384-e113-4ec2-a53b-f10bde486c92',
        title: 'Ciencias — Biología',
        description:
            'Curso de Biología PAES: célula, genética, ecología, evolución y fisiología humana. Temario oficial DEMRE.',
        modules: [
            {
                title: 'La célula y genética',
                description: 'Estructura celular, división, ADN, herencia y biotecnología.',
                lessons: [
                    {
                        title: 'Estructura y función celular',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Célula procariota y eucariota. Orgánulos, membrana celular y transporte. Mitosis y meiosis.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Herencia y genética mendeliana',
                        type: 'TEXTO',
                        durationSec: 2700,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Leyes de Mendel, herencia ligada al sexo, código genético y expresión génica.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
            {
                title: 'Ecología y evolución',
                description: 'Ecosistemas, poblaciones, biodiversidad y mecanismos de evolución.',
                lessons: [
                    {
                        title: 'Ecosistemas y flujo de energía',
                        type: 'TEXTO',
                        durationSec: 2100,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Niveles tróficos, cadenas alimentarias, ciclos biogeoquímicos y dinámica de poblaciones.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Evolución y selección natural',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Teoría de Darwin, evidencia evolutiva, especiación y patrones de biodiversidad.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
    {
        id: 'b1a07384-f113-4ec2-a53b-a10bde486c93',
        title: 'Ciencias — Química',
        description:
            'Curso de Química PAES: estructura atómica, enlaces, reacciones, estequiometría y química orgánica.',
        modules: [
            {
                title: 'Estructura atómica y enlaces',
                description: 'Átomos, tabla periódica, enlaces iónicos, covalentes y metálicos.',
                lessons: [
                    {
                        title: 'Modelo atómico y tabla periódica',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Configuración electrónica, propiedades periódicas y ubicación de los elementos.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Enlaces químicos y geometría molecular',
                        type: 'TEXTO',
                        durationSec: 2700,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Enlace iónico, covalente y metálico. Teoría de repulsión de pares electrónicos y polaridad.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
            {
                title: 'Reacciones químicas y estequiometría',
                description: 'Balance de ecuaciones, cálculos estequiométricos y equilibrio químico.',
                lessons: [
                    {
                        title: 'Balance y tipos de reacciones químicas',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Síntesis, descomposición, sustitución y redox. Balance de ecuaciones por tanteo y algebraico.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Estequiometría y rendimiento de reacción',
                        type: 'TEXTO',
                        durationSec: 2700,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Cálculo mol-mol, mol-gramo y mol-volumen. Reactivo limitante y rendimiento porcentual.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
    {
        id: 'a0a07384-a113-4ec2-a53b-b10bde486c94',
        title: 'Ciencias — Física',
        description:
            'Curso de Física PAES: mecánica, termodinámica, ondas, electromagnetismo y física moderna.',
        modules: [
            {
                title: 'Mecánica clásica',
                description: 'Cinemática, dinámica, trabajo, energía y conservación del momentum.',
                lessons: [
                    {
                        title: 'Cinemática: movimiento rectilíneo y parabólico',
                        type: 'TEXTO',
                        durationSec: 2700,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Posición, velocidad y aceleración. Movimiento parabólico y caída libre. Gráficos x(t), v(t) y a(t).',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Leyes de Newton y aplicaciones',
                        type: 'TEXTO',
                        durationSec: 3000,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Inercia, F=ma, acción y reacción. Diagrama de cuerpo libre y resolución de problemas en planos inclinados.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
            {
                title: 'Energía y termodinámica',
                description: 'Trabajo, potencia, energía cinética y potencial, calor y primera ley.',
                lessons: [
                    {
                        title: 'Trabajo, energía y conservación',
                        type: 'TEXTO',
                        durationSec: 2700,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Teorema trabajo-energía cinética, energía potencial gravitatoria y elástica. Conservación de la energía mecánica.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Calor y primera ley de la termodinámica',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Calorimetría, conducción, convección y radiación. Trabajo termodinámico y energía interna.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
    {
        id: '99a07384-b113-4ec2-a53b-c10bde486c95',
        title: 'Historia y Ciencias Sociales',
        description:
            'Curso de Historia y Ciencias Sociales PAES: historia universal y de Chile, geografía, economía y formación ciudadana.',
        modules: [
            {
                title: 'Historia universal y de Chile',
                description: 'Edad Media, modernidad, independencias, siglo XX y mundo contemporáneo.',
                lessons: [
                    {
                        title: 'Mundo contemporáneo: guerras mundiales y Guerra Fría',
                        type: 'TEXTO',
                        durationSec: 2700,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Causas y consecuencias de la Primera y Segunda Guerra Mundial. Bloques, polarización y descolonización.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Historia de Chile: Independencia y siglo XX',
                        type: 'TEXTO',
                        durationSec: 2700,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Proceso de Independencia, Portalianismo, Guerra del Pacífico, Parlamentarismo y Unidad Popular, dictadura y transición.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
            {
                title: 'Geografía, economía y ciudadanía',
                description: 'Territorio, población, sistemas económicos, globalización y derechos ciudadanos.',
                lessons: [
                    {
                        title: 'Geografía física y humana de Chile',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Relieve, clima y biogeografía. Distribución poblacional, migraciones y actividades económicas.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                    {
                        title: 'Economía y formación ciudadana',
                        type: 'TEXTO',
                        durationSec: 2400,
                        contentJson: {
                            type: 'doc',
                            content: [
                                {
                                    type: 'paragraph',
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'Oferta, demanda, mercado e inflación. Ciudadanía, derechos humanos y organización política del Estado chileno.',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
];

const BUNDLE_COURSE: CourseSeed = {
    id: AULIKA_ONLINE_BUNDLE_COURSE_ID,
    title: 'Pack Completo PAES — Todas las Áreas',
    description:
        'Acceso anual a los 7 cursos PAES (Matemática M1, Matemática M2, Competencia Lectora, Biología, Química, Física, Historia y Ciencias Sociales). Ahorra un 35% vs. compra individual.',
    modules: [
        {
            title: 'Bienvenida al Pack Completo',
            description: 'Cómo aprovechar el programa completo durante todo el año.',
            lessons: [
                {
                    title: 'Guía de uso del Pack Completo',
                    type: 'TEXTO',
                    durationSec: 1200,
                    contentJson: {
                        type: 'doc',
                        content: [
                            {
                                type: 'paragraph',
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Recomendaciones de estudio, planificación anual y acceso a los 7 cursos PAES de la oferta Aulika.',
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        },
    ],
};

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
    await prisma.lmsModule.deleteMany({ where: { courseId: course.id } });

    for (const [modIdx, mod] of seed.modules.entries()) {
        const moduleRow = await prisma.lmsModule.create({
            data: {
                title: mod.title,
                description: mod.description,
                order: modIdx,
                courseId: course.id,
            },
            select: { id: true },
        });

        for (const [lesIdx, lesson] of mod.lessons.entries()) {
            await prisma.lmsLesson.create({
                data: {
                    title: lesson.title,
                    type: lesson.type,
                    order: lesIdx,
                    contentJson: (lesson.contentJson ?? null) as never,
                    durationSec: lesson.durationSec ?? null,
                    externalLink: lesson.externalLink ?? null,
                    moduleId: moduleRow.id,
                },
            });
        }
    }
}

export async function seedAulikaOnline(prisma: PrismaClient): Promise<{
    institutionId: string;
    courses: number;
}> {
    const institucion = await prisma.academicInstitution.upsert({
        where: { id: INSTITUTION_ID },
        update: {
            name: INSTITUTION_NAME,
            slug: AULIKA_ONLINE_INSTITUTION_SLUG,
            lmsEnabled: true,
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

    await upsertCourse(prisma, institucion.id, profesor.id, BUNDLE_COURSE, AULIKA_ONLINE_BUNDLE_PRICE_CLP);
    for (const course of COURSES) {
        await upsertCourse(prisma, institucion.id, profesor.id, course, AULIKA_ONLINE_INDIVIDUAL_PRICE_CLP);
    }

    return {
        institutionId: institucion.id,
        courses: COURSES.length + 1,
    };
}
