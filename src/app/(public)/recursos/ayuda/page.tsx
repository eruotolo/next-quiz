import Link from 'next/link';
import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export default function AyudaPage() {
    return (
        <>
            <L3SubpageLayout
                tag="RECURSOS · SOPORTE"
                title="Centro de Ayuda."
                description="¿Tienes dudas? Estamos aquí para ayudarte a sacar el máximo provecho de Aulika."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="p-8 bg-white border border-border rounded-[22px] shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-display text-[22px] font-medium text-ink mb-3">Para Profesores</h3>
                        <p className="text-[14.5px] text-ink-dim mb-6 leading-relaxed">Aprende a gestionar tus cursos, crear preguntas y revisar resultados de forma eficiente.</p>
                        <Link href="/recursos/guia-profes" className="text-primary font-bold text-[13px] uppercase tracking-widest hover:underline flex items-center gap-2">
                            Ir a la guía <span className="text-[18px]">→</span>
                        </Link>
                    </div>
                    <div className="p-8 bg-white border border-border rounded-[22px] shadow-sm opacity-80">
                        <h3 className="font-display text-[22px] font-medium text-ink mb-3">Para Estudiantes</h3>
                        <p className="text-[14.5px] text-ink-dim mb-6 leading-relaxed">Cómo ingresar a tu examen, guardar respuestas y ver tus notas sin complicaciones.</p>
                        <span className="text-[10px] font-mono font-bold text-mute uppercase tracking-widest bg-paper-warm px-2 py-1 rounded">Próximamente</span>
                    </div>
                </div>
                <div className="bg-ink text-white p-12 rounded-[22px] text-center relative overflow-hidden">
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-size-[20px_20px]" />
                    
                    <div className="relative z-10">
                        <h3 className="font-display text-[32px] font-medium mb-4">¿No encuentras lo que buscas?</h3>
                        <p className="text-white/60 text-[16px] mb-8 max-w-[500px] mx-auto">Nuestro equipo técnico responde en menos de 2 horas durante el horario de jornada escolar.</p>
                        <Link href="mailto:hola@aulika.cl" className="bg-lime text-ink px-8 py-4 rounded-full font-bold text-[15px] inline-block hover:scale-105 transition-transform shadow-lg shadow-lime/20">
                            Contactar a Soporte
                        </Link>
                    </div>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
