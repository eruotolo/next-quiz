import type { Prisma } from '@prisma/client';

/**
 * Modo demo público de Aulika.
 *
 * Una única institución sandbox compartida y de solo lectura (institución +
 * administrador + grupo + 10 alumnos). Lo que cada visitante crea (exámenes) se
 * aísla por `demoSessionId` (un id por login, generado en el JWT), de modo que
 * nadie ve ni pisa lo de otro. La limpieza ocurre al cerrar sesión y por un
 * cron diario de respaldo.
 *
 * El slug NO puede empezar con un prefijo público del proxy (`/demo`, etc.),
 * por eso es `aulika-demo`: así el panel `/aulika-demo/*` queda protegido.
 */
export const DEMO_SLUG = 'aulika-demo' as const;
export const DEMO_INSTITUTION_NAME = 'Institución Demo Aulika' as const;
export const DEMO_EMAIL = 'demo@aulika.cl' as const;
export const DEMO_PASSWORD = 'demo_aulika' as const;

/**
 * Filtro de alcance de exámenes para el modo demo: limita las lecturas a los
 * exámenes de la sesión del visitante. Para usuarios reales devuelve `{}` (sin
 * efecto), de modo que es seguro hacer spread en cualquier `where` de Exam.
 */
export function demoExamFilter(user: {
    isDemo?: boolean;
    demoSessionId?: string | null;
}): Prisma.ExamWhereInput {
    return user?.isDemo && user.demoSessionId ? { demoSessionId: user.demoSessionId } : {};
}
