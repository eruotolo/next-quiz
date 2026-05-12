import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
    const adminPassword = await bcrypt.hash('Guns026772', 10);

    await prisma.user.upsert({
        where: { rut: '270396356' },
        update: {
            name: 'Edgardo',
            lastname: 'Ruotolo',
            email: 'edgardo.ruotolo@ulagos.cl',
            role: Role.ADMIN,
            password: adminPassword,
        },
        create: {
            name: 'Edgardo',
            lastname: 'Ruotolo',
            email: 'edgardo.ruotolo@ulagos.cl',
            rut: '270396356',
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
