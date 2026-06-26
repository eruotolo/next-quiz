import { isValidRut, normalizeRut } from '@/shared/lib/rut';
import { z } from 'zod';

export const createProfessorSchema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(100),
    lastname: z.string().min(1, 'Apellido requerido').max(100),
    email: z.string().email('Email inválido'),
    rut: z
        .string()
        .min(1, 'RUT requerido')
        .transform((v) => normalizeRut(v))
        .refine((v) => isValidRut(v), 'RUT inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    phone: z.string().optional(),
    roleName: z.enum(['Profesor', 'Administrador']),
    groupIds: z.array(z.string().uuid()),
});

export const updateProfessorSchema = createProfessorSchema.extend({
    password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
});
