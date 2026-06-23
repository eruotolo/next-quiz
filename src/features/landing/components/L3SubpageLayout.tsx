import { Tag } from '@/shared/components/ui/badge';

interface L3SubpageLayoutProps {
    tag: string;
    title: string;
    description: string;
    children: React.ReactNode;
}

export function L3SubpageLayout({
    tag,
    title,
    description,
    children,
}: L3SubpageLayoutProps): React.JSX.Element {
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
                        {title.split(' ').map((word, i) =>
                            i === title.split(' ').length - 1 ? (
                                <span key={`word-${i}`}>
                                    <em className="text-primary italic not-italic">{word}</em>
                                </span>
                            ) : (
                                `${word} `
                            ),
                        )}
                    </h1>
                    <p className="text-ink-dim max-w-[720px] text-[20px] leading-relaxed md:text-[22px]">
                        {description}
                    </p>
                </header>

                <div className="space-y-16">{children}</div>
            </div>
        </article>
    );
}
