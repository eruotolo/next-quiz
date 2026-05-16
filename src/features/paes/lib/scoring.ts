import type { PaesEjeResult, PaesExam, PaesQuestionResult, PaesResult } from '@/features/paes/types/paes.types';

// Approximation: 150 base + linear scale to ~850 max.
// Real PAES scale is percentile-based (confidential table).
// This is a referential estimate only — not official.
export function estimatePaesScore(correctCount: number, totalCount: number): number {
    if (totalCount === 0) return 150;
    const pct = correctCount / totalCount;
    return Math.round(150 + pct * 700);
}

export function computePaesResults(
    exam: PaesExam,
    answersMap: Map<string, string[]>,
): PaesResult {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const ejeMap = new Map<string, { correct: number; total: number }>();
    const perQuestion: PaesQuestionResult[] = [];

    for (const q of exam.questions) {
        const current = ejeMap.get(q.eje) ?? { correct: 0, total: 0 };
        current.total++;
        ejeMap.set(q.eje, current);

        const selected = answersMap.get(q.id) ?? [];

        if (selected.length === 0) {
            unanswered++;
            perQuestion.push({ questionId: q.id, isCorrect: false, selected, eje: q.eje });
            continue;
        }

        const correctIds = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
        const selectedIds = new Set(selected);
        const isCorrect =
            correctIds.size === selectedIds.size &&
            [...correctIds].every((id) => selectedIds.has(id));

        if (isCorrect) {
            correct++;
            current.correct++;
        } else {
            incorrect++;
        }

        perQuestion.push({ questionId: q.id, isCorrect, selected, eje: q.eje });
    }

    const total = exam.questions.length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const estimatedScore = estimatePaesScore(correct, total);

    const byEje: PaesEjeResult[] = Array.from(ejeMap.entries()).map(([eje, data]) => ({
        eje,
        correct: data.correct,
        total: data.total,
    }));

    return { correct, incorrect, unanswered, total, percent, estimatedScore, byEje, perQuestion };
}
