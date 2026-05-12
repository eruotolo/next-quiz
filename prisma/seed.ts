import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
    const adminPassword = await bcrypt.hash('admin123', 10);

    const group = await prisma.group.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: '4to Año B',
        },
    });

    await prisma.user.upsert({
        where: { email: 'admin@edunext.local' },
        update: {},
        create: {
            name: 'Admin',
            lastname: 'EduNext',
            email: 'admin@edunext.local',
            rut: '111111111',
            password: adminPassword,
            role: Role.ADMIN,
        },
    });

    await prisma.user.upsert({
        where: { rut: '270396356' },
        update: {
            name: 'Edgardo',
            lastname: 'Ruotolo',
            email: 'edgardo.ruotolo@ulagos.cl',
            role: Role.ADMIN,
            password: adminPassword,
            groupId: group.id,
        },
        create: {
            name: 'Edgardo',
            lastname: 'Ruotolo',
            email: 'edgardo.ruotolo@ulagos.cl',
            rut: '270396356',
            role: Role.ADMIN,
            password: adminPassword,
            groupId: group.id,
        },
    });

    await prisma.user.upsert({
        where: { rut: '123456785' },
        update: {},
        create: {
            name: 'Ana',
            lastname: 'García',
            email: 'ana@example.com',
            rut: '123456785',
            role: Role.STUDENT,
            groupId: group.id,
        },
    });

    const examId = '00000000-0000-0000-0000-0000000000aa';
    await prisma.exam.upsert({
        where: { id: examId },
        update: {},
        create: {
            id: examId,
            title: 'Examen demo — Conocimientos generales',
            timeLimit: 5,
            active: true,
            groupId: group.id,
            questions: {
                create: [
                    {
                        order: 1,
                        text: '¿Cuál es la capital de Chile?',
                        points: 1,
                        options: {
                            create: [
                                { text: 'Buenos Aires', isCorrect: false },
                                { text: 'Santiago', isCorrect: true },
                                { text: 'Lima', isCorrect: false },
                                { text: 'Bogotá', isCorrect: false },
                            ],
                        },
                    },
                    {
                        order: 2,
                        text: '¿Cuánto es 7 × 8?',
                        points: 1,
                        options: {
                            create: [
                                { text: '54', isCorrect: false },
                                { text: '56', isCorrect: true },
                                { text: '64', isCorrect: false },
                                { text: '48', isCorrect: false },
                            ],
                        },
                    },
                    {
                        order: 3,
                        text: '¿En qué año llegó el hombre a la Luna?',
                        points: 1,
                        options: {
                            create: [
                                { text: '1959', isCorrect: false },
                                { text: '1969', isCorrect: true },
                                { text: '1979', isCorrect: false },
                                { text: '1989', isCorrect: false },
                            ],
                        },
                    },
                ],
            },
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
