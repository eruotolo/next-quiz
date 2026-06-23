// Chilean grading scale: 1–maxGrade, passing at passingGrade = passingPercentage% correct.
export function calcGrade(
    score: number,
    maxScore: number,
    maxGrade: number,
    passingGrade: number,
    passingPercentage: number,
): number {
    if (maxScore === 0) return 1;
    const pct = score / maxScore;
    const threshold = passingPercentage / 100;
    let grade: number;
    if (pct >= threshold) {
        grade = passingGrade + ((pct - threshold) / (1 - threshold)) * (maxGrade - passingGrade);
    } else {
        grade = 1 + (pct / threshold) * (passingGrade - 1);
    }
    return Math.min(maxGrade, Math.max(1, Math.round(grade * 10) / 10));
}
