import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USER_ROLES = ['SuperAdministrador', 'Administrador', 'Profesor', 'Estudiante'] as const;

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
