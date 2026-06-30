import { seedGamificationBadges } from './gamification-badges';
import { createSeedClient } from '../lib/client';

const prisma = createSeedClient();

async function main(): Promise<void> {
    const upserted = await seedGamificationBadges(prisma);
    console.log(`Gamification: ${upserted} badges upserted.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
