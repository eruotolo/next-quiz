import { z } from 'zod';

export const courseSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    code: z.string().optional().nullable(),
    programId: z.string().uuid().optional().nullable(),
    periodId: z.string().uuid('Debes seleccionar un período válido'),
    groupId: z.string().uuid().optional().nullable(),
    professorIds: z.array(z.string().uuid()).default([]),
});

export const assignProfessorsSchema = z.object({
    professorIds: z.array(z.string().uuid()),
});
