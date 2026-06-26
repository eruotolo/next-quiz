import type { Prisma } from '@prisma/client';

/**
 * Filtros de alcance para el rol Profesor. Un profesor solo opera sobre los
 * grupos donde figura como profesor (`professors: { some: { id } }`) y, por
 * extensión, sobre los exámenes y resultados de esos grupos.
 *
 * Centralizar estos filtros evita repetir la misma forma de `where` en cada
 * página/acción y mantiene el criterio de alcance en un solo lugar.
 */

/** Grupos donde el usuario figura como profesor. */
export function groupProfessorFilter(professorId: string): Prisma.GroupWhereInput {
    return { professors: { some: { id: professorId } } };
}

/**
 * Exámenes pertenecientes a grupos donde el usuario es profesor (vía Group.professors
 * — asignación legacy) O donde enseña una CourseSection (modelo nuevo).
 * El OR garantiza retrocompatibilidad con datos previos a la jerarquía.
 */
export function examProfessorFilter(professorId: string): Prisma.ExamWhereInput {
    return {
        OR: [
            { groups: { some: { professors: { some: { id: professorId } } } } },
            { courseSection: { professors: { some: { id: professorId } } } },
        ],
    };
}

/**
 * Resultados de estudiantes accesibles al profesor: vía Group.professors (legacy)
 * O vía el CourseSection del examen (nuevo modelo).
 */
export function resultProfessorFilter(professorId: string): Prisma.ResultWhereInput {
    return {
        OR: [
            { student: { group: { professors: { some: { id: professorId } } } } },
            { exam: { courseSection: { professors: { some: { id: professorId } } } } },
        ],
    };
}

/**
 * Exámenes de los programas que coordina el usuario (Jefe de Carrera).
 * Complementa examProfessorFilter cuando el coordinador también quiere
 * ver exámenes de todas las materias de su programa.
 */
export function examCoordinatorFilter(programIds: string[]): Prisma.ExamWhereInput {
    return { courseSection: { programId: { in: programIds } } };
}

/**
 * Resultados de exámenes en los programas que coordina el usuario.
 */
export function resultCoordinatorFilter(programIds: string[]): Prisma.ResultWhereInput {
    return { exam: { courseSection: { programId: { in: programIds } } } };
}

/**
 * Jerarquía académica — alcance por programa y materia.
 *
 * Precedencia de permisos cuando coexisten varios vínculos (D8 del plan
 * maestro): `Admin > Coordinator(programa) > Tutor(grupo) > Profesor(grupos)`.
 * Un mismo usuario puede ser Profesor en una materia y Jefe de Carrera en su
 * programa: el alcance efectivo es la UNIÓN de ambos filtros.
 */

/** Programas que coordina el usuario (Jefe de Carrera). */
export function programCoordinatorFilter(programIds: string[]): Prisma.ProgramWhereInput {
    return { id: { in: programIds } };
}

/** Materias donde el usuario figura como profesor (incluye co-docencia/ayudante). */
export function courseSectionProfessorFilter(professorId: string): Prisma.CourseSectionWhereInput {
    return { professors: { some: { id: professorId } } };
}

/** Materias pertenecientes a los programas que coordina el usuario. */
export function courseSectionCoordinatorFilter(
    programIds: string[],
): Prisma.CourseSectionWhereInput {
    return { programId: { in: programIds } };
}

