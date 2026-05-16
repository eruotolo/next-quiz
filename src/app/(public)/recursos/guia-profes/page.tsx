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
                <div className="space-y-16 text-ink-dim leading-relaxed">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            ['1. Crea tu cuenta', 'Accede con tu correo institucional y configura tu perfil en segundos.'],
                            ['2. Arma tu banco', 'Escribe o importa tus preguntas. Usa tags para organizar por unidad.'],
                            ['3. Lanza el examen', 'Define fecha y duración. Comparte el código y monitorea en vivo.'],
                        ].map(([title, desc], i) => (
                            <div key={title} className="p-8 bg-white border border-border rounded-[22px] shadow-sm">
                                <div className="font-mono text-[11px] font-bold text-primary tracking-widest mb-4 opacity-60">
                                    PASO {String(i + 1).padStart(2, '0')}
                                </div>
                                <h3 className="font-display text-[20px] font-medium text-ink mb-3">{title}</h3>
                                <p className="text-[14px] leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>

                    <section className="bg-lime/10 p-10 rounded-[22px] border border-lime/20 relative overflow-hidden">
                        <div className="absolute right-[-20px] top-[-20px] size-40 bg-lime opacity-10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <h3 className="font-display text-[24px] font-medium text-ink mb-4">¿Necesitas ayuda adicional?</h3>
                            <p className="text-[16px] text-ink-dim max-w-[600px] mb-6">
                                Nuestro equipo de soporte pedagógico está disponible vía WhatsApp y correo para guiarte en tu primera aplicación masiva. No caminas solo en esta transición.
                            </p>
                            <Link href="mailto:hola@aulika.cl" className="text-primary font-bold text-[14px] uppercase tracking-widest hover:underline">
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
