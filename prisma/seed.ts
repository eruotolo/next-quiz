import { type Plan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createSeedClient } from './lib/client';
import { seedGamificationBadges } from './seeders/gamification-badges';

const prisma = createSeedClient();

const USER_ROLES = ['SuperAdministrador', 'Administrador', 'Profesor', 'Estudiante'] as const;

interface PlanLimitsSeed {
    plan: Plan;
    maxGroups: number | null;
    maxAdmins: number | null;
    maxProfessors: number | null;
    maxStudents: number | null;
    maxExamsPerYear: number | null;
    maxPrograms: number | null;
    maxCourses: number | null;
    description: string;
}

const PLAN_LIMITS: PlanLimitsSeed[] = [
    {
        plan: 'FREE',
        maxGroups: 1,
        maxAdmins: 1,
        maxProfessors: 1,
        maxStudents: 50,
        maxExamsPerYear: 5,
        maxPrograms: 1,
        maxCourses: 3,
        description: 'Plan gratuito para docentes que recién comienzan',
    },
    {
        plan: 'DOCENTE',
        maxGroups: 5,
        maxAdmins: 1,
        maxProfessors: 5,
        maxStudents: 150,
        maxExamsPerYear: null,
        maxPrograms: 3,
        maxCourses: 15,
        description: 'Plan individual para docentes con grupos pequeños',
    },
    {
        plan: 'COLEGIO',
        maxGroups: 30,
        maxAdmins: 5,
        maxProfessors: null,
        maxStudents: 300,
        maxExamsPerYear: null,
        maxPrograms: 15,
        maxCourses: null,
        description: 'Plan para establecimientos de educación básica y media',
    },
    {
        plan: 'INSTITUCIONAL',
        maxGroups: null,
        maxAdmins: null,
        maxProfessors: null,
        maxStudents: null,
        maxExamsPerYear: null,
        maxPrograms: null,
        maxCourses: null,
        description: 'Plan institucional con recursos ilimitados',
    },
];

async function main(): Promise<void> {
    const rawPassword = process.env.ADMIN_PASSWORD;
    if (!rawPassword) throw new Error('ADMIN_PASSWORD env var is required for seed');

    for (const roleName of USER_ROLES) {
        await prisma.userRole.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }

    const superAdminRole = await prisma.userRole.findUniqueOrThrow({
        where: { name: 'SuperAdministrador' },
    });

    const adminPassword = await bcrypt.hash(rawPassword, 10);

    await prisma.user.upsert({
        where: { rut: process.env.ADMIN_RUT ?? '270396356' },
        update: {
            name: process.env.ADMIN_NAME ?? 'Edgardo',
            lastname: process.env.ADMIN_LASTNAME ?? 'Ruotolo',
            email: process.env.ADMIN_EMAIL ?? 'edgardoruotolo@gmail.cl',
            password: adminPassword,
            userRoleId: superAdminRole.id,
        },
        create: {
            name: process.env.ADMIN_NAME ?? 'Edgardo',
            lastname: process.env.ADMIN_LASTNAME ?? 'Ruotolo',
            email: process.env.ADMIN_EMAIL ?? 'edgardoruotolo@gmail.cl',
            rut: process.env.ADMIN_RUT ?? '270396356',
            password: adminPassword,
            userRoleId: superAdminRole.id,
        },
    });

    for (const limits of PLAN_LIMITS) {
        await prisma.planLimits.upsert({
            where: { plan: limits.plan },
            update: {
                maxGroups: limits.maxGroups,
                maxAdmins: limits.maxAdmins,
                maxProfessors: limits.maxProfessors,
                maxStudents: limits.maxStudents,
                maxExamsPerYear: limits.maxExamsPerYear,
                maxPrograms: limits.maxPrograms,
                maxCourses: limits.maxCourses,
                description: limits.description,
            },
            create: limits,
        });
    }

    const upserted = await seedGamificationBadges(prisma);
    console.log(`Gamification: ${upserted} badges upserted.`);

    console.log('Seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
