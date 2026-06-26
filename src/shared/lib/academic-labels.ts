import { z } from 'zod';

// Definición local del tipo para que este módulo sea seguro en el browser.
// Usa const + type en lugar de enum para mantener compatibilidad estructural
// con el InstitutionType generado por Prisma en server-side code.
// Los valores deben mantenerse en sincronía con el schema de Prisma.
export const InstitutionType = {
    COLEGIO: 'COLEGIO',
    LICEO_TECNICO: 'LICEO_TECNICO',
    PREUNIVERSITARIO: 'PREUNIVERSITARIO',
    UNIVERSIDAD: 'UNIVERSIDAD',
    INSTITUTO_PROFESIONAL: 'INSTITUTO_PROFESIONAL',
    CFT: 'CFT',
    OTRO: 'OTRO',
} as const;

export type InstitutionType = (typeof InstitutionType)[keyof typeof InstitutionType];


/**
 * Labels dinámicos de la jerarquía académica (decisión D17 del plan
 * `.doc/jerarquia-educacional.md`). La palabra de cara al usuario para
 * "Programa", "Materia" y "Período" cambia según el tipo de institución,
 * aunque en la base de datos los modelos se llaman `Program`,
 * `CourseSection` y `AcademicPeriod`.
 */

interface AcademicLabel {
    /** Palabra para `Program` (singular). */
    program: string;
    /** Palabra para `Program` (plural). */
    programPlural: string;
    /** Palabra para `CourseSection` (singular). */
    course: string;
    /** Palabra para `CourseSection` (plural). */
    coursePlural: string;
    /** Palabra para `AcademicPeriod` (singular). */
    period: string;
    /** Palabra para `AcademicPeriod` (plural). */
    periodPlural: string;
}

const LABELS: Record<InstitutionType, AcademicLabel> = {
    COLEGIO: {
        program: 'Nivel',
        programPlural: 'Niveles',
        course: 'Asignatura',
        coursePlural: 'Asignaturas',
        period: 'Año escolar',
        periodPlural: 'Años escolares',
    },
    LICEO_TECNICO: {
        program: 'Especialidad',
        programPlural: 'Especialidades',
        course: 'Asignatura',
        coursePlural: 'Asignaturas',
        period: 'Año escolar',
        periodPlural: 'Años escolares',
    },
    PREUNIVERSITARIO: {
        program: 'Área',
        programPlural: 'Áreas',
        course: 'Materia',
        coursePlural: 'Materias',
        period: 'Proceso',
        periodPlural: 'Procesos',
    },
    UNIVERSIDAD: {
        program: 'Carrera',
        programPlural: 'Carreras',
        course: 'Ramo',
        coursePlural: 'Ramos',
        period: 'Semestre',
        periodPlural: 'Semestres',
    },
    INSTITUTO_PROFESIONAL: {
        program: 'Carrera',
        programPlural: 'Carreras',
        course: 'Asignatura',
        coursePlural: 'Asignaturas',
        period: 'Semestre',
        periodPlural: 'Semestres',
    },
    CFT: {
        program: 'Carrera',
        programPlural: 'Carreras',
        course: 'Asignatura',
        coursePlural: 'Asignaturas',
        period: 'Semestre',
        periodPlural: 'Semestres',
    },
    OTRO: {
        program: 'Programa',
        programPlural: 'Programas',
        course: 'Materia',
        coursePlural: 'Materias',
        period: 'Período',
        periodPlural: 'Períodos',
    },
};

export function academicLabel(type: InstitutionType): AcademicLabel {
    return LABELS[type] ?? LABELS.OTRO;
}

// ── Catálogo de InstitutionType ────────────────────────────────────────────
// Fuente única (DRY) para los selects de /registro/*, /config/institutions y
// /[slug]/settings. El z.enum derivado evita duplicar el tuple de valores en
// cada schema.

export const INSTITUTION_TYPE_VALUES = Object.values(InstitutionType) as [
    InstitutionType,
    ...InstitutionType[],
];

const TYPE_LABELS: Record<InstitutionType, string> = {
    COLEGIO: 'Colegio',
    LICEO_TECNICO: 'Liceo Técnico',
    PREUNIVERSITARIO: 'Preuniversitario',
    UNIVERSIDAD: 'Universidad',
    INSTITUTO_PROFESIONAL: 'Instituto Profesional',
    CFT: 'CFT',
    OTRO: 'Otro',
};

export const INSTITUTION_TYPE_OPTIONS = INSTITUTION_TYPE_VALUES.map((value) => ({
    value,
    label: TYPE_LABELS[value],
}));

export const institutionTypeSchema = z.enum(INSTITUTION_TYPE_VALUES);
