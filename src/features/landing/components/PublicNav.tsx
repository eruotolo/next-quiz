'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoLockup } from '@/shared/components/branding/logo';
import { Button } from '@/shared/components/ui/button';

export function PublicNav() {
    const pathname = usePathname();
    const isHome = pathname === '/';

    const navItems = [
        { label: 'Producto', href: '#producto' },
        { label: 'Instituciones', href: '#instituciones' },
        { label: 'Seguridad', href: '#seguridad' },
        { label: 'Precios', href: '#precios' },
    ];

    return (
        <header className="border-border sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
            <div className="mx-auto grid grid-cols-2 items-center px-6 py-5 md:grid-cols-3 md:px-14">
                {/* Left: Lockup */}
                <div className="flex justify-start">
                    <Link
                        href="/"
                        aria-label="Aulika"
                        className="transition-opacity hover:opacity-90"
                    >
                        <LogoLockup size={22} variant="cobalto" />
                    </Link>
                </div>

                {/* Center: Nav links */}
                <nav className="hidden items-center justify-center gap-8 md:flex">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={isHome ? item.href : `/${item.href}`}
                            className="text-ink-dim hover:text-ink text-[14px] font-medium transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                    <Link
                        href="/aulika-online/cursos"
                        className="text-ink-dim hover:text-ink text-[14px] font-medium transition-colors"
                    >
                        Cursos
                    </Link>
                    <Link
                        href="/demo"
                        className="text-primary hover:text-primary/80 text-[14px] font-semibold transition-colors"
                    >
                        Demo
                    </Link>
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hidden text-[13px] font-bold sm:inline-flex"
                    >
                        <Link href="/students/examen/login">Acceso alumnos</Link>
                    </Button>
                    <Button
                        variant="ink"
                        size="sm"
                        asChild
                        className="h-9 px-5 text-[13px] font-bold"
                    >
                        <Link href="/login">Acceso docentes →</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
