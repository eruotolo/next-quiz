/*
  Migración N:M entre CourseSection y Group (RECOVERY — versión corregida).
  ===========================================================================

  Contexto: el primer intento de migración dropeó la columna CourseSection.groupId
  exitosamente, pero falló al crear el nuevo unique `@@unique([programId, periodId, name])`
  por duplicados. Como las migraciones Prisma no son transaccionales con DDL en
  este motor, el estado quedó parcial: groupId ya no existe, pero CourseSectionGroup
  tampoco se creó, y los duplicados siguen ahí.

  Lo que hace este script (en orden, mismo archivo, segunda corrida):
    A. Consolidar duplicados de (programId, periodId, name) preservando FKs:
       - Reasignar Exam.courseSectionId y LmsCourse.courseSectionId del loser al winner.
       - Reasignar _CourseSectionTeachers preservando co-docencia.
       - Borrar las filas perdedoras de CourseSection (CASCADE limpia las uniones).
    B. Crear la tabla CourseSectionGroup VACÍA (los 67 relaciones históricas
       NO se pueden recuperar — el campo groupId original se dropeó en el primer
       intento). Reasignación posterior desde la UI de Grupos.
    C. Crear los índices, unique y FKs finales.

  IMPORTANTE: las 67 relaciones materia↔grupo previas se perdieron. Restaurar
  manualmente desde la UI en `/[slug]/groups` una vez deployada esta migración.
  Backup completo en /tmp/quiz_db_full_backup.sql.
*/

-- ===== A. Consolidar duplicados =====

-- A.1. Definir winners y mapping loser → winner.
WITH winners AS (
    SELECT DISTINCT ON ("programId", "periodId", name)
           id AS winner_id, "programId", "periodId", name
    FROM "CourseSection"
    WHERE "programId" IS NOT NULL
    ORDER BY "programId", "periodId", name, "createdAt" ASC
),
mapping AS (
    SELECT cs.id AS loser_id, w.winner_id
    FROM "CourseSection" cs
    JOIN winners w
      ON w."programId" = cs."programId"
     AND w."periodId"  = cs."periodId"
     AND w.name        = cs.name
    WHERE cs.id != w.winner_id
)
-- A.2. Reasignar Exam.courseSectionId (los losers de CourseSection son winners
--      semánticamente — la materia es la misma; los Exams son evaluaciones distintas
--      que apuntaban al "mismo" CourseSection desde la óptica 1:N).
UPDATE "Exam"
SET "courseSectionId" = m.winner_id
FROM mapping m
WHERE "Exam"."courseSectionId" = m.loser_id;

-- A.3. Reasignar LmsCourse.courseSectionId (similar razonamiento).
UPDATE "LmsCourse"
SET "courseSectionId" = m.winner_id
FROM (
    WITH winners AS (
        SELECT DISTINCT ON ("programId", "periodId", name)
               id AS winner_id, "programId", "periodId", name
        FROM "CourseSection"
        WHERE "programId" IS NOT NULL
        ORDER BY "programId", "periodId", name, "createdAt" ASC
    )
    SELECT cs.id AS loser_id, w.winner_id
    FROM "CourseSection" cs
    JOIN winners w
      ON w."programId" = cs."programId"
     AND w."periodId"  = cs."periodId"
     AND w.name        = cs.name
    WHERE cs.id != w.winner_id
) m
WHERE "LmsCourse"."courseSectionId" = m.loser_id;

-- A.4. Preservar co-docencia: copiar las filas _CourseSectionTeachers del loser
--      al winner, evitando duplicar profesor si ya estaba asignado al winner.
INSERT INTO "_CourseSectionTeachers" ("A", "B")
SELECT m.winner_id, t."B"
FROM (
    WITH winners AS (
        SELECT DISTINCT ON ("programId", "periodId", name)
               id AS winner_id, "programId", "periodId", name
        FROM "CourseSection"
        WHERE "programId" IS NOT NULL
        ORDER BY "programId", "periodId", name, "createdAt" ASC
    )
    SELECT cs.id AS loser_id, w.winner_id
    FROM "CourseSection" cs
    JOIN winners w
      ON w."programId" = cs."programId"
     AND w."periodId"  = cs."periodId"
     AND w.name        = cs.name
    WHERE cs.id != w.winner_id
) m
JOIN "_CourseSectionTeachers" t ON t."A" = m.loser_id
ON CONFLICT ("A", "B") DO NOTHING;

-- A.5. Borrar las filas perdedoras.
DELETE FROM "CourseSection"
WHERE id IN (
    SELECT loser_id FROM (
        WITH winners AS (
            SELECT DISTINCT ON ("programId", "periodId", name)
                   id AS winner_id, "programId", "periodId", name
            FROM "CourseSection"
            WHERE "programId" IS NOT NULL
            ORDER BY "programId", "periodId", name, "createdAt" ASC
        )
        SELECT cs.id AS loser_id
        FROM "CourseSection" cs
        JOIN winners w
          ON w."programId" = cs."programId"
         AND w."periodId"  = cs."periodId"
         AND w.name        = cs.name
        WHERE cs.id != w.winner_id
    ) l
);

-- ===== B. Crear tabla CourseSectionGroup (idempotente) =====
CREATE TABLE IF NOT EXISTS "CourseSectionGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "courseSectionId" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseSectionGroup_pkey" PRIMARY KEY ("id")
);

-- ===== C. Índices, únicos y FKs finales (idempotentes) =====
CREATE INDEX IF NOT EXISTS "CourseSectionGroup_courseSectionId_idx" ON "CourseSectionGroup"("courseSectionId");
CREATE INDEX IF NOT EXISTS "CourseSectionGroup_groupId_idx" ON "CourseSectionGroup"("groupId");
CREATE UNIQUE INDEX IF NOT EXISTS "CourseSectionGroup_courseSectionId_groupId_key" ON "CourseSectionGroup"("courseSectionId", "groupId");
CREATE UNIQUE INDEX IF NOT EXISTS "CourseSection_programId_periodId_name_key" ON "CourseSection"("programId", "periodId", "name");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CourseSectionGroup_courseSectionId_fkey'
    ) THEN
        ALTER TABLE "CourseSectionGroup" ADD CONSTRAINT "CourseSectionGroup_courseSectionId_fkey" FOREIGN KEY ("courseSectionId") REFERENCES "CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CourseSectionGroup_groupId_fkey'
    ) THEN
        ALTER TABLE "CourseSectionGroup" ADD CONSTRAINT "CourseSectionGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
