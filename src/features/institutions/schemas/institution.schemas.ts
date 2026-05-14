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
