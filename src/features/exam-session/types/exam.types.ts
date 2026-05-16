// Types exposed to the student client. Never includes `isCorrect`.

export interface SafeOption {
    id: string;
    text: string;
}

export interface SafeQuestion {
    id: string;
    text: string;
    points: number;
    order: number;
    questionType: 'UNICA' | 'MULTIPLE';
    options: SafeOption[];
}

export interface SafeExam {
    id: string;
    title: string;
    timeLimit: number;
    antiCheatEnabled: boolean;
    lockTabSwitch: boolean;
    questions: SafeQuestion[];
}
