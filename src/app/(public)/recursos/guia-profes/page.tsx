import Link from 'next/link';
import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export default function GuiaProfesPage() {
    return (
        <>
            <L3SubpageLayout
                tag="RECURSOS · GUÍA"
                title="Primeros pasos con Aulika."
                description="Todo lo que necesitas saber para transformar tu aula en un entorno de evaluación digital eficiente y moderno."
            >
                <div className="text-ink-dim space-y-16 leading-relaxed">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[
                            [
                                '1. Crea tu cuenta',
                                'Accede con tu correo institucional y configura tu perfil en segundos.',
                            ],
                            [
                                '2. Arma tu banco',
                                'Escribe o importa tus preguntas. Usa tags para organizar por unidad.',
                            ],
                            [
                                '3. Lanza el examen',
                                'Define fecha y duración. Comparte el código y monitorea en vivo.',
                            ],
                        ].map(([title, desc], i) => (
                            <div
                                key={title}
                                className="border-border rounded-[22px] border bg-white p-8 shadow-sm"
                            >
                                <div className="text-primary mb-4 font-mono text-[11px] font-bold tracking-widest opacity-60">
                                    PASO {String(i + 1).padStart(2, '0')}
                                </div>
                                <h3 className="font-display text-ink mb-3 text-[20px] font-medium">
                                    {title}
                                </h3>
                                <p className="text-[14px] leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>

                    <section className="bg-lime/10 border-lime/20 relative overflow-hidden rounded-[22px] border p-10">
                        <div className="bg-lime absolute top-[-20px] right-[-20px] size-40 rounded-full opacity-10 blur-3xl" />
                        <div className="relative z-10">
                            <h3 className="font-display text-ink mb-4 text-[24px] font-medium">
                                ¿Necesitas ayuda adicional?
                            </h3>
                            <p className="text-ink-dim mb-6 max-w-[600px] text-[16px]">
                                Nuestro equipo de soporte pedagógico está disponible vía WhatsApp y
                                correo para guiarte en tu primera aplicación masiva. No caminas solo
                                en esta transición.
                            </p>
                            <Link
                                href="mailto:hola@aulika.cl"
                                className="text-primary text-[14px] font-bold tracking-widest uppercase hover:underline"
                            >
                                Agendar capacitación gratuita →
                            </Link>
                        </div>
                    </section>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
