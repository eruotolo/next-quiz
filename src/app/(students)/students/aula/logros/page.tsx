import { getStudentAuthSession } from '@/features/exam-session/lib/session';
import { redirect } from 'next/navigation';
import { getMyAchievements } from '@/features/lms/actions/gamification';
import { LmsAchievementsClient } from '@/features/lms/components/LmsAchievementsClient';
import { Trophy } from 'lucide-react';

export const metadata = { title: 'Mis Logros — Aulika' };

export default async function LogrosPage() {
    const session = await getStudentAuthSession();
    if (!session) redirect('/students/examen/login');

    const result = await getMyAchievements();
    if (result.error || !result.data) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Trophy size={48} className="text-mute/30 mb-4" />
                <p className="text-ink font-medium">No se pudo cargar tus logros.</p>
                <p className="text-mute mt-1 text-sm">{result.error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-ink font-display text-2xl font-bold">Mis Logros</h1>
                <p className="text-mute mt-1 text-sm">
                    Tu racha, puntos e insignias ganadas en el Aula Virtual.
                </p>
            </div>
            <LmsAchievementsClient achievements={result.data} />
        </div>
    );
}
