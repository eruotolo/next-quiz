import { z } from 'zod';

// ─── Fase 5: Certificados de finalización ────────────────────────────────────

export const issueCertificateSchema = z.object({
    studentId: z.string().uuid('Estudiante inválido'),
    courseId: z.string().uuid('Curso inválido'),
    finalGrade: z
        .number()
        .min(1.0, 'La nota mínima es 1.0')
        .max(7.0, 'La nota máxima es 7.0')
        .optional()
        .nullable(),
});

export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;

export const revokeCertificateSchema = z.object({
    certificateId: z.string().uuid('Certificado inválido'),
});

export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>;

export const verificationCodeSchema = z
    .string()
    .min(20, 'Código de verificación inválido')
    .max(40);

export type VerificationCode = z.infer<typeof verificationCodeSchema>;

// ─── Fase 5: Resúmenes IA de lecciones ───────────────────────────────────────

export const generateLessonSummarySchema = z.object({
    lessonId: z.string().uuid('Lección inválida'),
});

export type GenerateLessonSummaryInput = z.infer<typeof generateLessonSummarySchema>;

export interface LessonSummary {
    summary: string;
    keyPoints: string[];
    generatedAt: string;
}

// ─── Fase 5: Detección temprana de bajo rendimiento ─────────────────────────

export interface AtRiskStudent {
    studentId: string;
    studentName: string;
    studentRut: string | null;
    averageGrade: number | null;
    lessonsCompleted: number;
    lessonsTotal: number;
    lastActivityAt: string | null;
    daysSinceLastActivity: number | null;
    riskScore: number;
    riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
    reasons: string[];
}

export interface CourseFailingMetrics {
    courseId: string;
    totalStudents: number;
    averageGrade: number | null;
    approvedCount: number;
    failedCount: number;
    approvalRate: number | null;
    atRiskCount: number;
}
