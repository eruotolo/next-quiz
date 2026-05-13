import { ExamCarousel } from '@/components/exam/ExamCarousel';
import type { SafeExam } from '@/types/exam';

const mockExam: SafeExam = {
    id: 'demo-exam',
    title: 'Examen demo — Cultura general',
    timeLimit: 1,
    antiCheatEnabled: false,
    questions: [
        {
            id: '11111111-1111-1111-1111-111111111111',
            order: 1,
            points: 1,
            text: '¿Cuál es la capital de Chile?',
            options: [
                { id: '11111111-1111-1111-1111-1111111111a1', text: 'Buenos Aires' },
                { id: '11111111-1111-1111-1111-1111111111a2', text: 'Santiago' },
                { id: '11111111-1111-1111-1111-1111111111a3', text: 'Lima' },
                { id: '11111111-1111-1111-1111-1111111111a4', text: 'Bogotá' },
            ],
        },
        {
            id: '22222222-2222-2222-2222-222222222222',
            order: 2,
            points: 1,
            text: '¿Cuánto es 7 × 8?',
            options: [
                { id: '22222222-2222-2222-2222-2222222222b1', text: '54' },
                { id: '22222222-2222-2222-2222-2222222222b2', text: '56' },
                { id: '22222222-2222-2222-2222-2222222222b3', text: '64' },
                { id: '22222222-2222-2222-2222-2222222222b4', text: '48' },
            ],
        },
        {
            id: '33333333-3333-3333-3333-333333333333',
            order: 3,
            points: 1,
            text: '¿En qué año llegó el hombre a la Luna?',
            options: [
                { id: '33333333-3333-3333-3333-3333333333c1', text: '1959' },
                { id: '33333333-3333-3333-3333-3333333333c2', text: '1969' },
                { id: '33333333-3333-3333-3333-3333333333c3', text: '1979' },
                { id: '33333333-3333-3333-3333-3333333333c4', text: '1989' },
            ],
        },
    ],
};

export default function DemoExamPage() {
    const initialSeconds = mockExam.timeLimit * 60;

    return (
        <main className="bg-default-50 min-h-screen py-8">
            <ExamCarousel exam={mockExam} initialSeconds={initialSeconds} />
        </main>
    );
}
