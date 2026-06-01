-- Aulika · Inserción de límites de planes (PlanLimits)
-- Idempotente: si el plan ya existe, actualiza sus límites.
-- Ejecutar una sola vez contra la base de datos de producción.

INSERT INTO "PlanLimits" (
    "id", "plan", "maxGroups", "maxAdmins", "maxProfessors",
    "maxStudents", "maxExamsPerYear", "description", "createdAt", "updatedAt"
) VALUES
    (gen_random_uuid(), 'FREE'::"Plan",          1,    1,    1,    50,   5,    'Plan gratuito para docentes que recién comienzan',          NOW(), NOW()),
    (gen_random_uuid(), 'DOCENTE'::"Plan",       5,    1,    5,    150,  NULL, 'Plan individual para docentes con grupos pequeños',         NOW(), NOW()),
    (gen_random_uuid(), 'COLEGIO'::"Plan",       30,   5,    NULL, 300,  NULL, 'Plan para establecimientos de educación básica y media',    NOW(), NOW()),
    (gen_random_uuid(), 'INSTITUCIONAL'::"Plan", NULL, NULL, NULL, NULL, NULL, 'Plan institucional con recursos ilimitados',                NOW(), NOW())
ON CONFLICT ("plan") DO UPDATE SET
    "maxGroups"       = EXCLUDED."maxGroups",
    "maxAdmins"       = EXCLUDED."maxAdmins",
    "maxProfessors"   = EXCLUDED."maxProfessors",
    "maxStudents"     = EXCLUDED."maxStudents",
    "maxExamsPerYear" = EXCLUDED."maxExamsPerYear",
    "description"     = EXCLUDED."description",
    "updatedAt"       = NOW();

-- Verificación
SELECT "plan", "maxGroups", "maxAdmins", "maxProfessors", "maxStudents", "maxExamsPerYear"
FROM "PlanLimits" ORDER BY "plan";
