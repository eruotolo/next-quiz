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
        <section className="border-border border-b bg-white py-16 md:py-24">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <div className="divide-border grid grid-cols-1 divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
                    {STATS.map((s, i) => (
                        <div
                            key={s.l}
                            className={cn(
                                'py-8 first:pt-0 first:pl-0 last:pr-0 last:pb-0 md:px-10 md:py-0',
                            )}
                        >
                            <p
                                className="font-display text-[72px] leading-[0.95] font-medium tracking-[-0.05em] [color:var(--stat-c)] lg:text-[88px]"
                                style={{ '--stat-c': s.color || 'var(--ink)' } as React.CSSProperties}
                            >
                                {s.n}
                            </p>
                            <p className="text-ink-dim mt-4 text-[14px] font-bold tracking-widest uppercase opacity-80">
                                {s.l}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
