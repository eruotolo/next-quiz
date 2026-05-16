export interface DemoOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface DemoQuestion {
    id: string;
    text: string;
    points: number;
    order: number;
    questionType: 'UNICA' | 'MULTIPLE';
    options: DemoOption[];
}

export interface DemoExam {
    id: string;
    title: string;
    timeLimit: number;
    antiCheatEnabled: boolean;
    questions: DemoQuestion[];
}

export interface QuestionResult {
    question: DemoQuestion;
    isCorrect: boolean;
    selected: string[];
}

export interface DemoResults {
    score: number;
    maxScore: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    perQuestion: QuestionResult[];
}
