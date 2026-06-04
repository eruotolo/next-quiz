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
                <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="border-border rounded-[22px] border bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                        <h3 className="font-display text-ink mb-3 text-[22px] font-medium">
                            Para Profesores
                        </h3>
                        <p className="text-ink-dim mb-6 text-[14.5px] leading-relaxed">
                            Aprende a gestionar tus cursos, crear preguntas y revisar resultados de
                            forma eficiente.
                        </p>
                        <Link
                            href="/recursos/guia-profes"
                            className="text-primary flex items-center gap-2 text-[13px] font-bold tracking-widest uppercase hover:underline"
                        >
                            Ir a la guía <span className="text-[18px]">→</span>
                        </Link>
                    </div>
                    <div className="border-border rounded-[22px] border bg-white p-8 opacity-80 shadow-sm">
                        <h3 className="font-display text-ink mb-3 text-[22px] font-medium">
                            Para Estudiantes
                        </h3>
                        <p className="text-ink-dim mb-6 text-[14.5px] leading-relaxed">
                            Cómo ingresar a tu examen, guardar respuestas y ver tus notas sin
                            complicaciones.
                        </p>
                        <span className="text-mute bg-paper-warm rounded px-2 py-1 font-mono text-[10px] font-bold tracking-widest uppercase">
                            Próximamente
                        </span>
                    </div>
                </div>
                <div className="bg-ink relative overflow-hidden rounded-[22px] p-12 text-center text-white">
                    {/* Pattern Overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-size-[20px_20px] opacity-[0.05]" />

                    <div className="relative z-10">
                        <h3 className="font-display mb-4 text-[32px] font-medium">
                            ¿No encuentras lo que buscas?
                        </h3>
                        <p className="mx-auto mb-8 max-w-[500px] text-[16px] text-white/60">
                            Nuestro equipo técnico responde en menos de 2 horas durante el horario
                            de jornada escolar.
                        </p>
                        <Link
                            href="mailto:hola@aulika.cl"
                            className="bg-lime text-ink shadow-lime/20 inline-block rounded-full px-8 py-4 text-[15px] font-bold shadow-lg transition-transform hover:scale-105"
                        >
                            Contactar a Soporte
                        </Link>
                    </div>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
