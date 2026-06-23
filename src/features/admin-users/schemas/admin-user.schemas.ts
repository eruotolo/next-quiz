import { isValidRut, normalizeRut } from '@/shared/lib/rut';
import { USER_ROLE } from '@/shared/lib/roles';
import { z } from 'zod';

const MANAGEABLE_ROLES = [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN] as const;

export const adminUserCreateSchema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(100),
    lastname: z.string().min(1, 'Apellido requerido').max(100),
    email: z.string().email('Email inválido'),
    rut: z
        .string()
        .min(1, 'RUT requerido')
        .transform((v) => normalizeRut(v))
        .refine((v) => isValidRut(v), 'RUT inválido'),
    role: z.enum(MANAGEABLE_ROLES, { message: 'Rol inválido' }),
    academicInstitutionId: z.string().uuid('Institución inválida').optional(),
});


export const adminUserUpdateSchema = z.object({
    name: z.string().min(1, 'Nombre requerido').max(100),
    lastname: z.string().min(1, 'Apellido requerido').max(100),
    email: z.string().email('Email inválido'),
    rut: z
        .string()
        .min(1, 'RUT requerido')
        .transform((v) => normalizeRut(v))
        .refine((v) => isValidRut(v), 'RUT inválido'),
    role: z.enum(MANAGEABLE_ROLES, { message: 'Rol inválido' }),
    academicInstitutionId: z.string().uuid('Institución inválida').optional(),
    password: z
        .string()
        .optional()
        .refine((v) => !v || v.length >= 8, 'La contraseña debe tener al menos 8 caracteres'),
});

