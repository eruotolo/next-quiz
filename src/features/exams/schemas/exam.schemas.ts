import { z } from 'zod';

import { questionTypeEnum } from '@/shared/schemas/question-types';
export const optionSchema = z.object({
    id: z.string().uuid().optional(),
    text: z.string().min(1, 'Texto de opción requerido').max(500),
    isCorrect: z.boolean().default(false),
});

export const questionSchema = z
    .object({
        id: z.string().uuid().optional(),
        text: z.string().min(1, 'Texto de pregunta requerido').max(2000),
        points: z.coerce.number().int().min(1).max(100).default(1),
        order: z.number().int().min(0).default(0),
        questionType: questionTypeEnum.default('UNICA'),
        options: z.array(optionSchema).min(2, 'Mínimo 2 opciones').max(6),
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

export const importQuestionsSchema = z
    .array(questionSchema)
    .min(1, 'Al menos 1 pregunta')
    .max(200, 'Máximo 200 preguntas');

// Campo de texto opcional: ausente = no tocar (undefined), vacío = limpiar (null).
const optionalText = z
    .preprocess((v) => (v === '' ? null : v), z.string().max(120).nullable())
    .optional();

// Campo de fecha opcional desde <input type="datetime-local">: ausente = no tocar,
// vacío = limpiar (null), string = coerción a Date.
const optionalDate = z
    .preprocess((v) => (v === '' ? null : v), z.coerce.date().nullable())
    .optional();

export const examSchema = z
    .object({
        title: z.string().min(1, 'Título requerido').max(200),
        timeLimit: z.coerce.number().int().min(1, 'Mínimo 1 minuto').max(180, 'Máximo 3 horas'),
        active: z.boolean().default(false),
        antiCheatEnabled: z.boolean().default(false),
        lockTabSwitch: z.boolean().default(false),
        randomizeQuestions: z.boolean().default(false),
        groupIds: z.array(z.string().uuid()).min(1, 'Seleccioná al menos un grupo'),
        maxGrade: z.coerce.number().min(1).max(10).default(7),
        passingGrade: z.coerce.number().min(1).max(10).default(4),
        passingPercentage: z.coerce.number().int().min(1).max(99).default(60),
        subject: optionalText,
        unit: optionalText,
        // Asignatura/materia del plan académico (CourseSection). Metadata de
        // categorización únicamente (D6): NO decide quién rinde el examen.
        courseSectionId: z.string().uuid('Asignatura inválida').nullable().optional(),
        scheduledAt: optionalDate,
        closesAt: optionalDate,
    })
    .refine((data) => data.passingGrade < data.maxGrade, {
        message: 'La nota de aprobación debe ser menor a la nota máxima',
        path: ['passingGrade'],
    })
    .refine((data) => !(data.scheduledAt && data.closesAt) || data.scheduledAt < data.closesAt, {
        message: 'La fecha de inicio debe ser anterior a la de cierre',
        path: ['closesAt'],
    });

export type OptionInput = z.infer<typeof optionSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type ExamInput = z.infer<typeof examSchema>;
