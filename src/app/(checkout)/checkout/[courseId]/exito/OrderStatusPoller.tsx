'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { getLmsOrderStatus } from '@/features/lms/actions/b2c-orders';

interface OrderStatusPollerProps {
    orderId: string;
    studentEmail: string;
    courseTitle: string;
}

type ViewState =
    | { kind: 'pending' }
    | { kind: 'approved'; activationToken: string | null }
    | { kind: 'rejected' }
    | { kind: 'timeout' };

const MAX_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 3000;

export function OrderStatusPoller({
    orderId,
    studentEmail,
    courseTitle,
}: OrderStatusPollerProps) {
    const [attempts, setAttempts] = useState(0);
    const [state, setState] = useState<ViewState>({ kind: 'pending' });
    const isDone =
        state.kind === 'approved' || state.kind === 'rejected' || state.kind === 'timeout';

    useEffect(() => {
        if (isDone) return;
        if (attempts >= MAX_ATTEMPTS) {
            setState({ kind: 'timeout' });
            return;
        }

        const timer = setTimeout(async () => {
            const res = await getLmsOrderStatus(orderId);
            if (!res.data) {
                setAttempts((n) => n + 1);
                return;
            }
            if (res.data.status === 'APROBADO') {
                setState({
                    kind: 'approved',
                    activationToken: res.data.activationToken,
                });
                return;
            }
            if (res.data.status === 'RECHAZADO') {
                setState({ kind: 'rejected' });
                return;
            }
            setAttempts((n) => n + 1);
        }, POLL_INTERVAL_MS);

        return () => clearTimeout(timer);
    }, [attempts, isDone, orderId]);

    if (state.kind === 'approved') {
        const activateHref = state.activationToken
            ? (`/examen/activar?token=${state.activationToken}` as `/${string}`)
            : ('/examen/activar' as `/${string}`);
        return (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="bg-success/10 flex size-16 items-center justify-center rounded-full">
                    <CheckCircle2 className="text-success size-9" />
                </div>
                <h1 className="text-ink font-display text-[26px] font-semibold tracking-tight">
                    ¡Pago confirmado!
                </h1>
                <p className="text-ink-dim text-[14px] max-w-[420px]">
                    Tu compra de <strong>{courseTitle}</strong> fue aprobada. Te enviamos
                    un email a <strong>{studentEmail}</strong> con el enlace para
                    activar tu cuenta.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <Button asChild variant="primary" size="lg">
                        <Link href={activateHref}>Activar mi cuenta</Link>
                    </Button>
                    <Button asChild variant="ghost" size="lg">
                        <Link href="/examen/login">Ya tengo cuenta</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (state.kind === 'rejected') {
        return (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="bg-destructive/10 flex size-16 items-center justify-center rounded-full">
                    <XCircle className="text-destructive size-9" />
                </div>
                <h1 className="text-ink font-display text-[26px] font-semibold tracking-tight">
                    No pudimos confirmar el pago
                </h1>
                <p className="text-ink-dim text-[14px] max-w-[420px]">
                    El pago fue rechazado o cancelado. Si creés que es un error,
                    contactanos a soporte.
                </p>
                <Button asChild variant="primary" size="lg">
                    <Link href="/cursos">Volver al catálogo</Link>
                </Button>
            </div>
        );
    }

    if (state.kind === 'timeout') {
        return (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="bg-paper-warm flex size-16 items-center justify-center rounded-full">
                    <Mail className="text-ink-dim size-8" />
                </div>
                <h1 className="text-ink font-display text-[22px] font-semibold tracking-tight">
                    Estamos confirmando tu pago
                </h1>
                <p className="text-ink-dim text-[14px] max-w-[440px]">
                    Si ya pagaste en MercadoPago, te enviaremos un email a{' '}
                    <strong>{studentEmail}</strong> con el enlace de activación en los
                    próximos minutos.
                </p>
                <Button asChild variant="ghost" size="lg">
                    <Link href="/examen/activar">Ya recibí el email</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
                <Loader2 className="text-primary size-8 animate-spin" />
            </div>
            <h1 className="text-ink font-display text-[24px] font-semibold tracking-tight">
                Confirmando tu pago
            </h1>
            <p className="text-ink-dim text-[14px] max-w-[420px]">
                Estamos esperando la confirmación de MercadoPago para{' '}
                <strong>{courseTitle}</strong>. Esto puede tardar unos segundos.
            </p>
            <div className="mt-2 flex gap-1">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div
                        key={`dot-${i}`}
                        className={`h-1 w-3 rounded-full transition-colors ${
                            i < attempts ? 'bg-primary' : 'bg-border'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
