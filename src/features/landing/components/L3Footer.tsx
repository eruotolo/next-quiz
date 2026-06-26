import Link from 'next/link';
import { LogoLockup } from '@/shared/components/branding/logo';
import { Tag } from '@/shared/components/ui/badge';

const FOOTER_COLS = [
    {
        heading: 'Producto',
        links: [
            { label: 'Características', href: '/#producto' },
            { label: 'Banco de preguntas', href: '/#producto' },
            { label: 'Resultados en vivo', href: '/#producto' },
            { label: 'Seguridad', href: '/#seguridad' },
            { label: 'Precios', href: '/#precios' },
        ],
    },
    {
        heading: 'Audiencias',
        links: [
            { label: 'Colegios', href: '/audiencias/colegios' },
            { label: 'Preuniversitarios', href: '/audiencias/preuniversitarios' },
            { label: 'Universidades', href: '/audiencias/universidades' },
            { label: 'UTPs', href: '/audiencias/utps' },
            { label: 'Directores', href: '/audiencias/directores' },
        ],
    },
    {
        heading: 'Recursos',
        links: [
            { label: 'Guía para profes', href: '/recursos/guia-profes' },
            { label: 'Plantillas PAES', href: '/recursos/plantillas-paes' },
            { label: 'Centro de ayuda', href: '/recursos/ayuda' },
            { label: 'Estado del sistema', href: '/recursos/estado' },
        ],
    },
    {
        heading: 'Empresa',
        links: [
            { label: 'Manifiesto', href: '/empresa/manifiesto' },
            { label: 'Historia', href: '/empresa/historia' },
            { label: 'Equipo', href: '/empresa/equipo' },
            { label: 'Contacto', href: 'mailto:info@aulika.cl' },
        ],
    },
];

export function L3Footer() {
    return (
        <footer className="border-border bg-paper-warm border-t pt-20 pb-10">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                {/* Main grid */}
                <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
                    {/* Brand */}
                    <div className="flex flex-col gap-6">
                        <LogoLockup size={26} variant="cobalto" />
                        <p className="text-ink-dim max-w-[280px] text-[13px] leading-relaxed">
                            La plataforma de evaluación en línea para colegios y universidades
                            chilenas. Hecha en Castro, Chiloé, pensada para el aula.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <Tag
                                tone="outline"
                                className="border-border h-6 bg-white px-2.5 text-[11px]"
                            >
                                aulika.cl
                            </Tag>
                            <Tag
                                tone="outline"
                                className="border-border h-6 bg-white px-2.5 text-[11px]"
                            >
                                info@aulika.cl
                            </Tag>
                            <a
                                href="https://www.instagram.com/aulika.cl/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border-border text-ink-dim hover:border-primary/30 hover:text-primary flex size-6 items-center justify-center rounded-full border bg-white shadow-sm transition-all hover:scale-110"
                                title="Síguenos en Instagram"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-3.5"
                                >
                                    <title>Instagram</title>
                                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Link columns */}
                    {FOOTER_COLS.map((col) => (
                        <div key={col.heading}>
                            <h4 className="text-mute mb-5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                                {col.heading}
                            </h4>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-ink hover:text-primary text-[13px] font-medium transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="border-border/50 text-mute mt-20 flex flex-col items-start justify-between gap-6 border-t pt-8 font-mono text-[10px] font-bold tracking-widest uppercase sm:flex-row sm:items-center">
                    <p>
                        <a target="_blank" rel="noopener" href="https://crowadvance.com">
                            Crow Advance EIRL
                        </a>{' '}
                        © {new Date().getFullYear()} · RUT 27.039.635-6 · Chonchi, Chiloé, Chile
                    </p>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <Link
                            href="/empresa/privacidad"
                            className="hover:text-ink transition-colors"
                        >
                            Privacidad
                        </Link>
                        <Link
                            href="/empresa/terminos"
                            className="hover:text-ink transition-colors"
                        >
                            Términos
                        </Link>
                        <Link href="/examen/login" className="hover:text-ink transition-colors">
                            Acceso alumnos
                        </Link>
                        <Link href="/login" className="hover:text-ink transition-colors">
                            Acceso docentes
                        </Link>
                        <span className="flex items-center gap-1.5">
                            <span className="bg-success size-1.5 animate-pulse rounded-full" />
                            Operativo
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
