export interface SafeBankOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface SafeBankQuestion {
    id: string;
    text: string;
    questionType: 'UNICA' | 'MULTIPLE';
    subject: string | null;
    unit: string | null;
    difficulty: 'FACIL' | 'MEDIA' | 'DIFICIL';
    tags: string[];
    feedback: string | null;
    options: SafeBankOption[];
    createdAt: Date;
    updatedAt: Date;
}

export interface BankQuestionFilters {
    subjects: string[];
    units: string[];
    tags: string[];
}
