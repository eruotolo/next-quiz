import { z } from 'zod';
import { questionTypeEnum } from '@/features/exams/schemas/exam.schemas';

export const bankOptionSchema = z.object({
    id: z.string().uuid().optional(),
    text: z.string().min(1, 'Texto de opción requerido').max(500),
    isCorrect: z.boolean().default(false),
});

export const bankQuestionSchema = z
    .object({
        id: z.string().uuid().optional(),
        text: z.string().min(1, 'Texto de pregunta requerido').max(2000),
        questionType: questionTypeEnum.default('UNICA'),
        subject: z
            .preprocess((v) => (v === '' ? null : v), z.string().max(120).nullable())
            .optional(),
        unit: z
            .preprocess((v) => (v === '' ? null : v), z.string().max(120).nullable())
            .optional(),
        difficulty: z.enum(['FACIL', 'MEDIA', 'DIFICIL']).default('MEDIA'),
        tags: z.array(z.string().max(60)).max(10).default([]),
        feedback: z
            .preprocess((v) => (v === '' ? null : v), z.string().max(2000).nullable())
            .optional(),
        options: z.array(bankOptionSchema).min(2, 'Mínimo 2 opciones').max(6),
    })
    .superRefine((q, ctx) => {
        const correctCount = q.options.filter((o) => o.isCorrect).length;
        if (q.questionType === 'UNICA' && correctCount !== 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Una pregunta de opción única debe tener exactamente 1 respuesta correcta',
                path: ['options'],
            });
        } else if (q.questionType === 'MULTIPLE' && correctCount < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    'Una pregunta de opción múltiple debe tener al menos 2 respuestas correctas',
                path: ['options'],
            });
        }
    });

export const bankQuestionFilterSchema = z.object({
    search: z.string().trim().max(200).optional(),
    subject: z.string().max(120).optional(),
    unit: z.string().max(120).optional(),
    difficulty: z.enum(['FACIL', 'MEDIA', 'DIFICIL']).optional(),
    tag: z.string().max(60).optional(),
});

export type BankOptionInput = z.infer<typeof bankOptionSchema>;
export type BankQuestionInput = z.infer<typeof bankQuestionSchema>;
export type BankQuestionFilter = z.infer<typeof bankQuestionFilterSchema>;
