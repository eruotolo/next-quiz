import { z } from 'zod';

export const studentProfileUpdateSchema = z.object({
    name: z.string().trim().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
    lastname: z
        .string()
        .trim()
        .min(1, 'Apellido requerido')
        .max(100, 'Máximo 100 caracteres'),
    email: z.string().trim().email('Email inválido').max(200, 'Máximo 200 caracteres'),
    phone: z
        .string()
        .trim()
        .max(20, 'Máximo 20 caracteres')
        .optional()
        .or(z.literal('')),
});

export type StudentProfileUpdateInput = z.infer<typeof studentProfileUpdateSchema>;
