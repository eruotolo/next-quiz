import { prisma } from '@/shared/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

/**
 * Elimina suscripciones en estado `pending` abandonadas: las que nunca quedaron
 * vinculadas a una institución (checkout iniciado pero pago nunca confirmado) y
 * superan la antigüedad indicada. Evita la acumulación de basura en la tabla.
 *
 * Solo borra registros sin institución asociada, de modo que nunca afecta a
 * suscripciones que sí llegaron a crear una cuenta. Devuelve la cantidad
 * eliminada.
 */
export async function cleanupPendingSubscriptions(olderThanDays = 7): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const res = await prisma.subscription.deleteMany({
        where: {
            status: SubscriptionStatus.pending,
            academicInstitutionId: null,
            createdAt: { lt: cutoff },
        },
    });
    return res.count;
}
