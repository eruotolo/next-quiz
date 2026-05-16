import { z } from 'zod';

export const auditQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    perPage: z.coerce.number().int().positive().max(100).default(10),
    q: z.string().optional(),
    action: z.string().optional(),
    institutionId: z.string().optional(),
    status: z.enum(['success', 'failure']).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;
