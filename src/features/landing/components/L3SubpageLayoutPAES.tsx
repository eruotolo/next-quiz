import { Tag } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface L3SubpageLayoutPAESProps {
    tag: string;
    title: string;
    description: string;
    children: React.ReactNode;
}

export function L3SubpageLayoutPAES({
    tag,
    title,
    description,
    children,
}: L3SubpageLayoutPAESProps) {
    const titleWords = title.split(' ');

    return (
        <article className="bg-paper-warm relative min-h-screen overflow-hidden pt-32 pb-24">
            {/* Background Pattern */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--ink)_1.5px,transparent_1.5px)] bg-[length:32px_32px] opacity-[0.03]" />

            <div className="relative z-10 mx-auto max-w-[900px] px-6">
                <header className="mb-20">
                    <Tag tone="primary" size="sm" className="mb-8 border-none font-bold shadow-sm">
                        {tag}
                    </Tag>
                    <h1 className="font-display text-ink mb-10 text-[56px] leading-[1] font-medium tracking-[-0.03em] md:text-[72px]">
                        {titleWords.map((word, i) =>
                            i === titleWords.length - 1 ? (
                                <span key={`word-${i}`}>
                                    <em className="text-primary italic not-italic">{word}</em>
                                </span>
                            ) : (
                                `${word} `
                            ),
                        )}
                    </h1>

                    <div className="border-border/50 flex flex-col justify-between gap-8 rounded-[32px] border bg-white/50 p-8 backdrop-blur-sm md:flex-row md:items-center">
                        <p className="text-ink-dim max-w-[500px] text-[18px] leading-relaxed md:text-[20px]">
                            {description}
                        </p>
                        <Button
                            asChild
                            size="lg"
                            variant="primary"
                            className="shadow-primary/10 h-14 shrink-0 rounded-full px-8 font-bold shadow-xl"
                        >
                            <Link href="/paes">
                                Probar Demo PAES
                                <ArrowRight className="ml-2 size-5" />
                            </Link>
                        </Button>
                    </div>
                </header>

                <div className="space-y-16">{children}</div>
            </div>
        </article>
    );
}
