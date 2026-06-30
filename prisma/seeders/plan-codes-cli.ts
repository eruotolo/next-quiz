import { seedPlanCodes } from './plan-codes';
import { createSeedClient } from '../lib/client';

const prisma = createSeedClient();

async function main(): Promise<void> {
    const { upserted, backfilled } = await seedPlanCodes(prisma);
    console.log(`PlanCodes: ${upserted} packs upserted, ${backfilled} institutions backfilled.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
