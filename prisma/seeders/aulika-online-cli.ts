import { seedAulikaOnline } from './aulika-online';
import { createSeedClient } from '../lib/client';

const prisma = createSeedClient();

async function main(): Promise<void> {
    const result = await seedAulikaOnline(prisma);
    console.log(`AulikaOnline: institution upserted, ${result.courses} courses (1 bundle + 7 PAES).`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
