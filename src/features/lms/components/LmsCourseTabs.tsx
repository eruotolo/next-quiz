'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { BookOpen, ClipboardList, BarChart2, MessageSquare, Trophy } from 'lucide-react';

interface Props {
    slug: string;
    courseId: string;
}

export function LmsCourseTabs({ slug, courseId }: Props) {
    const pathname = usePathname();

    const base = `/${slug}/aula/${courseId}`;
    const tabs = [
        { href: base, label: 'Contenido', icon: BookOpen },
        { href: `${base}/tareas`, label: 'Tareas', icon: ClipboardList },
        { href: `${base}/calificaciones`, label: 'Calificaciones', icon: BarChart2 },
        { href: `${base}/foro`, label: 'Foro', icon: MessageSquare },
        { href: `${base}/ranking`, label: 'Ranking', icon: Trophy },
    ];

    return (
        <div className="border-border bg-paper border-b px-8">
            <nav className="-mb-px flex gap-1">
                {tabs.map(({ href, label, icon: Icon }) => {
                    const isActive = href === base ? pathname === base : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                                isActive
                                    ? 'border-primary text-primary'
                                    : 'text-mute hover:text-ink border-transparent',
                            )}
                        >
                            <Icon size={14} />
                            {label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
