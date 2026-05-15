import { z } from 'zod';

export const submitAnswerSchema = z.object({
    questionId: z.string().uuid(),
    optionIds: z.array(z.string().uuid()).min(1).max(6),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
