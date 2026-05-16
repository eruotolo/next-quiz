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
            { label: 'Contacto', href: 'mailto:hola@aulika.cl' },
        ],
    },
];

export function L3Footer(): React.JSX.Element {
    return (
        <footer className="border-t border-border bg-paper-warm pt-20 pb-10">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                {/* Main grid */}
                <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
                    {/* Brand */}
                    <div className="flex flex-col gap-6">
                        <LogoLockup size={26} variant="cobalto" />
                        <p className="text-[13px] leading-relaxed text-ink-dim max-w-[280px]">
                            La plataforma de evaluación en línea para colegios y universidades chilenas. Hecha en Santiago, pensada para el aula.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Tag tone="outline" className="bg-white border-border text-[11px] h-6 px-2.5">aulika.cl</Tag>
                            <Tag tone="outline" className="bg-white border-border text-[11px] h-6 px-2.5">hola@aulika.cl</Tag>
                        </div>
                    </div>

                    {/* Link columns */}
                    {FOOTER_COLS.map((col) => (
                        <div key={col.heading}>
                            <h4 className="mb-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                                {col.heading}
                            </h4>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-[13px] text-ink hover:text-primary transition-colors font-medium"
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
                <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-border/50 pt-8 font-mono text-[10px] font-bold uppercase tracking-widest text-mute sm:flex-row">
                    <p>
                        <a target="_blank" rel="noopener" href="https://crowadvance.com">Crow Advance</a> © {new Date().getFullYear()} · Hecho en Castro, Chiloé, Chile</p>
                    <div className="flex items-center gap-6">
                        <Link href="/examen/login" className="hover:text-ink transition-colors">Acceso alumnos</Link>
                        <Link href="/login" className="hover:text-ink transition-colors">Acceso docentes</Link>
                        <span className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-success animate-pulse" />
                            Operativo
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
