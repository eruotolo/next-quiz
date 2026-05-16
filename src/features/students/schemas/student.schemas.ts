import { isValidRut, normalizeRut } from '@/shared/lib/rut';
import { z } from 'zod';

export const studentSchema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(100),
    lastname: z.string().min(1, 'Apellido requerido').max(100),
    email: z.string().email('Email inválido'),
    rut: z
        .string()
        .min(1, 'RUT requerido')
        .transform((v) => normalizeRut(v))
        .refine((v) => isValidRut(v), 'RUT inválido'),
    groupId: z.string().uuid('Grupo inválido'),
});

export type StudentInput = z.infer<typeof studentSchema>;

export const studentLoginSchema = z.object({
    rut: z
        .string()
        .min(1, 'RUT requerido')
        .transform((value) => normalizeRut(value))
        .refine(isValidRut, 'RUT inválido'),
});

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
