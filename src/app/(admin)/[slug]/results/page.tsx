import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { requireInstitutionPageAccess } from '@/features/auth/lib/auth-guard';
import {
    ResultsClient,
    type ExamGroup,
    type ExamOption,
    type GroupOption,
    type ResultRow,
} from '@/features/results/components/ResultsClient';
import { prisma } from '@/shared/lib/prisma';
import type { Prisma } from '@prisma/client';

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ examId?: string; groupId?: string }>;
}

// Include reutilizado tanto por la query como por el tipo del helper de
// agrupación: garantiza que ambos estén siempre sincronizados.
const RESULT_INCLUDE = {
    student: { select: { name: true, lastname: true, rut: true, groupId: true } },
    exam: {
        select: {
            id: true,
            title: true,
            maxGrade: true,
            passingGrade: true,
            passingPercentage: true,
            groups: { select: { id: true, name: true } },
            courseSection: {
                select: { id: true, name: true, program: { select: { id: true, name: true } } },
            },
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
} satisfies Prisma.ResultFindManyArgs['include'];

type ResultWithRelations = Prisma.ResultGetPayload<{ include: typeof RESULT_INCLUDE }>;

/**
 * Agrupa resultados por combinación examen + grupo: cada par es una sección
 * independiente en la vista. Pure function (testeable sin DB).
 */
function buildExamGroups(results: ResultWithRelations[]): ExamGroup[] {
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
                courseSection: r.exam.courseSection
                    ? { id: r.exam.courseSection.id, name: r.exam.courseSection.name }
                    : null,
                program: r.exam.courseSection?.program
                    ? {
                          id: r.exam.courseSection.program.id,
                          name: r.exam.courseSection.program.name,
                      }
                    : null,
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

    return Array.from(byExamAndGroup.values());
}

export default async function ResultsPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const { examId: paramExamId, groupId: paramGroupId } = await searchParams;
    const { institutionId, institutionName, isProfesor, userId, coordinatedProgramIds } =
        await requireInstitutionPageAccess(slug);

    // Filtro de alcance: profesor (vía grupos o CourseSections) O coordinador.
    const scopeFilter: Prisma.ExamWhereInput = isProfesor
        ? {
              OR: [
                  { groups: { some: { professors: { some: { id: userId } } } } },
                  { courseSection: { professors: { some: { id: userId } } } },
                  ...(coordinatedProgramIds.length > 0
                      ? [{ courseSection: { programId: { in: coordinatedProgramIds } } }]
                      : []),
              ],
          }
        : {};

    const examOptionsRaw = await prisma.exam.findMany({
        where: {
            academicInstitutionId: institutionId,
            results: { some: {} },
            ...(isProfesor && scopeFilter),
        },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
    });

    const examOptions: ExamOption[] = examOptionsRaw;
    const validExamId = examOptionsRaw.some((e) => e.id === paramExamId)
        ? paramExamId
        : undefined;

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
                ...(isProfesor && scopeFilter),
                ...(validExamId && { id: validExamId }),
            },
            ...(validGroupId && { student: { groupId: validGroupId } }),
        },
        include: RESULT_INCLUDE,
        orderBy: { completedAt: 'desc' },
    });

    return (
        <>
            <AdminTopBar
                title="Historial de Resultados"
                breadcrumb={[institutionName, 'Resultados']}
                subtitle={`${results.length} evaluaciones completadas y procesadas`}
            />
            <ResultsClient
                examGroups={buildExamGroups(results)}
                totalCount={results.length}
                slug={slug}
                institutionName={institutionName}
                examOptions={examOptions}
                groupOptions={groupOptions}
                selectedExamId={validExamId ?? null}
                selectedGroupId={validGroupId ?? null}
            />
        </>
    );
}
