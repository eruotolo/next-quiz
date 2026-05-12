import { isValidRut, normalizeRut } from '@/lib/rut';
import { z } from 'zod';

export const adminLoginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const studentLoginSchema = z.object({
    rut: z
        .string()
        .min(1, 'RUT requerido')
        .transform((value) => normalizeRut(value))
        .refine(isValidRut, 'RUT inválido'),
});

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
