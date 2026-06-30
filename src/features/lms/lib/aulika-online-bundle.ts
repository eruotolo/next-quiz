/**
 * Constantes compartidas de la oferta B2C "Aulika Online" (PAES 2026).
 *
 * El UUID del Pack Completo identifica el curso bundle cuyo webhook de pago
 * dispara la autoinscripción del alumno en los 7 cursos PAES individuales de
 * la misma institución. Se usa en el seeder (para sembrar el curso) y en el
 * webhook de MercadoPago (para detectar la compra del bundle).
 */

export const AULIKA_ONLINE_INSTITUTION_SLUG = 'aulika-online';

export const AULIKA_ONLINE_BUNDLE_COURSE_ID = '99a07384-b113-4ec2-a53b-c10bde486c90';

export const AULIKA_ONLINE_INDIVIDUAL_PRICE_CLP = 99_990;
export const AULIKA_ONLINE_BUNDLE_PRICE_CLP = 450_000;

export const AULIKA_ONLINE_INDIVIDUAL_COURSE_IDS = [
    'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Competencia Matemática M1
    'e6c7104f-9e4a-4e2e-8d8a-6b45a278fb6e', // Competencia Matemática M2
    'd3b07384-d113-4ec2-a53b-e10bde486c91', // Competencia Lectora
    'c2a07384-e113-4ec2-a53b-f10bde486c92', // Ciencias — Biología
    'b1a07384-f113-4ec2-a53b-a10bde486c93', // Ciencias — Química
    'a0a07384-a113-4ec2-a53b-b10bde486c94', // Ciencias — Física
    '99a07384-b113-4ec2-a53b-c10bde486c95', // Historia y Ciencias Sociales
] as const;
