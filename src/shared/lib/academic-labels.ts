import type { InstitutionType } from '@prisma/client';

/**
 * Labels dinámicos de la jerarquía académica (decisión D17 del plan
 * `.doc/jerarquia-educacional.md`). La palabra de cara al usuario para
 * "Programa" y "Materia" cambia según el tipo de institución, aunque en la base
 * de datos los modelos se llaman `Program` y `CourseSection`.
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
}

const LABELS: Record<InstitutionType, AcademicLabel> = {
    COLEGIO: { program: 'Nivel', programPlural: 'Niveles', course: 'Asignatura', coursePlural: 'Asignaturas' },
    LICEO_TECNICO: {
        program: 'Especialidad',
        programPlural: 'Especialidades',
        course: 'Asignatura',
        coursePlural: 'Asignaturas',
    },
    PREUNIVERSITARIO: { program: 'Área', programPlural: 'Áreas', course: 'Materia', coursePlural: 'Materias' },
    UNIVERSIDAD: { program: 'Carrera', programPlural: 'Carreras', course: 'Ramo', coursePlural: 'Ramos' },
    INSTITUTO_PROFESIONAL: {
        program: 'Carrera',
        programPlural: 'Carreras',
        course: 'Asignatura',
        coursePlural: 'Asignaturas',
    },
    CFT: { program: 'Carrera', programPlural: 'Carreras', course: 'Asignatura', coursePlural: 'Asignaturas' },
    OTRO: { program: 'Programa', programPlural: 'Programas', course: 'Materia', coursePlural: 'Materias' },
};

export function academicLabel(type: InstitutionType): AcademicLabel {
    return LABELS[type] ?? LABELS.OTRO;
}
