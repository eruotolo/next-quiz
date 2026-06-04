import { prisma } from '@/shared/lib/prisma';
import { DEMO_SLUG } from './demo';

/**
 * Borra los exámenes creados por una sesión demo concreta. Se invoca al cerrar
 * sesión (event `signOut` de NextAuth). El cascade del schema elimina preguntas,
 * opciones, intentos y resultados asociados.
 */
export async function deleteDemoSessionExams(demoSessionId: string): Promise<number> {
    if (!demoSessionId) return 0;
    const res = await prisma.exam.deleteMany({ where: { demoSessionId } });
    return res.count;
}

/**
 * Barrido total del sandbox demo: elimina TODOS los exámenes creados por
 * cualquier visitante en la institución demo. Red de seguridad para las sesiones
 * que no cerraron sesión (cerraron la pestaña). Lo ejecuta el cron diario.
 */
export async function resetDemoInstitution(): Promise<number> {
    const institution = await prisma.academicInstitution.findUnique({
        where: { slug: DEMO_SLUG },
        select: { id: true },
    });
    if (!institution) return 0;

    const res = await prisma.exam.deleteMany({
        where: { academicInstitutionId: institution.id },
    });
    return res.count;
}
