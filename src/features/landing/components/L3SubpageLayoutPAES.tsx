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

export function L3SubpageLayoutPAES({ tag, title, description, children }: L3SubpageLayoutPAESProps): React.JSX.Element {
    const titleWords = title.split(' ');
    
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
                        {titleWords.map((word, i) => (
                            i === titleWords.length - 1 ? (
                                <span key={i}><em className="text-primary not-italic italic">{word}</em></span>
                            ) : `${word} `
                        ))}
                    </h1>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/50 p-8 rounded-[32px] border border-border/50 backdrop-blur-sm">
                        <p className="text-[18px] md:text-[20px] leading-relaxed text-ink-dim max-w-[500px]">
                            {description}
                        </p>
                        <Button asChild size="lg" variant="primary" className="h-14 px-8 rounded-full font-bold shadow-xl shadow-primary/10 shrink-0">
                            <Link href="/paes">
                                Probar Demo PAES
                                <ArrowRight className="ml-2 size-5" />
                            </Link>
                        </Button>
                    </div>
                </header>
                
                <div className="space-y-16">
                    {children}
                </div>
            </div>
        </article>
    );
}
