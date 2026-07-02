'use client';

import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

interface CategoryOption {
    id: string;
    name: string;
    slug: string;
}

interface Props {
    categories: CategoryOption[];
    activeSlug: string | null;
}

/**
 * Filtro de chips para `/cursos` (catálogo público plano). Mantiene la URL
 * `?category=slug` para mantener el filtro al recargar/compartir.
 */
export function CategoryFilter({ categories, activeSlug }: Props) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Link
                href="/cursos"
                className={cn(
                    'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                    activeSlug === null
                        ? 'bg-primary text-white'
                        : 'border-border text-ink-dim hover:bg-paper-warm border bg-white',
                )}
            >
                Todos
            </Link>
            {categories.map((c) => (
                <Link
                    key={c.id}
                    href={`/cursos?category=${c.slug}` as `/${string}`}
                    className={cn(
                        'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                        activeSlug === c.slug
                            ? 'bg-primary text-white'
                            : 'border-border text-ink-dim hover:bg-paper-warm border bg-white',
                    )}
                >
                    {c.name}
                </Link>
            ))}
        </div>
    );
}
