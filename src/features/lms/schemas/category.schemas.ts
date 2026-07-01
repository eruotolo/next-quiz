import { z } from 'zod';

/**
 * CRUD de categorías dentro del LMS admin. El slug se autogenera a partir del
 * nombre si no se envía (slugify básico). `coverImageUrl` y `description` son
 * opcionales. Los flags `isBundle` y `isPublic` son independientes.
 */
export const lmsCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(100),
    slug: z
        .string()
        .min(1)
        .max(80)
        .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones')
        .optional(),
    description: z.string().max(500).optional().nullable(),
    coverImageUrl: z.string().url().optional().nullable(),
    order: z.number().int().min(0).default(0),
    isBundle: z.boolean().default(false),
    bundlePrice: z.number().min(0).nullable().optional(),
    isPublic: z.boolean().default(false),
});

export type LmsCategoryInput = z.infer<typeof lmsCategorySchema>;

/**
 * Slugify básico: lowercase, sin acentos, guiones en lugar de espacios y
 * caracteres no-alfanuméricos. Suficiente para nombres de categorías en español.
 */
export function slugifyCategory(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80);
}