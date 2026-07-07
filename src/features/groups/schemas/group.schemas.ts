import { z } from 'zod';

export const groupSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    stream: z.string().max(100).optional().or(z.literal('')),
    tutorId: z.string().uuid('Tutor inválido').nullish(),
    programId: z.string().uuid('Programa inválido').nullish(),
    periodId: z.string().uuid('Período inválido').nullish(),
    // CourseSections (ramos) que pertenecen a este grupo. Relación N:M con
    // `CourseSectionGroup` — una materia puede estar en N grupos. Filtro de
    // coherencia carrera+semestre en la UI.
    courseSectionIds: z.array(z.string().uuid()).default([]),
});

export type GroupInput = z.infer<typeof groupSchema>;
