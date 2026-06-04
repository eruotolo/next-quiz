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

/** Exámenes pertenecientes a grupos donde el usuario es profesor. */
export function examProfessorFilter(professorId: string): Prisma.ExamWhereInput {
    return { groups: { some: { professors: { some: { id: professorId } } } } };
}

/** Resultados de estudiantes cuyos grupos tutela el profesor. */
export function resultProfessorFilter(professorId: string): Prisma.ResultWhereInput {
    return { student: { group: { professors: { some: { id: professorId } } } } };
}

/** Estudiantes pertenecientes a grupos donde el usuario es profesor. */
export function studentProfessorFilter(professorId: string): Prisma.UserWhereInput {
    return { group: { professors: { some: { id: professorId } } } };
}
