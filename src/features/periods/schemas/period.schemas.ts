import { z } from 'zod';

export const PERIOD_TYPES = ['ANUAL', 'SEMESTRE', 'TRIMESTRE', 'MODULO', 'OTRO'] as const;

export const periodSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    year: z.coerce.number().int().min(2000, 'Año inválido').max(2100, 'Año inválido'),
    type: z.enum(PERIOD_TYPES, { errorMap: () => ({ message: 'Tipo inválido' }) }),
    startDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    endDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
    isActive: z.boolean().default(false),
});
