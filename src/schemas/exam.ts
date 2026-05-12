import { z } from 'zod';

export const optionSchema = z.object({
    id: z.string().uuid().optional(),
    text: z.string().min(1, 'Texto de opción requerido').max(500),
    isCorrect: z.boolean().default(false),
});

export const questionSchema = z.object({
    id: z.string().uuid().optional(),
    text: z.string().min(1, 'Texto de pregunta requerido').max(2000),
    points: z.coerce.number().int().min(1).max(100).default(1),
    order: z.number().int().min(0).default(0),
    options: z
        .array(optionSchema)
        .min(2, 'Mínimo 2 opciones')
        .max(6)
        .refine((opts) => opts.some((o) => o.isCorrect), 'Debe haber al menos una opción correcta'),
});

export const examSchema = z.object({
    title: z.string().min(1, 'Título requerido').max(200),
    timeLimit: z.coerce.number().int().min(1, 'Mínimo 1 minuto').max(180, 'Máximo 3 horas'),
    active: z.boolean().default(false),
    groupIds: z.array(z.string().uuid()).min(1, 'Seleccioná al menos un grupo'),
    maxGrade: z.coerce.number().min(1).max(10).default(7),
    passingGrade: z.coerce.number().min(1).max(10).default(4),
    passingPercentage: z.coerce.number().int().min(1).max(99).default(60),
});

export type OptionInput = z.infer<typeof optionSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type ExamInput = z.infer<typeof examSchema>;
