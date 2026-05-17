'use client';

import type * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getSubscriptionStatus } from '@/features/subscriptions/actions/signup';

interface Props {
    subscriptionId: string;
    planName: string;
}

export function PendingPaymentPoller({ subscriptionId, planName }: Props): React.JSX.Element {
    const router = useRouter();
    const [attempts, setAttempts] = useState(0);
    const [failed, setFailed] = useState(false);
    const MAX_ATTEMPTS = 15;

    useEffect(() => {
        if (attempts >= MAX_ATTEMPTS) {
            setFailed(true);
            return;
        }

        const timer = setTimeout(async () => {
            const result = await getSubscriptionStatus(subscriptionId);
            if (result.data?.status === 'authorized') {
                router.refresh();
                return;
            }
            if (result.data?.status === 'failed') {
                setFailed(true);
                return;
            }
            setAttempts((n) => n + 1);
        }, 2000);

        return () => clearTimeout(timer);
    }, [attempts, subscriptionId, router]);

    if (failed) {
        return (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
                <XCircle className="size-12 text-destructive" />
                <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">
                    No se pudo confirmar el pago
                </h2>
                <p className="text-[14px] text-ink-dim">
                    El pago no fue autorizado o tomó demasiado tiempo. Si realizaste el pago, esperá unos minutos y revisá tu email para continuar con el registro.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">
                Confirmando tu pago
            </h2>
            <p className="text-[14px] text-ink-dim">
                Estamos esperando la confirmación de MercadoPago para el plan <strong>{planName}</strong>. Esto puede tardar unos segundos.
            </p>
            <div className="flex gap-1">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 w-4 rounded-full transition-colors ${i < attempts ? 'bg-primary' : 'bg-border'}`}
                    />
                ))}
            </div>
        </div>
    );
}
