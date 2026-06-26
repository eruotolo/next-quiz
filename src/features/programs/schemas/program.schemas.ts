import { z } from 'zod';

export const programSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(120),
    code: z.string().max(40).optional().or(z.literal('')),
    description: z.string().max(500).optional().or(z.literal('')),
});

export type ProgramInput = z.infer<typeof programSchema>;
