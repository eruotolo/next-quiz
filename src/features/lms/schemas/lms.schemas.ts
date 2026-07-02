import { z } from 'zod';
import { isValidExternalLinkForType } from '@/features/lms/lib/lesson-url-validators';

export const lmsCourseSchema = z.object({
    title: z.string().min(1, 'El título es requerido').max(200),
    description: z.string().max(2000).optional().nullable(),
    coverImageUrl: z.string().url().optional().nullable(),
    courseSectionId: z.string().uuid().optional().nullable(),
    published: z.boolean().default(false),
});

export type LmsCourseInput = z.infer<typeof lmsCourseSchema>;

/**
 * Edición básica de un curso desde el modal "Editar Curso".
 * El precio es opcional: si no se envía, no se toca.
 * Si se envía null, el curso pasa a ser gratuito.
 */
export const lmsCourseBasicSchema = z.object({
    title: z.string().min(1, 'El título es requerido').max(200),
    description: z.string().max(2000).optional().nullable(),
    price: z.number().min(0).nullable().optional(),
});

export type LmsCourseBasicInput = z.infer<typeof lmsCourseBasicSchema>;

export const lmsModuleSchema = z.object({
    title: z.string().min(1, 'El título es requerido').max(200),
    description: z.string().max(2000).optional().nullable(),
    order: z.number().int().min(0).default(0),
});

const LINK_TYPES = ['VIDEO', 'ENLACE', 'EN_VIVO'] as const;

export const lmsLessonSchema = z
    .object({
        moduleId: z.string().uuid('Módulo inválido'),
        title: z.string().min(1, 'El título es requerido').max(200),
        type: z.enum(['VIDEO', 'DOCUMENTO', 'TEXTO', 'ENLACE', 'EXAMEN', 'TAREA', 'EN_VIVO']),
        order: z.number().int().min(0).default(0),
        contentJson: z.unknown().optional().nullable(),
        fileUrl: z.string().url().optional().nullable(),
        externalLink: z.string().url().optional().nullable(),
        durationSec: z.number().int().min(0).optional().nullable(),
        examId: z.string().uuid().optional().nullable(),
    })
    .superRefine((data, ctx) => {
        if (LINK_TYPES.includes(data.type as (typeof LINK_TYPES)[number])) {
            if (!data.externalLink) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['externalLink'],
                    message: 'Este tipo de lección requiere un enlace.',
                });
                return;
            }
            if (!isValidExternalLinkForType(data.type, data.externalLink)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['externalLink'],
                    message:
                        data.type === 'VIDEO'
                            ? 'La URL debe ser de YouTube o Vimeo.'
                            : data.type === 'EN_VIVO'
                              ? 'La URL debe ser de Google Meet o Zoom.'
                              : 'La URL no es válida.',
                });
            }
        }
    });

export const reorderModulesSchema = z.object({
    courseId: z.string().uuid(),
    moduleIds: z.array(z.string().uuid()).min(1),
});

export const reorderLessonsSchema = z.object({
    moduleId: z.string().uuid(),
    lessonIds: z.array(z.string().uuid()).min(1),
});

export const markLessonProgressSchema = z.object({
    lessonId: z.string().uuid(),
    completed: z.boolean(),
    lastSeenSec: z.number().int().min(0).optional().nullable(),
});
