import { z } from 'zod';

export const institutionSchema = z.object({
    name: z.string().min(2, 'Nombre requerido').max(200),
    slug: z
        .string()
        .min(2, 'Slug requerido')
        .max(100)
        .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
    phone: z.string().min(5, 'Teléfono requerido').max(30),
    address: z.string().min(5, 'Dirección requerida').max(300),
    city: z.string().min(2, 'Ciudad requerida').max(100),
    campus: z.string().max(100).optional(),
    country: z.string().min(2, 'País requerido').max(100).default('Chile'),
    active: z.boolean().default(true),
});

export type InstitutionInput = z.infer<typeof institutionSchema>;

export const institutionSettingsSchema = z.object({
    name: z.string().min(2, 'Nombre requerido').max(200),
    phone: z.string().min(5, 'Teléfono requerido').max(30),
    address: z.string().min(5, 'Dirección requerida').max(300),
    city: z.string().min(2, 'Ciudad requerida').max(100),
    campus: z.string().max(100).optional(),
    country: z.string().min(2, 'País requerido').max(100).default('Chile'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    // SEO
    seoTitle: z.string().max(70, 'El título SEO no debe exceder los 70 caracteres').optional(),
    seoDescription: z
        .string()
        .max(160, 'La descripción SEO no debe exceder los 160 caracteres')
        .optional(),
    seoKeywords: z.array(z.string()).optional(),
});

export type InstitutionSettingsInput = z.infer<typeof institutionSettingsSchema>;

export const PLAN_VALUES = ['FREE', 'DOCENTE', 'COLEGIO', 'INSTITUCIONAL'] as const;

export const assignPlanSchema = z.object({
    plan: z.enum(PLAN_VALUES),
    // Fecha de vencimiento opcional en formato YYYY-MM-DD; vacío = sin vencimiento.
    planExpiresAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
        .optional()
        .or(z.literal('')),
});

