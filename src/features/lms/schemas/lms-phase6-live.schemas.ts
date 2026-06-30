import { z } from 'zod';

const titleSchema = z.string().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres');

const dateInFuture = (now: Date = new Date()) =>
    z.coerce
        .date({ invalid_type_error: 'Fecha inválida' })
        .refine((d) => d.getTime() > now.getTime() - 5 * 60_000, {
            message: 'La fecha debe ser en el futuro',
        });

export const createLiveSessionSchema = z.object({
    courseId: z.string().uuid(),
    title: titleSchema,
    description: z.string().max(500).optional().default(''),
    scheduledAt: dateInFuture(),
    durationMin: z.coerce
        .number({ invalid_type_error: 'Duración inválida' })
        .int('Duración inválida')
        .min(10, 'Mínimo 10 minutos')
        .max(480, 'Máximo 8 horas'),
    maxParticipants: z.coerce
        .number()
        .int()
        .min(2, 'Mínimo 2 participantes')
        .max(200, 'Máximo 200 participantes')
        .optional(),
});

export const updateLiveSessionSchema = z.object({
    sessionId: z.string().uuid(),
    title: titleSchema.optional(),
    description: z.string().max(500).optional(),
    scheduledAt: z.coerce.date().optional(),
    durationMin: z.coerce.number().int().min(10).max(480).optional(),
    maxParticipants: z.coerce.number().int().min(2).max(200).nullable().optional(),
});

export const liveSessionIdSchema = z.object({
    sessionId: z.string().uuid(),
});

export const startLiveSessionSchema = liveSessionIdSchema;
export const endLiveSessionSchema = liveSessionIdSchema;
export const cancelLiveSessionSchema = liveSessionIdSchema;

export const joinLiveSessionSchema = z.object({
    sessionId: z.string().uuid(),
    dailyParticipantId: z.string().max(120).optional().nullable(),
});

export const leaveLiveSessionSchema = z.object({
    sessionId: z.string().uuid(),
    attendanceId: z.string().uuid(),
});

export const sendLiveChatSchema = z.object({
    sessionId: z.string().uuid(),
    content: z.string().min(1, 'Mensaje vacío').max(800, 'Mensaje demasiado largo'),
});

export const listLiveChatSchema = z.object({
    sessionId: z.string().uuid(),
    since: z.coerce.date().optional().nullable(),
});

export const saveWhiteboardSnapshotSchema = z.object({
    sessionId: z.string().uuid(),
    pngBase64: z
        .string()
        .min(100, 'PNG inválido (demasiado pequeño)')
        .max(6_000_000, 'PNG demasiado grande (máximo 4.5 MB en base64)'),
    width: z.number().int().min(1).max(8000),
    height: z.number().int().min(1).max(8000),
    title: z.string().max(80).optional().nullable(),
});

export type CreateLiveSessionInput = z.infer<typeof createLiveSessionSchema>;
export type UpdateLiveSessionInput = z.infer<typeof updateLiveSessionSchema>;
export type JoinLiveSessionInput = z.infer<typeof joinLiveSessionSchema>;
export type SendLiveChatInput = z.infer<typeof sendLiveChatSchema>;
export type ListLiveChatInput = z.infer<typeof listLiveChatSchema>;
export type SaveWhiteboardSnapshotInput = z.infer<typeof saveWhiteboardSnapshotSchema>;
