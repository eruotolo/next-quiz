import { z } from 'zod';

export const groupSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    stream: z.string().max(100).optional().or(z.literal('')),
    tutorId: z.string().uuid('Tutor inválido').nullable().optional(),
    programId: z.string().uuid('Programa inválido').nullable().optional(),
    periodId: z.string().uuid('Período inválido').nullable().optional(),
    // CourseSections (ramos) que pertenecen a este grupo. Se gestionan seteando
    // su `groupId` (relación 1:N). Filtro de coherencia carrera+semestre en la UI.
    courseSectionIds: z.array(z.string().uuid()).default([]),
});

export type GroupInput = z.infer<typeof groupSchema>;
