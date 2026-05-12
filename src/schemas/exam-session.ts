import { z } from 'zod';

export const submitAnswerSchema = z.object({
    questionId: z.string().uuid(),
    optionId: z.string().uuid(),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
