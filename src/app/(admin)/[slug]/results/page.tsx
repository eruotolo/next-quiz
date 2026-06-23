import { prisma } from '@/shared/lib/prisma';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import { examProfessorFilter } from '@/shared/lib/scoping';
import {
    ResultsClient,
    type ExamGroup,
    type ExamOption,
    type GroupOption,
    type ResultRow,
} from '@/features/results/components/ResultsClient';

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ examId?: string; groupId?: string }>;
}

export default async function ResultsPage({
    params,
    searchParams,
}: PageProps) {
    const { slug } = await params;
    const { examId: paramExamId, groupId: paramGroupId } = await searchParams;
    const { institutionId, institutionName, isProfesor, userId } =
        await requireInstitutionPageAccess(slug);

    // Exams with results visible to this user (for the exam selector)
    const examOptionsRaw = await prisma.exam.findMany({
        where: {
            academicInstitutionId: institutionId,
            results: { some: {} },
            ...(isProfesor && examProfessorFilter(userId)),
        },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
    });

    const examOptions: ExamOption[] = examOptionsRaw;
    const validExamId = examOptionsRaw.some((e) => e.id === paramExamId)
        ? paramExamId
        : undefined;

    // Groups for the selected exam (for the group selector)
    let groupOptions: GroupOption[] = [];
    if (validExamId) {
        const examWithGroups = await prisma.exam.findUnique({
            where: { id: validExamId },
            select: { groups: { select: { id: true, name: true }, orderBy: { name: 'asc' } } },
        });
        groupOptions = examWithGroups?.groups ?? [];
    }

    const validGroupId = groupOptions.some((g) => g.id === paramGroupId)
        ? paramGroupId
        : undefined;

    const results = await prisma.result.findMany({
        where: {
            exam: {
                academicInstitutionId: institutionId,
                ...(isProfesor && examProfessorFilter(userId)),
                ...(validExamId && { id: validExamId }),
            },
            ...(validGroupId && { student: { groupId: validGroupId } }),
        },
        include: {
            student: { select: { name: true, lastname: true, rut: true, groupId: true } },
            exam: {
                select: {
                    id: true,
                    title: true,
                    maxGrade: true,
                    passingGrade: true,
                    passingPercentage: true,
                    groups: { select: { id: true, name: true } },
                    questions: {
                        orderBy: { order: 'asc' },
                        select: {
                            id: true,
                            order: true,
                            text: true,
                            options: { select: { id: true, text: true, isCorrect: true } },
                        },
                    },
                },
            },
        },
        orderBy: { completedAt: 'desc' },
    });

    // Group by examId + groupId — each combo is a separate section
    const byExamAndGroup = new Map<string, ExamGroup>();

    for (const r of results) {
        const studentGroupId = r.student.groupId ?? 'no-group';
        const key = `${r.examId}-${studentGroupId}`;

        if (!byExamAndGroup.has(key)) {
            const group = r.exam.groups.find((g) => g.id === studentGroupId);
            byExamAndGroup.set(key, {
                examId: r.examId,
                groupId: studentGroupId,
                title: r.exam.title,
                groupName: group?.name ?? 'Sin grupo',
                maxGrade: r.exam.maxGrade,
                passingGrade: r.exam.passingGrade,
                passingPercentage: r.exam.passingPercentage,
                questions: r.exam.questions,
                results: [],
            });
        }

        const row: ResultRow = {
            id: r.id,
            studentName: `${r.student.name} ${r.student.lastname}`,
            studentRut: r.student.rut,
            score: r.score,
            maxScore: r.maxScore,
            completedAt: r.completedAt.toISOString(),
            answers: r.answers as Record<string, string[] | string>,
        };
        byExamAndGroup.get(key)?.results.push(row);
    }

    const examGroups = Array.from(byExamAndGroup.values());

    return (
        <ResultsClient
            examGroups={examGroups}
            totalCount={results.length}
            slug={slug}
            institutionName={institutionName}
            examOptions={examOptions}
            groupOptions={groupOptions}
            selectedExamId={validExamId ?? null}
            selectedGroupId={validGroupId ?? null}
        />
    );
}
