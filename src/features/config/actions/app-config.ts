'use server';

import { auth } from '@/features/auth/auth';
import { logAudit } from '@/shared/lib/audit';
import { prisma } from '@/shared/lib/prisma';
import { USER_ROLE } from '@/shared/lib/roles';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';
import { APP_CONFIG_KEY, type AppConfigKey } from '@/features/config/lib/app-config-keys';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type AppConfigMap = Record<AppConfigKey, string>;

async function requireSuperAdmin(): Promise<{ id: string; email: string; userRoleName: string }> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');
    return {
        id: session.user.id,
        email: session.user.email ?? '',
        userRoleName: session.user.userRoleName,
    };
}

export async function getAppConfig(): Promise<AppConfigMap> {
    const session = await auth();
    if (session?.user.userRoleName !== USER_ROLE.SUPER_ADMIN) throw new Error('Unauthorized');

    const configs = await prisma.appConfig.findMany({ select: { key: true, value: true } });
    const defaults: AppConfigMap = {
        [APP_CONFIG_KEY.BREVO_API_KEY]: '',
        [APP_CONFIG_KEY.BREVO_SENDER_EMAIL]: '',
        [APP_CONFIG_KEY.BREVO_SENDER_NAME]: '',
        [APP_CONFIG_KEY.SEO_GLOBAL_TITLE]: '',
        [APP_CONFIG_KEY.SEO_GLOBAL_DESCRIPTION]: '',
        [APP_CONFIG_KEY.SEO_GLOBAL_KEYWORDS]: '',
        [APP_CONFIG_KEY.SEO_GLOBAL_OG_IMAGE]: '',
    };
    for (const c of configs) {
        if (c.key in defaults) {
            defaults[c.key as AppConfigKey] = c.value;
        }
    }
    return defaults;
}

const saveSchema = z.object({
    key: z.enum([
        APP_CONFIG_KEY.BREVO_API_KEY,
        APP_CONFIG_KEY.BREVO_SENDER_EMAIL,
        APP_CONFIG_KEY.BREVO_SENDER_NAME,
        APP_CONFIG_KEY.SEO_GLOBAL_TITLE,
        APP_CONFIG_KEY.SEO_GLOBAL_DESCRIPTION,
        APP_CONFIG_KEY.SEO_GLOBAL_KEYWORDS,
        APP_CONFIG_KEY.SEO_GLOBAL_OG_IMAGE,
    ]),
    value: z.string().max(2000, 'El valor no puede superar los 2000 caracteres'),
});

export async function saveAppConfig(
    key: AppConfigKey,
    value: string,
): Promise<{ data: null; error: string | null }> {
    const actor = await requireSuperAdmin().catch(() => null);
    if (!actor) return { data: null, error: 'No autorizado' };

    const parsed = saveSchema.safeParse({ key, value });
    if (!parsed.success)
        return { data: null, error: parsed.error.errors[0]?.message ?? 'Error de validación' };

    try {
        await prisma.appConfig.upsert({
            where: { key },
            create: { key, value },
            update: { value },
        });
        await logAudit({
            action: AUDIT_ACTION.APP_CONFIG_SAVE,
            actorId: actor.id,
            actorEmail: actor.email,
            actorRole: actor.userRoleName,
            metadata: { key },
        });
        revalidatePath('/config/settings');
        return { data: null, error: null };
    } catch {
        return { data: null, error: 'Error al guardar la configuración.' };
    }
}
