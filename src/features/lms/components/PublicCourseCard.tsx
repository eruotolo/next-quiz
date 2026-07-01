import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface PublicCourseCardProps {
    /** URL del checkout (sin single detail page). */
    checkoutHref: string;
    title: string;
    description: string | null;
    coverImageUrl: string | null;
    modulesCount: number;
    priceClp: number | null;
    institutionName: string;
    /** Categorías asignadas (badges). */
    categoryNames?: string[];
}

function formatCLP(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
    }).format(amount);
}

export function PublicCourseCard({
    checkoutHref,
    title,
    description,
    coverImageUrl,
    modulesCount,
    priceClp,
    institutionName,
    categoryNames,
}: PublicCourseCardProps) {
    const isFree = priceClp === null || priceClp === 0;
    const ctaLabel = isFree ? 'Inscribirme gratis' : 'Comprar curso';

    return (
        <article className="border-border group flex h-full flex-col overflow-hidden rounded-[18px] border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="border-border relative aspect-[16/9] w-full overflow-hidden border-b bg-paper-warm">
                {coverImageUrl ? (
                    <Image
                        src={coverImageUrl}
                        alt={title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-lime/20">
                        <GraduationCap className="text-primary/40 size-12" strokeWidth={1.5} />
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <span
                        className={cn(
                            'rounded-full px-2.5 py-1 font-mono text-[10.5px] font-bold tracking-wide uppercase shadow-sm backdrop-blur-sm',
                            isFree ? 'bg-lime/90 text-ink' : 'bg-white/90 text-ink',
                        )}
                    >
                        {isFree ? 'Gratis' : formatCLP(priceClp ?? 0)}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                    <p className="text-mute mb-1 font-mono text-[10px] font-bold tracking-[0.1em] uppercase">
                        {institutionName}
                    </p>
                    <h3 className="text-ink font-display text-[17px] leading-tight font-bold tracking-tight">
                        {title}
                    </h3>
                </div>
                {description && (
                    <p className="text-ink-dim line-clamp-3 text-[13px] leading-relaxed">
                        {description}
                    </p>
                )}
                {categoryNames && categoryNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {categoryNames.map((name) => (
                            <span
                                key={name}
                                className="border-border text-mute rounded-full border bg-paper-warm px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide uppercase"
                            >
                                {name}Hola
                            </span>
                        ))}
                    </div>
                )}
                <div className="text-mute mt-auto flex items-center gap-3 pt-2 text-[11.5px]">
                    <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {modulesCount} {modulesCount === 1 ? 'módulo' : 'módulos'}
                    </span>
                </div>
            </div>

            <div className="border-border border-t p-5 pt-4">
                <Button
                    asChild
                    variant="primary"
                    size="lg"
                    className="w-full text-[14px] font-bold"
                >
                    <Link href={checkoutHref as `/${string}`}>
                        {ctaLabel}
                        {!isFree && <ArrowRight className="ml-2 size-4" />}
                    </Link>
                </Button>
            </div>
        </article>
    );
}
