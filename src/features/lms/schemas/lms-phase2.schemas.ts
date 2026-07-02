import { z } from 'zod';

// ─── Fase 2: Assignments (Tareas) ────────────────────────────────────────────

export const lmsAssignmentSchema = z.object({
    lessonId: z.string().uuid('Lección inválida'),
    instructions: z.string().max(5000).optional().nullable(),
    dueAt: z.coerce.date().optional().nullable(),
    maxScore: z.number().int().min(1).max(1000).default(100),
});

export type LmsAssignmentInput = z.infer<typeof lmsAssignmentSchema>;

export const lmsSubmissionSchema = z.object({
    assignmentId: z.string().uuid('Tarea inválida'),
    fileUrl: z.string().url().optional().nullable(),
    textContent: z.string().max(10000).optional().nullable(),
});

export type LmsSubmissionInput = z.infer<typeof lmsSubmissionSchema>;

export const gradeSubmissionSchema = z.object({
    submissionId: z.string().uuid(),
    score: z.number().min(1).max(7),
    feedback: z.string().max(5000).optional().nullable(),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;

// ─── Fase 2: Gradebook (Libro de Calificaciones) ─────────────────────────────

export const lmsGradebookItemSchema = z.object({
    courseId: z.string().uuid('Curso inválido'),
    title: z.string().min(1, 'El título es requerido').max(200),
    type: z.enum(['EXAMEN', 'TAREA', 'PARTICIPACION', 'MANUAL']),
    weight: z.number().min(0).max(1).default(1),
    assignmentId: z.string().uuid().optional().nullable(),
    examId: z.string().uuid().optional().nullable(),
});

export type LmsGradebookItemInput = z.infer<typeof lmsGradebookItemSchema>;

export const lmsGradeSchema = z.object({
    gradebookItemId: z.string().uuid(),
    studentId: z.string().uuid(),
    score: z.number().min(1).max(7),
    feedback: z.string().max(5000).optional().nullable(),
});

export type LmsGradeInput = z.infer<typeof lmsGradeSchema>;
