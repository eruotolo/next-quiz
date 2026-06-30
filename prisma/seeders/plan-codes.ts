// Seeder de los packs de plan por producto (Exámenes / Aula Virtual) y backfill
// de los flags de habilitación en `AcademicInstitution`.
//
// Idempotente: usa upsert por `@@unique([plan, planCode])` y updateMany por
// `plan` para las instituciones. Corre en cada deploy (build script) para que
// los nuevos PlanLimits existan y las instituciones heredadas queden con los
// flags coherentes a su plan comercial.
//
// Convención de planCode:
//   exams_free / exams_docente / exams_colegio  → producto Exámenes (Aulika)
//   lms_free / lms_colegio                      → producto Aula Virtual (LMS)
//   pack_completo                               → ambos productos (INSTITUCIONAL)
import { type Plan, type PrismaClient } from '@prisma/client';

interface PlanCodeSeed {
    plan: Plan;
    planCode: string;
    maxGroups: number | null;
    maxAdmins: number | null;
    maxProfessors: number | null;
    maxStudents: number | null;
    maxExamsPerYear: number | null;
    maxPrograms: number | null;
    maxCourses: number | null;
    description: string;
}

// Catálogo de packs por producto. Los valores numéricos se alinean con los
// límites del plan comercial equivalente.
export const PLAN_CODES_SEED: PlanCodeSeed[] = [
    // Exámenes (producto Aulika)
    {
        plan: 'FREE',
        planCode: 'exams_free',
        maxGroups: 1,
        maxAdmins: 1,
        maxProfessors: 1,
        maxStudents: 50,
        maxExamsPerYear: 5,
        maxPrograms: 1,
        maxCourses: 3,
        description: 'Exámenes — Plan gratuito',
    },
    {
        plan: 'DOCENTE',
        planCode: 'exams_docente',
        maxGroups: 5,
        maxAdmins: 1,
        maxProfessors: 5,
        maxStudents: 150,
        maxExamsPerYear: null,
        maxPrograms: 3,
        maxCourses: 15,
        description: 'Exámenes — Plan Docente',
    },
    {
        plan: 'COLEGIO',
        planCode: 'exams_colegio',
        maxGroups: 30,
        maxAdmins: 5,
        maxProfessors: null,
        maxStudents: 300,
        maxExamsPerYear: null,
        maxPrograms: 15,
        maxCourses: null,
        description: 'Exámenes — Plan Colegio',
    },
    // Aula Virtual (LMS)
    {
        plan: 'FREE',
        planCode: 'lms_free',
        maxGroups: 1,
        maxAdmins: 1,
        maxProfessors: 1,
        maxStudents: 10,
        maxExamsPerYear: null,
        maxPrograms: 1,
        maxCourses: 1,
        description: 'Aula Virtual — Plan gratuito (piloto B2C)',
    },
    {
        plan: 'COLEGIO',
        planCode: 'lms_colegio',
        maxGroups: 30,
        maxAdmins: 5,
        maxProfessors: null,
        maxStudents: 300,
        maxExamsPerYear: null,
        maxPrograms: 15,
        maxCourses: null,
        description: 'Aula Virtual — Plan Colegio',
    },
    // Pack completo (ambos productos)
    {
        plan: 'INSTITUCIONAL',
        planCode: 'pack_completo',
        maxGroups: null,
        maxAdmins: null,
        maxProfessors: null,
        maxStudents: null,
        maxExamsPerYear: null,
        maxPrograms: null,
        maxCourses: null,
        description: 'Pack completo — Exámenes + Aula Virtual (ilimitado)',
    },
];

// Mapeo plan → flags de producto para el backfill de instituciones heredadas.
// Las instituciones COLEGIO e INSTITUCIONAL activan LMS; FREE y DOCENTE quedan
// con LMS deshabilitado (defaults del schema). Los `*PlanCode` referencian los
// packs de PLAN_CODES_SEED.
const INSTITUTION_BACKFILL: {
    plan: Plan;
    examsPlanCode: string;
    lmsEnabled: boolean;
    lmsPlanCode: string;
}[] = [
    { plan: 'FREE', examsPlanCode: 'exams_free', lmsEnabled: false, lmsPlanCode: 'lms_free' },
    { plan: 'DOCENTE', examsPlanCode: 'exams_docente', lmsEnabled: false, lmsPlanCode: 'lms_free' },
    {
        plan: 'COLEGIO',
        examsPlanCode: 'exams_colegio',
        lmsEnabled: true,
        lmsPlanCode: 'lms_colegio',
    },
    {
        plan: 'INSTITUCIONAL',
        examsPlanCode: 'pack_completo',
        lmsEnabled: true,
        lmsPlanCode: 'pack_completo',
    },
];

export async function seedPlanCodes(prisma: PrismaClient): Promise<{
    upserted: number;
    backfilled: number;
}> {
    let upserted = 0;
    for (const seed of PLAN_CODES_SEED) {
        await prisma.planLimits.upsert({
            where: { plan_planCode: { plan: seed.plan, planCode: seed.planCode } },
            create: seed,
            update: {
                maxGroups: seed.maxGroups,
                maxAdmins: seed.maxAdmins,
                maxProfessors: seed.maxProfessors,
                maxStudents: seed.maxStudents,
                maxExamsPerYear: seed.maxExamsPerYear,
                maxPrograms: seed.maxPrograms,
                maxCourses: seed.maxCourses,
                description: seed.description,
            },
        });
        upserted += 1;
    }

    let backfilled = 0;
    for (const rule of INSTITUTION_BACKFILL) {
        const result = await prisma.academicInstitution.updateMany({
            where: { plan: rule.plan },
            data: {
                examsPlanCode: rule.examsPlanCode,
                lmsEnabled: rule.lmsEnabled,
                lmsPlanCode: rule.lmsPlanCode,
            },
        });
        backfilled += result.count;
    }

    return { upserted, backfilled };
}
