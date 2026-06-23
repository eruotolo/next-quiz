import { DemoExamCarousel } from '@/features/demo/components/DemoExamCarousel';
import { demoExam } from '@/features/demo/data/demo-exam';

export default function DemoExamPage() {
    const initialSeconds = demoExam.timeLimit * 60;

    return (
        <main className="min-h-screen">
            <DemoExamCarousel exam={demoExam} initialSeconds={initialSeconds} />
        </main>
    );
}
