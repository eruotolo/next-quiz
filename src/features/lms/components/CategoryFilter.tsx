'use client';

import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

interface CategoryOption {
    id: string;
    name: string;
    slug: string;
}

interface Props {
    slug: string;
    categories: CategoryOption[];
    activeSlug: string | null;
}

export function CategoryFilter({ slug, categories, activeSlug }: Props) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Link
                href={`/${slug}/cursos` as `/${string}`}
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
                    href={`/${slug}/cursos?category=${c.slug}` as `/${string}`}
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