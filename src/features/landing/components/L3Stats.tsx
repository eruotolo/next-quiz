'use client';

import type React from 'react';
import { cn } from '@/shared/lib/utils';

const STATS = [
    { n: '+38.500', l: 'pruebas rendidas', color: 'var(--primary)' },
    { n: '142', l: 'instituciones' },
    { n: '11', l: 'regiones de Chile' },
    { n: '<2s', l: 'carga por pregunta' },
];

export function L3Stats(): React.JSX.Element {
    return (
        <section className="bg-white py-16 md:py-24 border-b border-border">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
                    {STATS.map((s, i) => (
                        <div key={s.l} className={cn(
                            "py-8 md:py-0 md:px-10 first:pt-0 last:pb-0 first:pl-0 last:pr-0",
                        )}>
                            <p 
                                className="font-display text-[72px] lg:text-[88px] font-medium leading-[0.95] tracking-[-0.05em]"
                                style={{ color: s.color || 'var(--ink)' }}
                            >
                                {s.n}
                            </p>
                            <p className="mt-4 text-[14px] font-bold text-ink-dim uppercase tracking-widest opacity-80">
                                {s.l}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
