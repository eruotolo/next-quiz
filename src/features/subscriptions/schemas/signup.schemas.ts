import { z } from 'zod';
import { isValidRut } from '@/shared/lib/rut';

const rutField = z.string().min(1, 'El RUT es requerido').refine(isValidRut, 'RUT inválido');

export const signupFreeSchema = z.object({
    institutionName: z.string().min(3, 'Mínimo 3 caracteres').max(200),
    institutionRut: rutField,
    institutionPhone: z.string().min(8, 'Teléfono inválido').max(30),
    institutionCity: z.string().min(2, 'Ciudad requerida').max(100),
    adminName: z.string().min(2, 'Nombre requerido').max(100),
    adminLastname: z.string().min(2, 'Apellido requerido').max(100),
    adminEmail: z.string().email('Email inválido'),
    adminRut: rutField,
    adminPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    acceptTerms: z.boolean().refine((v) => v, 'Debes aceptar los términos de uso'),
});

export type SignupFreeInput = z.infer<typeof signupFreeSchema>;

export const payerSchema = z.object({
    payerName: z.string().min(2, 'Nombre requerido').max(100),
    payerLastname: z.string().min(2, 'Apellido requerido').max(100),
    payerEmail: z.string().email('Email inválido'),
    billing: z.enum(['monthly', 'annual']),
});

export type PayerInput = z.infer<typeof payerSchema>;
export const payerFormSchema = payerSchema;
export type PayerFormInput = z.infer<typeof payerFormSchema>;

export const registrationSchema = z.object({
    subscriptionId: z.string().uuid('ID de suscripción inválido'),
    institutionName: z.string().min(3, 'Mínimo 3 caracteres').max(200),
    institutionRut: rutField,
    institutionPhone: z.string().min(8, 'Teléfono inválido').max(30),
    institutionCity: z.string().min(2, 'Ciudad requerida').max(100),
    adminName: z.string().min(2, 'Nombre requerido').max(100),
    adminLastname: z.string().min(2, 'Apellido requerido').max(100),
    adminEmail: z.string().email('Email inválido'),
    adminRut: rutField,
    adminPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    acceptTerms: z.boolean().refine((v) => v, 'Debes aceptar los términos de uso'),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
