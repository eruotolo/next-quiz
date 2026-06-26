import { z } from 'zod';

export const assignCoordinatorSchema = z.object({
    userId: z.string().uuid('Profesor inválido'),
});

export type AssignCoordinatorInput = z.infer<typeof assignCoordinatorSchema>;
