'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoLockup } from '@/shared/components/branding/logo';
import { Button } from '@/shared/components/ui/button';

export function PublicNav(): React.JSX.Element {
    const pathname = usePathname();
    const isHome = pathname === '/';

    const navItems = [
        { label: 'Producto', href: '#producto' },
        { label: 'Instituciones', href: '#instituciones' },
        { label: 'Seguridad', href: '#seguridad' },
        { label: 'Precios', href: '#precios' },
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
            <div className="mx-auto grid grid-cols-2 md:grid-cols-3 items-center py-5 px-6 md:px-14">
                {/* Left: Lockup */}
                <div className="flex justify-start">
                    <Link href="/" aria-label="Aulika" className="transition-opacity hover:opacity-90">
                        <LogoLockup size={22} variant="cobalto" />
                    </Link>
                </div>

                {/* Center: Nav links */}
                <nav className="hidden justify-center items-center gap-8 md:flex">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={isHome ? item.href : `/${item.href}`}
                            className="text-[14px] font-medium text-ink-dim transition-colors hover:text-ink"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-[13px] font-bold">
                        <Link href="/examen/login">Acceso alumnos</Link>
                    </Button>
                    <Button variant="ink" size="sm" asChild className="text-[13px] font-bold h-9 px-5">
                        <Link href="/login">Acceso docentes →</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
