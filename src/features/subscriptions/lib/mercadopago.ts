import { createHmac } from 'node:crypto';

export type PaidPlan = 'DOCENTE' | 'COLEGIO';
export type Billing = 'monthly' | 'annual';

interface AutoRecurring {
    frequency: number;
    frequency_type: 'months';
    transaction_amount: number;
    currency_id: 'CLP';
}

const PLAN_PRICES: Record<PaidPlan, { monthly: number; annual: number }> = {
    DOCENTE: { monthly: 9990, annual: 7990 },
    COLEGIO: { monthly: 29990, annual: 24990 },
};

export function getAutoRecurring(plan: PaidPlan, billing: Billing): AutoRecurring {
    const price = PLAN_PRICES[plan];
    return {
        frequency: billing === 'monthly' ? 1 : 12,
        frequency_type: 'months',
        transaction_amount: billing === 'monthly' ? price.monthly : price.annual * 12,
        currency_id: 'CLP',
    };
}

interface CreatePreapprovalParams {
    reason: string;
    autoRecurring: AutoRecurring;
    payerEmail: string;
    externalReference: string;
    backUrl: string;
}

interface PreapprovalResponse {
    id?: string;
    init_point?: string;
    status?: string;
    message?: string;
    error?: string;
}

export interface CreatePreapprovalResult {
    initPoint: string | null;
    mpSubscriptionId: string;
    mpStatus: string;
}

export async function createPreapproval(
    params: CreatePreapprovalParams,
): Promise<CreatePreapprovalResult> {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN is not set');

    const response = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reason: params.reason,
            auto_recurring: params.autoRecurring,
            payer_email: params.payerEmail,
            external_reference: params.externalReference,
            back_url: params.backUrl,
        }),
    });

    const data = (await response.json()) as PreapprovalResponse;

    if (!response.ok) {
        throw new Error(data.message ?? data.error ?? `MP error ${response.status}`);
    }

    const mpSubscriptionId = data.id;
    if (!mpSubscriptionId) throw new Error('MercadoPago did not return subscription id');
    return {
        initPoint: data.init_point ?? null,
        mpSubscriptionId,
        mpStatus: data.status ?? 'pending',
    };
}

export function verifyWebhookSignature(
    _rawBody: string,
    xSignature: string,
    xRequestId: string,
    dataId: string,
): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) return false;

    const parts = xSignature.split(',').reduce<Record<string, string>>((acc, part) => {
        const [k, v] = part.trim().split('=');
        if (k && v) acc[k] = v;
        return acc;
    }, {});

    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = createHmac('sha256', secret).update(manifest).digest('hex');
    return hmac === v1;
}

// ─── Checkout Pro (pago único B2C) ───────────────────────────────────────────
// Crea una preferencia de pago único para la compra de un curso público por un
// estudiante externo. A diferencia del preapproval (suscripción recurrente),
// esto genera un cobro único vía Checkout Pro. El webhook
// `/api/webhooks/mercadopago-b2c` procesa la notificación `payment` resultante.

interface PreferenceItem {
    title: string;
    unitPrice: number;
    quantity?: number;
}

interface CreatePreferenceParams {
    item: PreferenceItem;
    payerEmail: string;
    payerName?: string;
    payerSurname?: string;
    externalReference: string;
    backUrls: { success: string; pending: string; failure: string };
    notificationUrl?: string;
}

interface PreferenceResponse {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    message?: string;
    error?: string;
}

export interface CreatePreferenceResult {
    preferenceId: string;
    initPoint: string | null;
}

export async function createPreference(
    params: CreatePreferenceParams,
): Promise<CreatePreferenceResult> {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN is not set');

    const quantity = params.item.quantity ?? 1;
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items: [
                {
                    title: params.item.title,
                    quantity,
                    unit_price: params.item.unitPrice,
                    currency_id: 'CLP',
                },
            ],
            payer: {
                email: params.payerEmail,
                ...(params.payerName ? { name: params.payerName } : {}),
                ...(params.payerSurname ? { surname: params.payerSurname } : {}),
            },
            external_reference: params.externalReference,
            back_urls: params.backUrls,
            auto_return: 'approved',
            ...(params.notificationUrl ? { notification_url: params.notificationUrl } : {}),
        }),
    });

    const data = (await response.json()) as PreferenceResponse;

    if (!response.ok) {
        throw new Error(data.message ?? data.error ?? `MP error ${response.status}`);
    }

    const preferenceId = data.id;
    if (!preferenceId) throw new Error('MercadoPago did not return preference id');
    return {
        preferenceId,
        initPoint: data.init_point ?? data.sandbox_init_point ?? null,
    };
}

// ─── Pago único (B2C) ───────────────────────────────────────────────────────

/**
 * Crea una preferencia de pago único en MercadoPago (Checkout Pro B2C). La
 * definición detallada del item, payer, backUrls y notificationUrl vive en
 * `createPreference` arriba (sección "Checkout Pro (pago único B2C)"). Esta
 * función de arriba es la canónica y este bloque queda vacío para evitar la
 * redeclaración que se produciría al duplicar el símbolo.
 */
