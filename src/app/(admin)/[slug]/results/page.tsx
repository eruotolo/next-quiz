import { prisma } from '@/shared/lib/prisma';
import {
    ResultsClient,
    type ExamGroup,
    type ResultRow,
} from '@/features/results/components/ResultsClient';

export default async function ResultsPage(): Promise<React.JSX.Element> {
    const results = await prisma.result.findMany({
        include: {
            student: { select: { name: true, lastname: true, rut: true } },
            exam: {
                select: {
                    id: true,
                    title: true,
                    maxGrade: true,
                    passingGrade: true,
                    passingPercentage: true,
                    groups: { select: { name: true } },
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

    const byExam = new Map<string, ExamGroup>();

    for (const r of results) {
        const key = r.examId;
        if (!byExam.has(key)) {
            byExam.set(key, {
                examId: key,
                title: r.exam.title,
                groupNames: r.exam.groups.map((g) => g.name).join(', '),
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
            answers: r.answers as Record<string, string>,
        };
        byExam.get(key)?.results.push(row);
    }

    const examGroups = Array.from(byExam.values());

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-foreground text-2xl font-bold">Resultados</h1>
                <p className="text-muted-foreground text-sm">{results.length} entregas en total</p>
            </div>
            <ResultsClient examGroups={examGroups} totalCount={results.length} />
        </div>
    );
}
