/**
 * Constantes compartidas de la oferta B2C "Aulika Online" (PAES 2026).
 *
 * Solo la institución `aulika-online` puede vender cursos (catalogo B2C). El
 * resto de las instituciones usan el LMS como herramienta académica interna
 * pero no publican cursos. La regla se enforce en server-side con
 * `assertCanSellCourses` y en UI ocultando los controles B2C para cualquier
 * slug distinto de `AULIKA_ONLINE_INSTITUTION_SLUG`.
 */

export const AULIKA_ONLINE_INSTITUTION_SLUG = 'aulika-online';

export const AULIKA_ONLINE_BUNDLE_COURSE_ID = '99a07384-b113-4ec2-a53b-c10bde486c90';

export const AULIKA_ONLINE_INDIVIDUAL_PRICE_CLP = 99_990;
export const AULIKA_ONLINE_BUNDLE_PRICE_CLP = 450_000;

// PlanCode del pack completo. Apunta a la fila `pack_completo` sembrada por
// `prisma/seeders/plan-codes.ts` bajo plan INSTITUCIONAL (límites ilimitados).
export const AULIKA_ONLINE_PLAN_CODE = 'pack_completo';

/**
 * ID de la categoría "PAES". Se usa como categoría-pack: cualquier compra
 * del pack `aulika-online` se vende contra esta categoría (la autoinscripción
 * en el webhook mira `LmsCourseCategory` para resolver los cursos).
 */
export const AULIKA_ONLINE_PAES_CATEGORY_ID = '8b1b1f8e-4f3d-4d2e-9f8a-7c6b5a4d3e2f';
export const AULIKA_ONLINE_PAES_CATEGORY_SLUG = 'paes';

export const AULIKA_ONLINE_INDIVIDUAL_COURSE_IDS = [
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Competencia Matemática M1
    'e6c7104f-9e4a-4e2e-8d8a-6b45a278fb6e', // Competencia Matemática M2
    'd3b07384-d113-4ec2-a53b-e10bde486c91', // Competencia Lectora
    'c2a07384-e113-4ec2-a53b-f10bde486c92', // Ciencias — Biología
    'b1a07384-f113-4ec2-a53b-a10bde486c93', // Ciencias — Química
    'a0a07384-a113-4ec2-a53b-b10bde486c94', // Ciencias — Física
    '99a07384-b113-4ec2-a53b-c10bde486c95', // Historia y Ciencias Sociales
] as const;

/**
 * Gating B2C: solo `aulika-online` puede vender cursos (toggle `isPublic`,
 * asignar precio). El SuperAdmin pasa siempre (llave maestra). Cualquier otra
 * institución debe usar el LMS como herramienta académica interna sin venta.
 */
export function canSellCourses(institutionSlug: string, isSuperAdmin: boolean): boolean {
    return isSuperAdmin || institutionSlug === AULIKA_ONLINE_INSTITUTION_SLUG;
}

/**
 * Variante para usar dentro de try/catch de server actions: devuelve un
 * mensaje listo para `fail()` cuando la institución no tiene permiso de venta.
 */
export function assertCanSellCourses(
    institutionSlug: string,
    isSuperAdmin: boolean,
): { ok: true } | { ok: false; message: string } {
    if (canSellCourses(institutionSlug, isSuperAdmin)) return { ok: true };
    return {
        ok: false,
        message:
            'La venta de cursos B2C solo está disponible para la tienda oficial de Aulika.',
    };
}