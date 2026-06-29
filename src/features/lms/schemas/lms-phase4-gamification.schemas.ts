import { z } from 'zod';

// ─── Fase 4: Gamificación (Badge catalog + manual award) ─────────────────────

export const lmsBadgeSchema = z.object({
    code: z
        .string()
        .min(3, 'El código debe tener al menos 3 caracteres')
        .max(60)
        .regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, dígitos y guion bajo'),
    name: z.string().min(1, 'El nombre es requerido').max(80),
    description: z.string().min(1).max(300),
    icon: z.string().min(1).max(40),
    pointsReward: z.number().int().min(0).max(10000).default(0),
    criteria: z.object({
        type: z.enum([
            'TOTAL_POINTS',
            'LESSONS_COMPLETED',
            'ASSIGNMENTS_SUBMITTED',
            'EXAMS_PASSED',
            'FORUM_POSTS',
            'LONGEST_STREAK',
        ]),
        threshold: z.number().int().min(1).max(10000),
    }),
    active: z.boolean().default(true),
});

export type LmsBadgeInput = z.infer<typeof lmsBadgeSchema>;

export const awardManualPointsSchema = z.object({
    studentId: z.string().uuid('Estudiante inválido'),
    amount: z.number().int().min(1).max(10000),
    reason: z.string().min(3, 'La razón debe tener al menos 3 caracteres').max(300),
    courseId: z.string().uuid().optional().nullable(),
});

export type AwardManualPointsInput = z.infer<typeof awardManualPointsSchema>;