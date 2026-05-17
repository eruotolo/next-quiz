/**
 * Creates MercadoPago subscription plans (preapproval_plan) for all paid tiers
 * and appends the returned IDs to .env.local.
 *
 * Run with: pnpm db:seed:mp
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
    console.error('MP_ACCESS_TOKEN is not set');
    process.exit(1);
}

interface MPPlan {
    reason: string;
    auto_recurring: {
        frequency: number;
        frequency_type: 'months';
        transaction_amount: number;
        currency_id: 'CLP';
    };
    back_url: string;
}

interface MPPlanResponse {
    id: string;
    reason: string;
    status: string;
}

const BASE_URL = 'https://www.aulika.cl';

const PLANS: { envKey: string; plan: MPPlan }[] = [
    {
        envKey: 'MP_PLAN_DOCENTE_MONTHLY',
        plan: {
            reason: 'Aulika · Plan Docente (mensual)',
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: 9990,
                currency_id: 'CLP',
            },
            back_url: `${BASE_URL}/registro/docente/exito`,
        },
    },
    {
        envKey: 'MP_PLAN_DOCENTE_ANNUAL',
        plan: {
            reason: 'Aulika · Plan Docente (anual)',
            auto_recurring: {
                frequency: 12,
                frequency_type: 'months',
                transaction_amount: 95880,
                currency_id: 'CLP',
            },
            back_url: `${BASE_URL}/registro/docente/exito`,
        },
    },
    {
        envKey: 'MP_PLAN_COLEGIO_MONTHLY',
        plan: {
            reason: 'Aulika · Plan Colegio (mensual)',
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: 29990,
                currency_id: 'CLP',
            },
            back_url: `${BASE_URL}/registro/colegio/exito`,
        },
    },
    {
        envKey: 'MP_PLAN_COLEGIO_ANNUAL',
        plan: {
            reason: 'Aulika · Plan Colegio (anual)',
            auto_recurring: {
                frequency: 12,
                frequency_type: 'months',
                transaction_amount: 299880,
                currency_id: 'CLP',
            },
            back_url: `${BASE_URL}/registro/colegio/exito`,
        },
    },
];

async function createPlan(envKey: string, plan: MPPlan): Promise<string> {
    const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to create plan ${envKey}: ${response.status} ${body}`);
    }

    const data = (await response.json()) as MPPlanResponse;
    console.log(`✓ ${envKey} = ${data.id}  (${data.reason} · ${data.status})`);
    return data.id;
}

function appendToEnvLocal(entries: Record<string, string>): void {
    const envPath = path.resolve(process.cwd(), '.env.local');
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    for (const [key, value] of Object.entries(entries)) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(content)) {
            content = content.replace(regex, `${key}=${value}`);
        } else {
            content += `\n${key}=${value}`;
        }
    }

    fs.writeFileSync(envPath, content.trimEnd() + '\n', 'utf-8');
}

async function main(): Promise<void> {
    console.log('Creating MercadoPago subscription plans...\n');

    const results: Record<string, string> = {};

    for (const { envKey, plan } of PLANS) {
        results[envKey] = await createPlan(envKey, plan);
    }

    appendToEnvLocal(results);

    console.log('\n✓ Plan IDs saved to .env.local');
    console.log('  Restart the dev server to pick up the new env vars.\n');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
