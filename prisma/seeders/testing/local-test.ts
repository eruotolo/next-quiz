/**
 * Testing seed — local development.
 *
 * Creates minimal data for day-to-day local development:
 *   - 2 institutions (Universidad de Los Lagos · IP Pacífico)
 *   - 4 admins + 4 professors (password: Admin2026!)
 *   - 1 group per institution
 *   - 1 program + 1 active period + 2 course sections per institution
 *   - 10 students (5 per institution, login by RUT)
 *
 * Idempotent: uses upsert / findOrCreate throughout.
 */
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';

const ADMIN_PASSWORD = 'Admin2026!';

const INSTITUTIONS = [
    {
        name: 'Universidad de Los Lagos',
        slug: 'universidad-de-los-lagos',
        phone: '+56 64 233 3000',
        address: 'Av. Fuchslocher 1305',
        city: 'Osorno',
        country: 'Chile',
        type: 'UNIVERSIDAD',
    },
    {
        name: 'Instituto Profesional Pacífico',
        slug: 'instituto-profesional-pacifico',
        phone: '+56 32 234 5678',
        address: 'Av. Argentina 2520',
        city: 'Valparaíso',
        country: 'Chile',
        type: 'INSTITUTO_PROFESIONAL',
    },
] as const;

const ACADEMIC = [
    {
        institution: 'universidad-de-los-lagos',
        programName: 'Ingeniería Civil Informática',
        programCode: 'ICI',
        periodName: '2026 - Primer Semestre',
        periodType: 'SEMESTRE',
        courses: ['Cálculo I', 'Programación I'],
    },
    {
        institution: 'instituto-profesional-pacifico',
        programName: 'Técnico en Administración',
        programCode: 'TADM',
        periodName: '2026 - Primer Semestre',
        periodType: 'SEMESTRE',
        courses: ['Contabilidad', 'Gestión de Empresas'],
    },
] as const;

const ADMINS = [
    {
        name: 'María',
        lastname: 'García',
        email: 'maria.garcia@ulagos.cl',
        rut: '111111111',
        institution: 'universidad-de-los-lagos',
    },
    {
        name: 'Carlos',
        lastname: 'López',
        email: 'carlos.lopez@ulagos.cl',
        rut: '222222222',
        institution: 'universidad-de-los-lagos',
    },
    {
        name: 'Ana',
        lastname: 'Martínez',
        email: 'ana.martinez@ippaci.cl',
        rut: '333333333',
        institution: 'instituto-profesional-pacifico',
    },
    {
        name: 'Pedro',
        lastname: 'Soto',
        email: 'pedro.soto@ippaci.cl',
        rut: '444444444',
        institution: 'instituto-profesional-pacifico',
    },
] as const;

const PROFESORES = [
    {
        name: 'Laura',
        lastname: 'Jiménez',
        email: 'laura.jimenez@ulagos.cl',
        rut: '189012349',
        institution: 'universidad-de-los-lagos',
    },
    {
        name: 'Roberto',
        lastname: 'Navarro',
        email: 'roberto.navarro@ulagos.cl',
        rut: '190123456',
        institution: 'universidad-de-los-lagos',
    },
    {
        name: 'Andrea',
        lastname: 'Castillo',
        email: 'andrea.castillo@ippaci.cl',
        rut: '201234565',
        institution: 'instituto-profesional-pacifico',
    },
    {
        name: 'Marcelo',
        lastname: 'Reyes',
        email: 'marcelo.reyes@ippaci.cl',
        rut: '212345679',
        institution: 'instituto-profesional-pacifico',
    },
] as const;

const STUDENTS = [
    {
        name: 'Juan',
        lastname: 'Pérez',
        email: 'juan.perez@test.cl',
        rut: '555555555',
        institution: 'universidad-de-los-lagos',
    },
    {
        name: 'Sofía',
        lastname: 'Herrera',
        email: 'sofia.herrera@test.cl',
        rut: '666666666',
        institution: 'universidad-de-los-lagos',
    },
    {
        name: 'Diego',
        lastname: 'Morales',
        email: 'diego.morales@test.cl',
        rut: '777777777',
        institution: 'universidad-de-los-lagos',
    },
    {
        name: 'Valentina',
        lastname: 'Cruz',
        email: 'valentina.cruz@test.cl',
        rut: '888888888',
        institution: 'universidad-de-los-lagos',
    },
    {
        name: 'Matías',
        lastname: 'Torres',
        email: 'matias.torres@test.cl',
        rut: '999999999',
        institution: 'universidad-de-los-lagos',
    },
    {
        name: 'Camila',
        lastname: 'Rojas',
        email: 'camila.rojas@test.cl',
        rut: '123456785',
        institution: 'instituto-profesional-pacifico',
    },
    {
        name: 'Sebastián',
        lastname: 'Flores',
        email: 'sebastian.flores@test.cl',
        rut: '987654325',
        institution: 'instituto-profesional-pacifico',
    },
    {
        name: 'Isidora',
        lastname: 'Muñoz',
        email: 'isidora.munoz@test.cl',
        rut: '112345671',
        institution: 'instituto-profesional-pacifico',
    },
    {
        name: 'Felipe',
        lastname: 'Vargas',
        email: 'felipe.vargas@test.cl',
        rut: '156789011',
        institution: 'instituto-profesional-pacifico',
    },
    {
        name: 'Catalina',
        lastname: 'Silva',
        email: 'catalina.silva@test.cl',
        rut: '167890121',
        institution: 'instituto-profesional-pacifico',
    },
] as const;

