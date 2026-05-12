import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
    const rawPassword = process.env.ADMIN_PASSWORD;
    if (!rawPassword) throw new Error('ADMIN_PASSWORD env var is required for seed');

    const adminPassword = await bcrypt.hash(rawPassword, 10);

    await prisma.user.upsert({
        where: { rut: process.env.ADMIN_RUT ?? '270396356' },
        update: {
            name: process.env.ADMIN_NAME ?? 'Edgardo',
            lastname: process.env.ADMIN_LASTNAME ?? 'Ruotolo',
            email: process.env.ADMIN_EMAIL ?? 'edgardo.ruotolo@ulagos.cl',
            role: Role.ADMIN,
            password: adminPassword,
        },
        create: {
            name: process.env.ADMIN_NAME ?? 'Edgardo',
            lastname: process.env.ADMIN_LASTNAME ?? 'Ruotolo',
            email: process.env.ADMIN_EMAIL ?? 'edgardo.ruotolo@ulagos.cl',
            rut: process.env.ADMIN_RUT ?? '270396356',
            role: Role.ADMIN,
            password: adminPassword,
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
