import { z } from 'zod';

export const groupSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
});

export type GroupInput = z.infer<typeof groupSchema>;
