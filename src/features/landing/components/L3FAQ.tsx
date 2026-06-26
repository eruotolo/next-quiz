'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { FAQS } from '@/features/landing/lib/faq-data';
import type { FaqItem } from '@/features/landing/lib/faq-data';

export type { FaqItem };

export function L3FAQ({ faqs = FAQS }: { faqs?: FaqItem[] }) {
    const [open, setOpen] = useState<string | null>(null);

    return (
        <section className="bg-white py-24" id="faq">
            <div className="mx-auto max-w-[760px] px-6">
                <div className="mb-12 text-center">
                    <p className="text-mute mb-3 font-mono text-[11px] tracking-[0.12em] uppercase">
                        Preguntas frecuentes
                    </p>
                    <h2 className="font-display text-ink text-[48px] font-semibold tracking-[-0.03em]">
                        Dudas comunes
                    </h2>
                </div>

                <div className="divide-border divide-y">
                    {faqs.map((faq) => (
                        <div key={faq.q} className="py-1">
                            <button
                                type="button"
                                onClick={() => setOpen(open === faq.q ? null : faq.q)}
                                className="flex w-full items-center justify-between gap-4 py-5 text-left"
                            >
                                <span className="text-ink text-[16px] font-medium">{faq.q}</span>
                                <Plus
                                    className={cn(
                                        'text-mute size-5 shrink-0 transition-transform duration-200',
                                        open === faq.q && 'text-primary rotate-45',
                                    )}
                                />
                            </button>
                            <div
                                className={cn(
                                    'overflow-hidden transition-all duration-200',
                                    open === faq.q
                                        ? 'max-h-64 pb-5 opacity-100'
                                        : 'max-h-0 opacity-0',
                                )}
                            >
                                <p className="text-ink-dim text-[15px] leading-relaxed">{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
