import { Tag } from '@/shared/components/ui/badge';

interface L3SubpageLayoutProps {
    tag: string;
    title: string;
    description: string;
    children: React.ReactNode;
}

export function L3SubpageLayout({ tag, title, description, children }: L3SubpageLayoutProps): React.JSX.Element {
    return (
        <article className="bg-paper-warm min-h-screen pt-32 pb-24 relative overflow-hidden">
            {/* Background Pattern */}
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(circle, var(--ink) 1.5px, transparent 1.5px)",
                    backgroundSize: '32px 32px',
                }}
            />
            
            <div className="mx-auto max-w-[900px] px-6 relative z-10">
                <header className="mb-20">
                    <Tag tone="primary" size="sm" className="font-bold mb-8 border-none shadow-sm">{tag}</Tag>
                    <h1 className="font-display text-[56px] md:text-[72px] font-medium tracking-[-0.03em] leading-[1] text-ink mb-10">
                        {title.split(' ').map((word, i) => (
                            i === title.split(' ').length - 1 ? (
                                <span key={i}><em className="text-primary not-italic italic">{word}</em></span>
                            ) : `${word} `
                        ))}
                    </h1>
                    <p className="text-[20px] md:text-[22px] leading-relaxed text-ink-dim max-w-[720px]">
                        {description}
                    </p>
                </header>
                
                <div className="space-y-16">
                    {children}
                </div>
            </div>
        </article>
    );
}
