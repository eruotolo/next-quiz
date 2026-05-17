'use client';

import type * as React from 'react';
import { useState } from 'react';
import { AlertTriangle, X, Zap } from 'lucide-react';
import Link from 'next/link';
import type { QuotaUsage } from '@/features/subscriptions/lib/quota';

const RESOURCE_LABELS: Record<string, string> = {
    group: 'Aulas',
    student: 'Estudiantes',
    exam: 'Exámenes/año',
};

interface Props {
    usage: QuotaUsage[];
}

export function PlanUsageBanner({ usage }: Props): React.JSX.Element | null {
    const [dismissed, setDismissed] = useState(false);

    const criticalItems = usage.filter(
        (q) => q.max !== null && q.max > 0 && q.used / q.max >= 0.8,
    );

    if (dismissed || criticalItems.length === 0) return null;

    const hasExhausted = criticalItems.some((q) => q.max !== null && q.used >= q.max);

    return (
        <div
            className={`flex items-start gap-3 border-b px-6 py-3 text-[13px] ${
                hasExhausted
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
        >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />

            <div className="flex-1 min-w-0">
                <span className="font-semibold">
                    {hasExhausted ? 'Límite alcanzado · ' : 'Casi en el límite · '}
                </span>
                {criticalItems.map((q, i) => (
                    <span key={q.resource}>
                        {i > 0 && ' · '}
                        {RESOURCE_LABELS[q.resource] ?? q.resource}{' '}
                        <strong>
                            {q.used}/{q.max}
                        </strong>
                    </span>
                ))}
                <span className="ml-3">
                    <Link
                        href="/#pricing"
                        className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:no-underline"
                    >
                        <Zap size={12} />
                        Mejorar plan
                    </Link>
                </span>
            </div>

            <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() => setDismissed(true)}
                className="shrink-0 rounded p-0.5 hover:bg-black/10 transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
}
