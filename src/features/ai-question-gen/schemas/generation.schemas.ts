import { z } from 'zod';

export const difficultyEnum = z.enum(['FACIL', 'MEDIA', 'DIFICIL']);

export const generationInputSchema = z
    .object({
        slug: z.string().min(1),
        subject: z.string().min(1, 'Materia requerida').max(120),
        topic: z.string().min(1, 'Temática requerida').max(500),
        questionCount: z.coerce.number().int().min(1, 'Mínimo 1').max(20, 'Máximo 20'),
        optionsPerQuestion: z.coerce.number().int().min(2, 'Mínimo 2').max(6, 'Máximo 6'),
        correctAnswers: z.coerce.number().int().min(1).max(6),
        difficulty: difficultyEnum.default('MEDIA'),
        points: z.coerce.number().int().min(1).max(100).default(1),
    })
    .refine((d) => d.correctAnswers <= d.optionsPerQuestion, {
        message: 'Las correctas no pueden superar las opciones',
        path: ['correctAnswers'],
    });

export type GenerationInput = z.infer<typeof generationInputSchema>;

export interface GeneratedOption {
    text: string;
    isCorrect: boolean;
}

export interface GeneratedQuestion {
    text: string;
    questionType: 'UNICA' | 'MULTIPLE';
    points: number;
    options: GeneratedOption[];
}

export const generatedOptionSchema = z.object({
    text: z.string().min(1),
    isCorrect: z.boolean(),
});

export const generatedQuestionSchema = z.object({
    text: z.string().min(1, 'Pregunta sin texto'),
    questionType: z.enum(['UNICA', 'MULTIPLE']),
    points: z.number().int().min(1),
    options: z.array(generatedOptionSchema).min(2).max(6),
});