async function getOrCreate<T extends { id: string }>(
    find: () => Promise<T | null>,
    create: () => Promise<T>,
): Promise<T> {
    return (await find()) ?? (await create());
}

export async function seedLocal(prisma: PrismaClient): Promise<void> {
    console.log('Seeding local test data...');

    const adminRole = await prisma.userRole.findUnique({ where: { name: 'Administrador' } });
    const profesorRole = await prisma.userRole.findUnique({ where: { name: 'Profesor' } });
    const studentRole = await prisma.userRole.findUnique({ where: { name: 'Estudiante' } });

    if (!adminRole || !profesorRole || !studentRole) {
        throw new Error('Roles not found. Run `pnpm db:seed` first to create the base roles.');
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const institutionMap = new Map<string, string>();
    for (const inst of INSTITUTIONS) {
        const record = await prisma.academicInstitution.upsert({
            where: { slug: inst.slug },
            update: { type: inst.type },
            create: inst,
        });
        institutionMap.set(inst.slug, record.id);
    }

    const groupMap = new Map<string, string>();
    for (const inst of INSTITUTIONS) {
        const groupName = `Grupo A — ${inst.name}`;
        const institutionId = institutionMap.get(inst.slug)!;
        const group = await getOrCreate(
            () => prisma.group.findFirst({ where: { name: groupName } }),
            () => prisma.group.create({ data: { name: groupName, academicInstitutionId: institutionId } }),
        );
        groupMap.set(inst.slug, group.id);
        console.log(`  Group: ${groupName}`);
    }

    for (const admin of ADMINS) {
        const institutionId = institutionMap.get(admin.institution)!;
        await prisma.user.upsert({
            where: { email: admin.email },
            update: {},
            create: {
                name: admin.name,
                lastname: admin.lastname,
                email: admin.email,
                rut: admin.rut,
                password: hashedPassword,
                userRoleId: adminRole.id,
                academicInstitutionId: institutionId,
            },
        });
        console.log(`  Admin: ${admin.name} ${admin.lastname} → ${admin.institution}`);
    }

    const firstProfessorByInstitution = new Map<string, string>();
    for (const prof of PROFESORES) {
        const institutionId = institutionMap.get(prof.institution)!;
        const user = await prisma.user.upsert({
            where: { email: prof.email },
            update: {},
            create: {
                name: prof.name,
                lastname: prof.lastname,
                email: prof.email,
                rut: prof.rut,
                password: hashedPassword,
                userRoleId: profesorRole.id,
                academicInstitutionId: institutionId,
            },
        });
        if (!firstProfessorByInstitution.has(prof.institution)) {
            firstProfessorByInstitution.set(prof.institution, user.id);
        }
        console.log(`  Profesor: ${prof.name} ${prof.lastname} → ${prof.institution}`);
    }

    for (const academic of ACADEMIC) {
        const institutionId = institutionMap.get(academic.institution)!;
        const groupId = groupMap.get(academic.institution)!;
        const professorId = firstProfessorByInstitution.get(academic.institution)!;

        const program = await getOrCreate(
            () => prisma.program.findFirst({ where: { academicInstitutionId: institutionId, name: academic.programName } }),
            () => prisma.program.create({ data: { name: academic.programName, code: academic.programCode, academicInstitutionId: institutionId } }),
        );

        const period = await getOrCreate(
            () => prisma.academicPeriod.findFirst({ where: { academicInstitutionId: institutionId, name: academic.periodName } }),
            () => prisma.academicPeriod.create({
                data: { name: academic.periodName, year: 2026, type: academic.periodType, isActive: true, academicInstitutionId: institutionId },
            }),
        );

        await prisma.group.update({ where: { id: groupId }, data: { programId: program.id } });

        for (const courseName of academic.courses) {
            const existing = await prisma.courseSection.findFirst({ where: { periodId: period.id, name: courseName, groupId } });
            if (!existing) {
                await prisma.courseSection.create({
                    data: { name: courseName, programId: program.id, periodId: period.id, groupId, professors: { connect: { id: professorId } } },
                });
            }
        }
        console.log(`  Académico: ${academic.programName} · ${academic.courses.length} materias → ${academic.institution}`);
    }

    for (const student of STUDENTS) {
        const institutionId = institutionMap.get(student.institution)!;
        const groupId = groupMap.get(student.institution)!;
        await prisma.user.upsert({
            where: { email: student.email },
            update: {},
            create: {
                name: student.name,
                lastname: student.lastname,
                email: student.email,
                rut: student.rut,
                userRoleId: studentRole.id,
                academicInstitutionId: institutionId,
                groupId,
            },
        });
        console.log(`  Student: ${student.name} ${student.lastname} (RUT: ${student.rut})`);
    }

    console.log('\nLocal test seed completed:');
    console.log('  2 institutions · 2 groups · 4 admins · 4 professors · 10 students');
    console.log('  2 programs · 2 active periods · 4 course sections');
    console.log('  Credentials: Admin2026! / login by RUT for students');
}
