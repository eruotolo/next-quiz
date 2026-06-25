import { z } from 'zod';

export const groupSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    stream: z.string().max(100).optional().or(z.literal('')),
    tutorId: z.string().uuid('Tutor inválido').nullable().optional(),
    programId: z.string().uuid('Programa inválido').nullable().optional(),
});

export type GroupInput = z.infer<typeof groupSchema>;
