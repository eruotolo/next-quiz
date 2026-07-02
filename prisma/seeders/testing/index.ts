/**
 * Testing seed runner.
 *
 * Modes (in order of increasing complexity / data volume):
 *
 *   local  → minimal data for day-to-day development
 *            2 institutions · 4 admins · 4 professors · 10 students
 *            Idempotent (upsert).
 *
 *   bulk   → large-scale data for load testing and performance demos
 *            3 institutions · 9 groups · 90 students · 9 active exams
 *            Idempotent (upsert).
 *
 *   e2e    → full dataset for CI / E2E test suite
 *            ⚠️  DESTRUCTIVE — clears all non-demo data first
 *            8 institutions · 32 groups · 96 students
 *            + completed exams with results + active exam (ULagos)
 *
 *   aula   → full LMS (Aula Virtual) dataset — Phases 1–5
 *            institution "lms-testing" · 2 courses · 5 students
 *            foros · gradebook · gamificación · certificado
 *            Idempotent: deletes + recreates LMS data on each run.
 *
 * Usage:
 *   pnpm db:seed:local   →  tsx .../testing/index.ts local
 *   pnpm db:seed:bulk    →  tsx .../testing/index.ts bulk
 *   pnpm db:seed:e2e     →  tsx .../testing/index.ts e2e
 *   pnpm db:seed:aula    →  tsx .../testing/index.ts aula
 */
import { createSeedClient } from '../../lib/client';
import { seedLocal } from './local-test';
import { seedBulk } from './bulk-demo';
import { seedE2E } from './e2e-full';
import { seedAula } from './testing-aula-seed';

const MODES = ['local', 'bulk', 'e2e', 'aula'] as const;
type Mode = (typeof MODES)[number];

const mode = (process.argv[2] ?? 'local') as Mode;

if (!MODES.includes(mode)) {
    console.error(`Unknown mode: "${mode}". Available: ${MODES.join(' | ')}`);
    process.exit(1);
}

const prisma = createSeedClient();

const runners: Record<Mode, (p: typeof prisma) => Promise<void>> = {
    local: seedLocal,
    bulk: seedBulk,
    e2e: seedE2E,
    aula: seedAula,
};

runners[mode](prisma)
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
