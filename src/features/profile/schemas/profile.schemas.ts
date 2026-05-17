import { isValidRut, normalizeRut } from '@/shared/lib/rut';
import { z } from 'zod';

export const profileUpdateSchema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(100),
    lastname: z.string().min(1, 'Apellido requerido').max(100),
    email: z.string().email('Email inválido'),
    rut: z
        .string()
        .min(1, 'RUT requerido')
        .transform((v) => normalizeRut(v))
        .refine((v) => isValidRut(v), 'RUT inválido'),
    password: z
        .string()
        .optional()
        .refine((v) => !v || v.length >= 8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
