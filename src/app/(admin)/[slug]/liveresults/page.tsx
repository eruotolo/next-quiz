import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import {
    LiveResultsClient,
    type ExamOption,
    type GroupOption,
    type LiveExamData,
    type LiveResultRow,
} from '@/features/results/components/LiveResultsClient';
import { calcGrade } from '@/shared/lib/grade';
import { prisma } from '@/shared/lib/prisma';
import { examProfessorFilter } from '@/shared/lib/scoping';

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ examId?: string; groupId?: string }>;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy complex UI component
export default async function LiveResultsPage({ params, searchParams }: PageProps) {
    const [{ slug }, { examId: paramExamId, groupId: paramGroupId }] = await Promise.all([
        params,
        searchParams,
    ]);
    const { institutionId, institutionName, isProfesor, userId } =
        await requireInstitutionPageAccess(slug);

    const activeExams = await prisma.exam.findMany({
        where: {
            active: true,
            academicInstitutionId: institutionId,
            ...(isProfesor && examProfessorFilter(userId)),
        },
        select: { id: true, title: true, active: true },
        orderBy: { createdAt: 'desc' },
    });

    const examOptions: ExamOption[] = activeExams;

    const validParamId = activeExams.some((e) => e.id === paramExamId) ? paramExamId : undefined;
    const examId = validParamId ?? activeExams[0]?.id;

    // Groups for the selected exam (for the group selector)
    let groupOptions: GroupOption[] = [];
    if (examId) {
        const examWithGroups = await prisma.exam.findUnique({
            where: { id: examId },
            select: { groups: { select: { id: true, name: true }, orderBy: { name: 'asc' } } },
        });
        groupOptions = examWithGroups?.groups ?? [];
    }

    const validGroupId = groupOptions.some((g) => g.id === paramGroupId) ? paramGroupId : undefined;

    let examData: LiveExamData | null = null;

    if (examId) {
        const groupFilter = validGroupId ? { student: { groupId: validGroupId } } : {};

        const [exam, inProgressAnswers, completedResults] = await Promise.all([
            prisma.exam.findUnique({
                where: { id: examId },
                select: {
                    id: true,
                    title: true,
                    maxGrade: true,
                    passingGrade: true,
                    passingPercentage: true,
                    questions: {
                        orderBy: { order: 'asc' },
                        select: {
                            id: true,
                            order: true,
                            text: true,
                            points: true,
                            options: { select: { id: true, text: true, isCorrect: true } },
                        },
                    },
                },
            }),
            prisma.answer.findMany({
                where: { examId, ...groupFilter },
                select: {
                    studentId: true,
                    questionId: true,
                    optionId: true,
                    timeSpentMs: true,
                    student: { select: { name: true, lastname: true } },
                },
            }),
            prisma.result.findMany({
                where: { examId, ...groupFilter },
                select: {
                    studentId: true,
                    score: true,
                    maxScore: true,
                    answers: true,
                    student: { select: { name: true, lastname: true } },
                },
                orderBy: { completedAt: 'asc' },
            }),
        ]);

        if (exam) {
            const completedStudentIds = new Set(completedResults.map((r) => r.studentId));
            const inProgressMap = new Map<
                string,
                { name: string; answers: Record<string, string[]> }
            >();

            for (const a of inProgressAnswers) {
                if (completedStudentIds.has(a.studentId)) continue;
                if (!inProgressMap.has(a.studentId)) {
                    inProgressMap.set(a.studentId, {
                        name: `${a.student.name} ${a.student.lastname}`,
                        answers: {},
                    });
                }
                const entry = inProgressMap.get(a.studentId);
                if (entry) {
                    const prev = entry.answers[a.questionId];
                    if (prev) {
                        prev.push(a.optionId);
                    } else {
                        entry.answers[a.questionId] = [a.optionId];
                    }
                }
            }

            const timeBuckets = new Map<string, { sum: number; count: number }>();
            for (const a of inProgressAnswers) {
                if (a.timeSpentMs == null) continue;
                const b = timeBuckets.get(a.questionId) ?? { sum: 0, count: 0 };
                b.sum += a.timeSpentMs;
                b.count += 1;
                timeBuckets.set(a.questionId, b);
            }
            const avgTimePerQuestion: Record<string, number> = {};
            for (const [qId, b] of timeBuckets) {
                avgTimePerQuestion[qId] = Math.round(b.sum / b.count);
            }

            const rows: LiveResultRow[] = [];

            for (const [studentId, data] of inProgressMap) {
                rows.push({
                    studentId,
                    studentName: data.name,
                    score: null,
                    maxScore: null,
                    grade: null,
                    passing: null,
                    status: 'in-progress',
                    answers: data.answers,
                });
            }
            rows.sort((a, b) => {
                if (a.status !== 'completed' && b.status !== 'completed') {
                    return Object.keys(b.answers).length - Object.keys(a.answers).length;
                }
                return 0;
            });

            for (const r of completedResults) {
                const grade = calcGrade(
                    r.score,
                    r.maxScore,
                    exam.maxGrade,
                    exam.passingGrade,
                    exam.passingPercentage,
                );
                rows.push({
                    studentId: r.studentId,
                    studentName: `${r.student.name} ${r.student.lastname}`,
                    score: r.score,
                    maxScore: r.maxScore,
                    grade,
                    passing: grade >= exam.passingGrade,
                    status: 'completed',
                    answers: r.answers as Record<string, string[] | string>,
                });
            }

            examData = {
                examId: exam.id,
                title: exam.title,
                maxGrade: exam.maxGrade,
                passingGrade: exam.passingGrade,
                passingPercentage: exam.passingPercentage,
                questions: exam.questions,
                avgTimePerQuestion,
                results: rows,
            };
        }
    }

    return (
        <LiveResultsClient
            allExams={examOptions}
            selectedExamId={examId ?? null}
            examData={examData}
            groupOptions={groupOptions}
            selectedGroupId={validGroupId ?? null}
        />
    );
}
